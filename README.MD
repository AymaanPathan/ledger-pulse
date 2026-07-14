# LedgerPulse — How the System Works

LedgerPulse is a full-stack smart financial ledger. You log transactions,
and the system automatically tracks your balance, surfaces spending trends,
and **watches your spending in the background to warn you when something
looks off** — an unusually large expense, a sudden weekly spike, or your
month going cash-flow negative.

This document explains how the backend and frontend fit together end to
end.

---

## 1. High-level architecture

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│  Next.js Frontend        │        │  Express Backend               │
│  (App Router)             │        │                                 │
│                            │  HTTP  │  ┌───────────┐                  │
│  Redux Toolkit store  ────┼───────▶│  │  Routes    │                  │
│  (transactions,           │  JSON  │  └─────┬─────┘                  │
│   notifications,          │        │        ▼                        │
│   dashboard slices)        │        │  ┌───────────┐   ┌───────────┐ │
│                            │        │  │Controllers │   │  Services  │ │
│  Recharts, Tailwind UI     │        │  └─────┬─────┘   └─────┬─────┘ │
└─────────────────────────┘        │        │                │       │
                                     │        ▼                ▼       │
                                     │   ┌─────────┐     ┌───────────┐ │
                                     │   │ Prisma  │     │  Redis     │ │
                                     │   │ (Postgres)│    │ (cache)    │ │
                                     │   └─────────┘     └───────────┘ │
                                     └──────────────────────────────┘
```

- **Frontend**: Next.js (App Router) + Redux Toolkit + Recharts, talking to
  the backend over plain REST/JSON.
- **Backend**: Express + TypeScript + Prisma (Postgres) + Redis, exposing
  three resources — Transactions, Notifications, Dashboard — under `/api`.
- **The connective tissue**: every time a transaction is created, the
  backend runs an **anomaly-detection pass** that can silently generate
  notifications, and it invalidates the dashboard cache so numbers stay
  fresh. Nothing on the frontend has to know this is happening — it just
  polls `/notifications` and `/dashboard/summary` and reflects whatever
  comes back.

---

## 2. Backend structure

```
src/
├── index.ts                 # process entrypoint — starts the server, handles graceful shutdown
├── app.ts                   # builds the Express app: middleware + route mounting
├── routes/
│   ├── transaction.routes.ts
│   ├── notification.routes.ts
│   └── dashboard.routes.ts
├── controllers/              # thin HTTP layer — parse req, call a service, shape the response
├── services/
│   ├── transaction.service.ts
│   ├── notification.service.ts
│   ├── dashboard.service.ts
│   └── anomaly.service.ts    # the "brain" — runs after every new transaction
└── lib/
    ├── db.ts                 # Prisma client singleton
    ├── redis.ts               # Redis client + safe cache helpers
    ├── ApiError.ts             # typed HTTP errors (404, validation, etc.)
    └── errorHandler.ts          # centralized error + 404 middleware
