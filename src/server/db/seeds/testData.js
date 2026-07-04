export const testData = Object.freeze({
  clients: Object.freeze([
    {
      id: "00000000-0000-4000-8000-000000000500",
      name: "Client with 500 credits",
      credits: 500
    },
    {
      id: "00000000-0000-4000-8000-000000000100",
      name: "Client with 100 credits",
      credits: 100
    },
    {
      id: "00000000-0000-4000-8000-000000000050",
      name: "Client with 50 credits",
      credits: 50
    }
  ]),
  experts: Object.freeze([
    {
      id: "00000000-0000-4000-8000-000000001001",
      name: "Ada Expert"
    },
    {
      id: "00000000-0000-4000-8000-000000001002",
      name: "Grace Expert"
    }
  ]),
  slots: Object.freeze([
    {
      id: "00000000-0000-4000-8000-000000002001",
      expertId: "00000000-0000-4000-8000-000000001001",
      startsAt: "2030-01-15T09:00:00.000Z",
      endsAt: "2030-01-15T09:30:00.000Z"
    },
    {
      id: "00000000-0000-4000-8000-000000002002",
      expertId: "00000000-0000-4000-8000-000000001001",
      startsAt: "2030-01-15T09:30:00.000Z",
      endsAt: "2030-01-15T10:00:00.000Z"
    },
    {
      id: "00000000-0000-4000-8000-000000002003",
      expertId: "00000000-0000-4000-8000-000000001001",
      startsAt: "2030-01-15T10:00:00.000Z",
      endsAt: "2030-01-15T10:30:00.000Z"
    },
    {
      id: "00000000-0000-4000-8000-000000002004",
      expertId: "00000000-0000-4000-8000-000000001001",
      startsAt: "2030-01-15T10:30:00.000Z",
      endsAt: "2030-01-15T11:00:00.000Z"
    },
    {
      id: "00000000-0000-4000-8000-000000002005",
      expertId: "00000000-0000-4000-8000-000000001002",
      startsAt: "2030-01-16T13:00:00.000Z",
      endsAt: "2030-01-16T13:30:00.000Z"
    },
    {
      id: "00000000-0000-4000-8000-000000002006",
      expertId: "00000000-0000-4000-8000-000000001002",
      startsAt: "2030-01-16T13:30:00.000Z",
      endsAt: "2030-01-16T14:00:00.000Z"
    }
  ])
});

export async function seedTestData(database) {
  const connection = await database.connect();
  const clientIds = testData.clients.map(({ id }) => id);
  const expertIds = testData.experts.map(({ id }) => id);

  try {
    await connection.query("BEGIN");

    await connection.query(
      `
        DELETE FROM bookings
        WHERE client_id = ANY($1::uuid[])
          OR slot_id IN (
            SELECT id
            FROM consultation_slots
            WHERE expert_id = ANY($2::uuid[])
          )
      `,
      [clientIds, expertIds]
    );

    await connection.query(
      `
        DELETE FROM consultation_slots
        WHERE expert_id = ANY($1::uuid[])
      `,
      [expertIds]
    );

    for (const client of testData.clients) {
      await connection.query(
        `
          INSERT INTO clients (id, name, credits)
          VALUES ($1, $2, $3)
          ON CONFLICT (id)
          DO UPDATE SET
            name = EXCLUDED.name,
            credits = EXCLUDED.credits
        `,
        [client.id, client.name, client.credits]
      );
    }

    for (const expert of testData.experts) {
      await connection.query(
        `
          INSERT INTO experts (id, name)
          VALUES ($1, $2)
          ON CONFLICT (id)
          DO UPDATE SET name = EXCLUDED.name
        `,
        [expert.id, expert.name]
      );
    }

    for (const slot of testData.slots) {
      await connection.query(
        `
          INSERT INTO consultation_slots (
            id,
            expert_id,
            starts_at,
            ends_at
          )
          VALUES ($1, $2, $3, $4)
        `,
        [slot.id, slot.expertId, slot.startsAt, slot.endsAt]
      );
    }

    await connection.query("COMMIT");
  } catch (error) {
    await connection.query("ROLLBACK");
    throw error;
  } finally {
    connection.release();
  }
}
