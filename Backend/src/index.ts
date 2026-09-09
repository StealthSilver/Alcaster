import { createApp } from "./app.js";
import { config } from "./config.js";
import { seedAuthStore } from "./data/store.js";
import { connectDb, disconnectDb } from "./db/connect.js";

async function main() {
  await connectDb();
  await seedAuthStore();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Alcaster API listening on http://localhost:${config.port}`);
    if (!config.isProduction) {
      console.log(
        `Demo sign-in: ${config.demo.email} / ${config.demo.password}`,
      );
    }
  });

  const shutdown = async () => {
    server.close();
    await disconnectDb();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

main().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
