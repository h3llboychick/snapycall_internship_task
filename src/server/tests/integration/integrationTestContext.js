import { PostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";
import { createApp } from "../../app.js";
import { BookingService } from "../../bookings/bookingService.js";
import { ClientService } from "../../clients/clientService.js";
import { createMigrator } from "../../db/migrator.js";
import { ExpertService } from "../../experts/expertService.js";

const { Pool } = pg;

export async function startIntegrationTestContext() {
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("consultation_booking_test")
    .withUsername("booking_test")
    .withPassword("booking_test")
    .start();

  const database = new Pool({
    connectionString: container.getConnectionUri()
  });

  try {
    await createMigrator(database).up();
  } catch (error) {
    await database.end();
    await container.stop();
    throw error;
  }

  const services = {
    bookingService: new BookingService(database),
    clientService: new ClientService(database),
    expertService: new ExpertService(database)
  };

  return {
    app: createApp({ services }),
    database,
    container
  };
}

export async function stopIntegrationTestContext(context) {
  if (!context) {
    return;
  }

  try {
    await context.database.end();
  } finally {
    await context.container.stop();
  }
}
