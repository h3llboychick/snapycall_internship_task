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

Interactive Swagger documentation is available at
<http://localhost:3000/api/docs>. The generated OpenAPI document is available
as JSON at <http://localhost:3000/api/docs/docs.json>.

Populate the selectable users and consultation slots before using the UI:

```bash
docker compose exec server npm run seed
```

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

## API

Create a booking:

```http
POST /api/bookings
Content-Type: application/json

{
  "clientId": "uuid",
  "expertId": "uuid",
  "slotId": "uuid"
}
```

The first successful request returns `201 Created`. A retry of the same logical
operation returns `200 OK` with the same booking and does not charge the client
again.

Retrieve a booking:

```http
GET /api/bookings/:id
```

List selectable users:

```http
GET /api/clients
```

List a user's bookings:

```http
GET /api/clients/:id/bookings
```

List experts:

```http
GET /api/experts
```

List an expert's future, unbooked slots:

```http
GET /api/experts/:id/slots
```

API errors use a consistent shape:

```json
{
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking not found."
  }
}
```

## Tests

Docker must be running for the server integration tests. They start a disposable
PostgreSQL 16 container, run all migrations against it, and remove it after the
test suite. The application database configured in `.env` is never used.

Run all tests:

```bash
npm test
```

Run only the server integration tests:

```bash
npm run test:integration
```

Server tests live under `src/server/tests`. Client tests live under
`src/client/tests`.

## Database migrations

Database code lives under `src/server/db`. Numbered schema changes are kept in
`src/server/db/migrations`, while reusable Umzug configuration lives directly
under `src/server/db`. Umzug runs pending migrations automatically when the API
starts. The one-shot migration command is located at
`src/server/scripts/migrate.js` and can be run with:

```bash
npm run migrate
```

## Test data

Reset and seed the predefined test dataset inside Docker:

```bash
docker compose exec server npm run seed
```

When running the server locally, use:

```bash
npm run seed
```

The seed is repeatable. It removes bookings involving the predefined clients
or expert slots, restores all balances, and recreates the available slots.

| Entity | ID | Credits |
| --- | --- | ---: |
| Client | `00000000-0000-4000-8000-000000000500` | 500 |
| Client | `00000000-0000-4000-8000-000000000100` | 100 |
| Client | `00000000-0000-4000-8000-000000000050` | 50 |
| Ada Expert | `00000000-0000-4000-8000-000000001001` | — |
| Grace Expert | `00000000-0000-4000-8000-000000001002` | — |

Available slots:

| Slot ID | Expert ID | Start (UTC) |
| --- | --- | --- |
| `00000000-0000-4000-8000-000000002001` | `00000000-0000-4000-8000-000000001001` | 2030-01-15 09:00 |
| `00000000-0000-4000-8000-000000002002` | `00000000-0000-4000-8000-000000001001` | 2030-01-15 09:30 |
| `00000000-0000-4000-8000-000000002003` | `00000000-0000-4000-8000-000000001001` | 2030-01-15 10:00 |
| `00000000-0000-4000-8000-000000002004` | `00000000-0000-4000-8000-000000001001` | 2030-01-15 10:30 |
| `00000000-0000-4000-8000-000000002005` | `00000000-0000-4000-8000-000000001002` | 2030-01-16 13:00 |
| `00000000-0000-4000-8000-000000002006` | `00000000-0000-4000-8000-000000001002` | 2030-01-16 13:30 |
