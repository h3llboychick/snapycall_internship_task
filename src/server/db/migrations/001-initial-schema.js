export async function up({ context: pool }) {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE experts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE consultation_slots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      expert_id UUID NOT NULL REFERENCES experts(id),
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT consultation_slots_valid_range CHECK (ends_at > starts_at),
      CONSTRAINT consultation_slots_expert_start_unique
        UNIQUE (expert_id, starts_at)
    );

    CREATE TABLE bookings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL REFERENCES clients(id),
      slot_id UUID NOT NULL REFERENCES consultation_slots(id),
      status TEXT NOT NULL DEFAULT 'CONFIRMED'
        CHECK (status IN ('CONFIRMED')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT bookings_slot_unique UNIQUE (slot_id)
    );

    CREATE INDEX bookings_client_id_idx ON bookings(client_id);
    CREATE INDEX consultation_slots_expert_id_idx
      ON consultation_slots(expert_id);
  `);
}

export async function down({ context: pool }) {
  await pool.query(`
    DROP TABLE IF EXISTS bookings;
    DROP TABLE IF EXISTS consultation_slots;
    DROP TABLE IF EXISTS experts;
    DROP TABLE IF EXISTS clients;
  `);
}
