import { fileURLToPath } from "node:url";
import { Umzug } from "umzug";
import pool from "./connection.js";
import { PostgresMigrationStorage } from "./postgresStorage.js";

const migrationsDirectory = fileURLToPath(
  new URL("./migrations", import.meta.url)
);

export function createMigrator(connectionPool = pool) {
  return new Umzug({
    migrations: {
      glob: ["*.js", { cwd: migrationsDirectory }]
    },
    context: connectionPool,
    storage: new PostgresMigrationStorage(connectionPool),
    logger: console
  });
}
