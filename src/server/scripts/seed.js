import pool from "../db/connection.js";
import { createMigrator } from "../db/migrator.js";
import { seedTestData, testData } from "../db/seeds/testData.js";

try {
  const migrator = createMigrator(pool);
  await migrator.up();
  await seedTestData(pool);

  console.log(
    `Seeded ${testData.clients.length} clients, ` +
      `${testData.experts.length} experts and ` +
      `${testData.slots.length} consultation slots.`
  );
} catch (error) {
  console.error("Database seeding failed", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
