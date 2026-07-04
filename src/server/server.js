import { createApp } from "./app.js";
import config from "./config.js";
import pool from "./db/connection.js";
import { createMigrator } from "./db/migrator.js";
import { ExpertService } from "./experts/expertService.js"
import { ClientService } from "./clients/clientService.js" 
import { BookingService } from "./bookings/bookingService.js"

async function startServer() {
  const migrator = createMigrator(pool);
  await migrator.up();

  const services = {
    expertService: new ExpertService(pool),
    clientService: new ClientService(pool),
    bookingService: new BookingService(pool)
  }

  const app = createApp({ services })

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