```

**Layering convention**: `routes` → `controllers` → `services` → `Prisma`.
Controllers never talk to Prisma directly; services own all business logic
and database access, which is what makes `anomaly.service.ts` reusable and
testable independently of the HTTP layer.

### 2.1 App bootstrap (`index.ts` + `app.ts`)

- `app.ts` builds the Express app: `helmet` for security headers, `cors`
  scoped to `CLIENT_ORIGIN` (your Next.js dev server), JSON body parsing,
  `morgan` request logging, a `/health` check, the three resource routers
  mounted under `/api`, and finally a 404 handler + centralized error
  handler.
- `index.ts` is the actual process entrypoint. It loads `.env`, starts the
  HTTP server, and wires `SIGINT`/`SIGTERM` to a graceful shutdown that
  closes the server, disconnects Prisma, and disconnects Redis before
  exiting — so deploys/restarts don't drop in-flight requests or leak
  connections.

### 2.2 Transactions — the core resource

`transaction.service.ts` handles full CRUD (`listTransactions`,
`getTransactionById`, `createTransaction`, `updateTransaction`,
`deleteTransaction`), backed by Prisma against Postgres.

`listTransactions` supports:
- **Pagination** (`page`, `limit`)
- **Filtering** by `type` (INCOME/EXPENSE), `category` (case-insensitive),
  free-text `search` across description + category, and a `startDate`/
  `endDate` range
- **Sorting** by `date`, `amount`, or `createdAt`, asc or desc

Every **create**, **update**, or **delete** calls
`invalidateDashboardCache()`, which deletes any Redis key matching
`dashboard:*`. This is what makes the dashboard numbers self-correcting —
the frontend doesn't need to manually refetch anything special; the cache
is just gone, so the next `/dashboard/summary` call recomputes from Postgres.

**`createTransaction` also triggers anomaly detection** (see §2.4) right
after the row is written, wrapped in a `try/catch` so a bug in the anomaly
logic can never fail the actual transaction write — the user's data is
always saved first, alerts are best-effort on top.

### 2.3 Notifications

`notification.service.ts` is a simple, generic notification store:

- `createNotification({ type, severity, message, meta })` — used
  internally by the anomaly service (not exposed as its own public route).
- `listNotifications(page, limit, unreadOnly)` — returns items + an
  `unreadCount` + pagination metadata in one call, which is exactly the
  shape the frontend's `notificationSlice` expects.
- `markNotificationRead(id)` / `markAllNotificationsRead()`.

**De-duplication**: before creating a notification, it checks whether an
identical `type` + `message` was created in the last hour
(`DEDUPE_WINDOW_MS`). If so, it returns the existing row instead of
creating a duplicate. This is why, per the testing guide, firing the same
anomaly condition repeatedly within an hour still results in exactly one
notification — important because a burst of transactions could otherwise
spam the user with ten identical "negative cash flow" alerts.

### 2.4 Anomaly detection — the interesting part

`anomaly.service.ts` runs three independent checks every time a new
transaction is created, via `analyzeNewTransaction(tx)`. They run with
`Promise.allSettled`, so one check failing (e.g. a bad query) never blocks
the other two.

**a) High expense anomaly** (`checkHighExpenseAnomaly`)
Only runs for `EXPENSE` transactions above an absolute floor
(`HIGH_EXPENSE_ABS_FLOOR`, default ₹5000 — small expenses are never
flagged regardless of history). Then it looks at the last 20 transactions
in the same category:
- **Fewer than 5 prior transactions in that category** → not enough data
  to judge statistically, so it fires a low-confidence `INFO` notification
  just based on the absolute floor.
- **5 or more prior transactions** → computes the mean and standard
  deviation of past amounts in that category, and a **z-score** for the
  new transaction. If the z-score clears `HIGH_EXPENSE_ZSCORE_THRESHOLD`
  (default 2, i.e. ~2 standard deviations above your usual spend in that
  category), it fires a `WARNING` with the z-score attached in `meta`.

**b) Weekly spike** (`checkWeeklySpike`)
Only runs for `EXPENSE` transactions. Sums this calendar week's expenses
(Sunday-start) vs. last week's. If there's no spending last week, it skips
(no baseline to compare against). Otherwise, if this week's total is
`WEEKLY_SPIKE_PERCENT_THRESHOLD`% (default 35%) or more above last week's,
it fires a `WARNING`.

**c) Negative cash flow** (`checkNegativeCashFlow`)
Runs on **every** transaction (income or expense), since income changes
can pull a month back into the black. Sums this month's income and
expenses to date; if expenses exceed income, fires a `CRITICAL`
notification with the shortfall amount.

All three are tunable via environment variables without touching code —
useful for demoing different sensitivities.

### 2.5 Dashboard + caching

`dashboard.service.ts`'s `getDashboardSummary()`:

1. Checks Redis for a cached summary (`dashboard:summary`, 30s TTL). If
   present, returns it immediately — this is why the second of two rapid
   `/dashboard/summary` calls in the testing guide is faster than the
   first.
2. On a cache miss, it runs three queries in parallel: total income
   aggregate, total expense aggregate, and every transaction (for the
   monthly breakdown). `totalBalance = totalIncome - totalExpense`.
3. Builds a **6-month rolling window** (current month + previous 5),
   pre-seeded with zeroed buckets so months with no activity still show up
   as flat `₹0` points on the chart instead of gaps — this is what feeds
   `monthlyCashFlow` in the frontend's `CashFlowChart`.
4. Writes the result back to Redis before returning it.

Because `createTransaction`/`updateTransaction`/`deleteTransaction` all
call `cacheDel("dashboard:*")`, the cache is invalidated the moment
underlying data changes — you never see stale totals for longer than a
write takes, even though reads are cached for 30s.

Redis itself is treated as **non-critical infrastructure**: `cacheGet`,
`cacheSet`, and `cacheDel` all swallow errors internally, and the Redis
client's `error` handler just logs rather than crashing the process. If
Redis is down, the dashboard just recomputes from Postgres on every
request — slower, but never broken.

---

## 3. Frontend structure

```
src/
├── app/
│   ├── layout.tsx              # root layout — mounts Sidebar + Header, wraps in ReduxProvider
│   ├── page.tsx                 # Dashboard (financial overview)
│   ├── transactions/page.tsx    # Transactions list + filters + form
│   └── notifications/page.tsx   # Notifications list
├── components/
│   ├── layout/                  # Sidebar, Header
│   ├── dashboard/                # SummaryCards, CashFlowChart
│   ├── transactions/              # TransactionTable, TransactionForm, TransactionFilters, Pagination
│   ├── notifications/              # NotificationList, NotificationItem
│   ├── providers/ReduxProvider.tsx
│   └── ui/                        # Card, Button, Badge — shared primitives
├── store/
│   ├── hooks.ts                    # typed useAppDispatch / useAppSelector
│   └── slices/
│       ├── transactionSlice.ts
│       ├── notificationSlice.ts
│       └── dashboardSlice.ts
├── api/                              # thin Axios wrappers per resource
├── types/                             # Transaction, AppNotification, DashboardSummary, etc.
└── lib/utils.ts                        # cn(), formatCurrency(), formatDate(), formatCompactCurrency()
```

### 3.1 Data flow pattern (consistent across all three features)

Every page follows the same shape:

1. A page component (`app/.../page.tsx`) reads state via a typed
   `useAppSelector` and dispatches a `fetchX` thunk in a `useEffect`.
2. The relevant Redux slice's thunk calls the matching function in
   `api/` (an Axios wrapper around one backend endpoint).
3. `extraReducers` in the slice handle `pending` / `fulfilled` /
   `rejected`, updating a `status` field (`idle | loading | succeeded |
   failed`) plus the actual data.
4. The page — or a child component — branches on `status` and
   data-presence to render a loading state, an empty state, an error
   state, or the real content. All three slices guard against the API
   returning missing `data`/`meta` fields (falls back to `[]` / `0` /
   sensible defaults) so a partial or empty response never crashes
   rendering.

This is why, for example, the Dashboard shows "Loading dashboard...",
then either "No data available." or the real `SummaryCards` +
`CashFlowChart`, entirely driven by `status` and `summary` in
`dashboardSlice`.

### 3.2 Dashboard page

- `SummaryCards` renders four cards (Total balance, Revenue, Expenses, Net
  cash flow) from `DashboardSummary`, each with a change-percent badge
  (green up-arrow / red down-arrow depending on sign) versus last month.
- `CashFlowChart` renders `summary.monthlyCashFlow` as a Recharts
  `AreaChart` — one line for cash in, one for cash out — with a gradient
  fill under the income line.
- Both use a `data-reveal` attribute that triggers a one-time CSS
  entrance animation (fade + slide up) on mount, staggered per-card via
  `animationDelay`.

### 3.3 Transactions page

- `TransactionFilters` writes into `transactionSlice.filters`
  (type/category/search/date range/sort), which re-triggers
  `fetchTransactions` whenever it changes (the `useEffect` dependency is
  `filters`).
- `TransactionTable` renders the current page of results, with inline
  delete (dispatches `deleteTransaction`, which optimistically removes the
  row from `items` on success).
- `TransactionForm` dispatches `createTransaction`, which prepends the new
  row to `items` on success.
- `Pagination` reads `meta.page` / `meta.totalPages` / `meta.total` from
  the slice to drive page controls.

### 3.4 Notifications page

- `NotificationList` fetches on mount, shows unread count in the header,
  and has a "Mark all read" button (disabled when `unreadCount === 0`)
  that dispatches `markAllNotificationsRead`.
- `NotificationItem` renders each row with a "Mark read" action that
  dispatches `markNotificationRead(id)` — the slice updates that item's
  `isRead` flag and decrements `unreadCount` locally, so the UI doesn't
  need to refetch the whole list just to reflect one read.

### 3.5 Layout

`app/layout.tsx` wraps everything in `ReduxProvider`, then lays out
`Sidebar` (fixed-width, full-height, in normal flex flow — not
absolutely/fixed positioned, which is what makes the content column sit
correctly beside it rather than underneath it) next to a column containing
`Header` and a scrollable `<main>`.

---

## 4. End-to-end example: what happens when you add an expense

1. User submits `TransactionForm` → frontend dispatches
   `createTransaction(payload)`.
2. Thunk calls `POST /api/transactions` via `transactionsApi.create`.
3. Backend: `transaction.routes.ts` → controller validates the body →
   `transaction.service.ts#createTransaction`:
   - Writes the row via Prisma.
   - Calls `cacheDel("dashboard:*")` — dashboard cache is now cold.
   - Calls `analyzeNewTransaction(tx)`:
     - Checks if it's a statistically/absolutely high expense for its
       category → maybe creates a `HIGH_EXPENSE` notification.
     - Checks this week's total spend vs. last week's → maybe creates a
       `WEEKLY_SPIKE` notification.
     - Checks this month's running income vs. expense → maybe creates a
       `NEGATIVE_CASH_FLOW` notification.
   - Returns the created transaction.
