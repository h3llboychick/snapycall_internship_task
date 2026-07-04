import { ClientServiceError } from "./clientErrors.js";

export class ClientService {
  constructor(database) {
    this.database = database;
  }

  async getClients() {
    const result = await this.database.query(`
      SELECT id, name, credits
      FROM clients
      ORDER BY name, id
    `);

    return result.rows;
  }

  async getClientBookings(clientId) {
    const clientResult = await this.database.query(
      "SELECT id FROM clients WHERE id = $1",
      [clientId]
    );

    if (clientResult.rowCount === 0) {
      throw new ClientServiceError("CLIENT_NOT_FOUND", "Client not found.", 404);
    }

    const bookingsResult = await this.database.query(
      `
        SELECT
          bookings.id,
          bookings.client_id AS "clientId",
          consultation_slots.expert_id AS "expertId",
          experts.name AS "expertName",
          bookings.slot_id AS "slotId",
          bookings.status,
          consultation_slots.starts_at AS "startsAt",
          consultation_slots.ends_at AS "endsAt",
          bookings.created_at AS "createdAt"
        FROM bookings
        JOIN consultation_slots
          ON consultation_slots.id = bookings.slot_id
        JOIN experts
          ON experts.id = consultation_slots.expert_id
        WHERE bookings.client_id = $1
        ORDER BY bookings.created_at DESC, bookings.id
      `,
      [clientId]
    );

    return bookingsResult.rows;
  }
}
