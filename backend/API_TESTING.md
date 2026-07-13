# Expense Tracker Backend — API Testing Guide

This README walks through how to spin up the backend and exercise every
endpoint (Transactions, Notifications, Dashboard) plus the anomaly-detection
side effects (high expense alerts, weekly spike alerts, negative cash flow
alerts).

> **Assumption:** the three routers (`transaction.route.ts`,
> `notification.route.ts`, `dashboard.route.ts`) are mounted under `/api` in
> your `app.ts`/`server.ts`, e.g.:
> ```ts
> app.use("/api/transactions", transactionRouter);
> app.use("/api/notifications", notificationRouter);
> app.use("/api/dashboard", dashboardRouter);
> ```
> If your actual prefixes differ, just adjust the base URL below.

---

## 1. Prerequisites

- Node.js + npm/pnpm/yarn
- PostgreSQL (or whatever DB Prisma is pointed at) running and migrated
- Redis running (used for dashboard caching)
- A `.env` with at least:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker"
REDIS_URL="redis://localhost:6379"

# Anomaly detection tuning (all optional — defaults shown)
HIGH_EXPENSE_ABS_FLOOR=5000
HIGH_EXPENSE_ZSCORE_THRESHOLD=2
WEEKLY_SPIKE_PERCENT_THRESHOLD=35
```

## 2. Setup & Run

```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

By default we'll assume the server runs on `http://localhost:3000`. Set this
as a shell variable so the examples below are copy-pasteable:

```bash
export BASE_URL="http://localhost:3000/api"
```

---

## 3. Endpoint Reference

| Method | Path                            | Purpose                        |
|--------|---------------------------------|---------------------------------|
| POST   | `/transactions`                 | Create a transaction            |
| GET    | `/transactions`                 | List transactions (filters/pagination) |
| GET    | `/transactions/:id`             | Get one transaction             |
| PUT    | `/transactions/:id`             | Update a transaction            |
| DELETE | `/transactions/:id`             | Delete a transaction            |
| GET    | `/notifications`                | List notifications              |
| PATCH  | `/notifications/:id/read`       | Mark one notification read      |
| PATCH  | `/notifications/read-all`       | Mark all notifications read     |
| GET    | `/dashboard/summary`            | Cached dashboard summary        |

---

## 4. Testing Transactions

### 4.1 Create a normal transaction (income)

```bash
curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 60000,
    "type": "INCOME",
    "category": "Salary",
    "description": "July salary",
    "date": "2026-07-01T00:00:00.000Z"
  }' | jq
```

Expect `201` with `{ success: true, data: { id, amount, type, ... } }`.

### 4.2 Create a normal expense

```bash
curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1200,
    "type": "EXPENSE",
    "category": "Groceries",
    "description": "Weekly groceries",
    "date": "2026-07-05T00:00:00.000Z"
  }' | jq
```

### 4.3 List transactions (pagination + filters)

```bash
# Basic list
curl -s "$BASE_URL/transactions?page=1&limit=10" | jq

# Filter by type
curl -s "$BASE_URL/transactions?type=EXPENSE" | jq

# Filter by category (case-insensitive)
curl -s "$BASE_URL/transactions?category=groceries" | jq

# Free-text search across description/category
curl -s "$BASE_URL/transactions?search=salary" | jq

# Date range
curl -s "$BASE_URL/transactions?startDate=2026-07-01&endDate=2026-07-31" | jq

# Sorting
curl -s "$BASE_URL/transactions?sortBy=amount&sortOrder=desc" | jq
```

### 4.4 Get a single transaction

```bash
curl -s "$BASE_URL/transactions/<TRANSACTION_ID>" | jq
```

Expect `404` with an `ApiError` body if the id doesn't exist.

### 4.5 Update a transaction

```bash
curl -s -X PUT "$BASE_URL/transactions/<TRANSACTION_ID>" \
  -H "Content-Type: application/json" \
  -d '{ "amount": 1500, "description": "Updated groceries amount" }' | jq
```

### 4.6 Delete a transaction

```bash
curl -s -X DELETE "$BASE_URL/transactions/<TRANSACTION_ID>" -o /dev/null -w "%{http_code}\n"
```

Expect `204`.

---

## 5. Testing the Anomaly Detection Side Effects

These run automatically inside `createTransaction` (via
`analyzeNewTransaction`), so you trigger them just by posting the right
transactions. Then check `/notifications` afterward.

### 5.1 High expense — not enough history (INFO)

With a brand-new category (fewer than 5 prior EXPENSE rows in that category)
and an amount above `HIGH_EXPENSE_ABS_FLOOR` (default ₹5000):

```bash
curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 7000,
    "type": "EXPENSE",
    "category": "Electronics",
    "description": "New monitor",
    "date": "2026-07-06T00:00:00.000Z"
  }' | jq
```

Then:

```bash
curl -s "$BASE_URL/notifications?unreadOnly=true" | jq
```

You should see a `HIGH_EXPENSE` / `INFO` notification mentioning "not enough
history yet."

### 5.2 High expense — statistical anomaly (WARNING)

Seed at least 5 "normal" expenses in the same category first, then post an
outlier:

```bash
# Seed 5 normal expenses (~₹800-1200) in "Dining"
for amt in 800 900 1000 1100 1200; do
  curl -s -X POST "$BASE_URL/transactions" \
    -H "Content-Type: application/json" \
    -d "{\"amount\": $amt, \"type\": \"EXPENSE\", \"category\": \"Dining\", \"date\": \"2026-06-2${amt: -1}T00:00:00.000Z\"}" > /dev/null
done

# Now post an outlier well above ABS_FLOOR and several std devs above avg
curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9000,
    "type": "EXPENSE",
    "category": "Dining",
    "description": "Anniversary dinner",
    "date": "2026-07-07T00:00:00.000Z"
  }' | jq

curl -s "$BASE_URL/notifications?unreadOnly=true" | jq
```

You should see a `HIGH_EXPENSE` / `WARNING` notification with a `zScore` in
`meta`.

> Note: the amount also needs to clear `ABS_FLOOR` (₹5000 default) — an
> outlier below that floor won't fire at all, by design.

### 5.3 Weekly spike (WARNING)

This compares the sum of this calendar week's expenses vs last week's. Seed
some expenses dated last week, then push several dated this week so the
total is ≥35% higher:

```bash
# Last week's baseline expense
curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{"amount": 2000, "type": "EXPENSE", "category": "Misc", "date": "2026-07-01T00:00:00.000Z"}' > /dev/null

# This week — enough to be >35% higher than last week's total
curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{"amount": 3000, "type": "EXPENSE", "category": "Misc", "date": "2026-07-13T00:00:00.000Z"}' | jq

curl -s "$BASE_URL/notifications?unreadOnly=true" | jq
```

Adjust dates so "this week" and "last week" line up with `now` when you run
the test (the service computes week boundaries from `tx.date`, starting on
Sunday).

### 5.4 Negative cash flow (CRITICAL)

Post expenses this month that exceed income this month:

```bash
curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "type": "INCOME", "category": "Freelance", "date": "2026-07-02T00:00:00.000Z"}' > /dev/null

curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "type": "EXPENSE", "category": "Rent", "date": "2026-07-03T00:00:00.000Z"}' | jq

curl -s "$BASE_URL/notifications?unreadOnly=true" | jq
```

Expect a `NEGATIVE_CASH_FLOW` / `CRITICAL` notification.

### 5.5 De-dupe window

Fire the same anomaly twice within an hour (e.g. two negative-cash-flow
triggering transactions back to back) and confirm only one notification with
that exact type+message exists:

```bash
curl -s "$BASE_URL/notifications" | jq '[.data[] | select(.type=="NEGATIVE_CASH_FLOW")] | length'
```

Should stay at `1` even after multiple qualifying transactions within the
same hour.

---

## 6. Testing Notifications

```bash
# List (paginated)
curl -s "$BASE_URL/notifications?page=1&limit=10" | jq

# List unread only
curl -s "$BASE_URL/notifications?unreadOnly=true" | jq

# Mark one as read
curl -s -X PATCH "$BASE_URL/notifications/<NOTIFICATION_ID>/read" | jq

# Mark all as read
curl -s -X PATCH "$BASE_URL/notifications/read-all" | jq
```

After "mark all read," `unreadCount` in the list response should be `0`.

---

## 7. Testing the Dashboard

```bash
curl -s "$BASE_URL/dashboard/summary" | jq
```

Check:
- `totalBalance = totalIncome - totalExpense`
- `monthlyCashFlow` has exactly 6 entries (current month + previous 5),
  even for months with zero transactions
- Each entry's `net = income - expense`

### 7.1 Cache behavior

The summary is cached in Redis for 30 seconds (`SUMMARY_CACHE_TTL_SECONDS`).

```bash
# First call — hits DB, sets cache
time curl -s "$BASE_URL/dashboard/summary" > /dev/null

# Second call within 30s — should be faster (cache hit)
time curl -s "$BASE_URL/dashboard/summary" > /dev/null

# Create a transaction, which should invalidate the cache
curl -s -X POST "$BASE_URL/transactions" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "type": "INCOME", "category": "Misc", "date": "2026-07-13T00:00:00.000Z"}' > /dev/null

# Confirm the summary reflects the new transaction immediately (cache busted)
curl -s "$BASE_URL/dashboard/summary" | jq '.data.totalIncome'
```

---

## 8. Error Handling Checks

- **404s**: `GET/PUT/DELETE /transactions/<random-uuid>`, `PATCH
  /notifications/<random-uuid>/read` → should return a structured error, not
  a 500.
- **Validation errors**: POST a transaction missing `amount` or with an
  invalid `type` (not `INCOME`/`EXPENSE`) → should be rejected by the
  `validate()` middleware before hitting the service layer.
- **Resilience**: if Redis or the anomaly checks fail, transaction creation
  should still succeed (both are wrapped so they don't block the write).

---

## 9. Suggested Test Order (happy path smoke test)

1. `POST /transactions` (income) → `201`
2. `POST /transactions` (expense) → `201`
3. `GET /transactions` → confirm both appear
4. `GET /transactions/:id` → confirm details match
5. `PUT /transactions/:id` → confirm update persisted
6. `GET /dashboard/summary` → confirm totals reflect the transactions
7. Trigger one of each anomaly (5.1–5.4) → confirm notifications created
8. `GET /notifications` → confirm they show up, unread
9. `PATCH /notifications/read-all` → confirm `unreadCount` drops to 0
10. `DELETE /transactions/:id` → `204`, then `GET /dashboard/summary` again
    to confirm cache invalidation picked up the deletion

---

## 10. Optional: Postman / Thunder Client

If you prefer a GUI, import the endpoints above as a collection with:
- An environment variable `baseUrl = http://localhost:3000/api`
- A pre-request script or manual step to capture `id` from create responses
  into a collection variable for reuse in get/update/delete requests