4. Frontend: `createTransaction.fulfilled` unshifts the new transaction
   into `transactionSlice.items` — the table updates instantly, no
   refetch needed.
5. Next time the user visits the Dashboard, `fetchDashboardSummary` hits a
   cold cache, recomputes fresh totals (now including the new expense),
   and re-caches for 30s.
6. Next time the user visits Notifications, `fetchNotifications` picks up
   any new `HIGH_EXPENSE` / `WEEKLY_SPIKE` / `NEGATIVE_CASH_FLOW` rows
   that were silently created in step 3.

Nothing pushes notifications to the frontend in real time — the whole
system is pull-based (fetch on mount / on navigation), which keeps both
sides simple. If you want live updates later, the natural next step would
be polling `/notifications?unreadOnly=true` on an interval, or upgrading
to WebSockets/SSE from the same `createNotification` call site.

---

## 5. Environment variables (backend)

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | — | Postgres connection string (Prisma) |
| `REDIS_URL` | `redis://localhost:6380` | Redis connection string |
| `PORT` | `4000` | HTTP port |
| `CLIENT_ORIGIN` | `http://localhost:3000` | Allowed CORS origin (the Next.js app) |
| `HIGH_EXPENSE_ABS_FLOOR` | `5000` | Minimum ₹ amount before an expense is even considered for anomaly checks |
| `HIGH_EXPENSE_ZSCORE_THRESHOLD` | `2` | Std-devs above category average to trigger a WARNING |
| `WEEKLY_SPIKE_PERCENT_THRESHOLD` | `35` | % week-over-week increase to trigger a WARNING |

Note: the `README` testing guide's example `.env` shows `REDIS_URL` on
port `6379`, while `redis.ts`'s fallback default is `6380` — make sure
your actual `.env` value matches whatever port your local Redis is really
running on.

---

## 6. Resilience principles baked into the backend

- **Redis is optional at runtime.** Every cache read/write is wrapped so a
  Redis outage degrades performance (no caching), never availability.
- **Anomaly detection is optional at runtime.** Wrapped in `try/catch`
  around the transaction write path — a bug in a statistical check can
  never block you from saving a transaction.
- **Anomaly checks run independently of each other** via
  `Promise.allSettled` — one throwing doesn't stop the others.
- **Notifications de-duplicate** within a 1-hour window per `type` +
  `message`, so a burst of qualifying transactions can't spam the same
  alert repeatedly.
- **The dashboard cache invalidates on every write**, so cached data is
  never more than one read-cycle away from correct, even though it's
  cached for up to 30 seconds between writes.