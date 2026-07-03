# Consultation Booking

A small consultation-booking application built with Express, React and
PostgreSQL.

The repository uses npm workspaces. Client dependencies and scripts live in
`src/client/package.json`; server dependencies and scripts live in
`src/server/package.json`. The root package provides commands that coordinate
both workspaces while keeping a single lockfile.

## Run with Docker

Build and start the complete application:

```bash
docker compose up --build -d
```

Docker Compose automatically reads configuration from a root `.env` file.
Copy the example if you want to override the provided development defaults:

```bash
cp .env.example .env
```

The PostgreSQL connection URL used by the server container is constructed in
`docker-compose.yml` from `POSTGRES_DB`, `POSTGRES_USER`, and
`POSTGRES_PASSWORD`.

Open <http://localhost:8080>. The API health endpoint is available at
<http://localhost:3000/api/health>.

Stop the application:

```bash
docker compose down
```


## Run locally

Start PostgreSQL through Docker:

```bash
docker compose up -d database
```

Install dependencies and start the Express and Vite development servers:

```bash
npm install
cp .env.example .env
npm run dev
```

The Vite development server runs at <http://localhost:5173> and proxies
`/api` requests to Express at <http://localhost:3000>.

## Tests

```bash
npm test
```

Server tests live under `src/server/tests`. Client tests live under
`src/client/tests`.

## Database migrations

Database code lives under `src/server/db`. Numbered schema changes are kept in
`src/server/db/migrations`, while reusable Umzug configuration lives in
`src/server/db/migration`. Umzug runs pending migrations automatically when the
API starts. The one-shot migration command is located at
`src/server/scripts/migrate.js` and can be run with:

```bash
npm run migrate
```
