import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const rootEnvPath = fileURLToPath(new URL("../../.env", import.meta.url));

dotenv.config({
  path: rootEnvPath,
  quiet: true
});

function readPort(name, fallback) {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`${name} must be a valid port number`);
  }

  return value;
}

const database = {
  name: process.env.POSTGRES_DB ?? "consultation_booking",
  user: process.env.POSTGRES_USER ?? "booking",
  password: process.env.POSTGRES_PASSWORD ?? "booking",
  host: process.env.POSTGRES_HOST ?? "localhost",
  port: readPort("POSTGRES_PORT", 5432)
};

const constructedDatabaseUrl =
  `postgresql://${encodeURIComponent(database.user)}` +
  `:${encodeURIComponent(database.password)}` +
  `@${database.host}:${database.port}` +
  `/${encodeURIComponent(database.name)}`;

const config = Object.freeze({
  environment: process.env.NODE_ENV ?? "development",
  server: Object.freeze({
    port: readPort("PORT", 3000)
  }),
  database: Object.freeze({
    ...database,
    url: process.env.DATABASE_URL ?? constructedDatabaseUrl
  })
});

export default config;
