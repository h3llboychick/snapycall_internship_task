import { ExpertServiceError } from "./expertErrors.js";

export class ExpertService {
  constructor(database) {
    this.database = database;
  }

  async getAvailableExperts() {
    const result = await this.database.query(`
      SELECT experts.id, experts.name
      FROM experts
      ORDER BY experts.name, experts.id
    `);

    return result.rows;
  }

  async getAvailableSlots(expertId) {
    const expertResult = await this.database.query(
      "SELECT id FROM experts WHERE id = $1",
      [expertId]
    );

    if (expertResult.rowCount === 0) {
      throw new ExpertServiceError(
        "EXPERT_NOT_FOUND",
        "Expert not found.",
        404
      );
    }

    const slotsResult = await this.database.query(
      `
        SELECT
          consultation_slots.id,
          consultation_slots.expert_id AS "expertId",
          consultation_slots.starts_at AS "startsAt",
          consultation_slots.ends_at AS "endsAt"
        FROM consultation_slots
        LEFT JOIN bookings
          ON bookings.slot_id = consultation_slots.id
        WHERE consultation_slots.expert_id = $1
          AND consultation_slots.starts_at > NOW()
          AND bookings.id IS NULL
        ORDER BY consultation_slots.starts_at, consultation_slots.id
      `,
      [expertId]
    );

    return slotsResult.rows;
  }
}
