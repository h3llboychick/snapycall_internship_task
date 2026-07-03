import pool from "../db/connection.js";
import { createMigrator } from "../db/migration/migrator.js";

const migrator = createMigrator(pool);

try {
  await migrator.up();
} catch (error) {
  console.error("Database migration failed", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
