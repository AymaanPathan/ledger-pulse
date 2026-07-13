import "dotenv/config";
import { createApp } from "./app";
import { prisma } from "./lib/db";
import { redis } from "./lib/redis";

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.log(`[server] LedgerPulse API listening on port ${PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      redis.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
