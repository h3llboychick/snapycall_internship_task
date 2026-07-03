import app from "./app.js";
import config from "./config.js";
import pool from "./db/connection.js";
import { createMigrator } from "./db/migration/migrator.js";

async function startServer() {
  const migrator = createMigrator(pool);
  await migrator.up();

  const server = app.listen(config.server.port, "0.0.0.0", () => {
    console.log(`API listening on port ${config.server.port}`);
  });

  async function shutDown(signal) {
    console.log(`${signal} received, shutting down`);

    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutDown("SIGINT"));
  process.on("SIGTERM", () => shutDown("SIGTERM"));
}

startServer().catch(async (error) => {
  console.error("Failed to start API", error);
  await pool.end();
  process.exit(1);
});
