import { BookingServiceError } from "./bookingErrors.js";

const BOOKING_PRICE = 100;

const bookingProjection = `
  SELECT
    bookings.id,
    bookings.client_id AS "clientId",
    consultation_slots.expert_id AS "expertId",
    bookings.slot_id AS "slotId",
    bookings.status,
    bookings.created_at AS "createdAt"
  FROM bookings
  JOIN consultation_slots
    ON consultation_slots.id = bookings.slot_id
`;

export class BookingService {
  constructor(database) {
    this.database = database;
  }

  async getBookingById(id) {
    const result = await this.database.query(
      `${bookingProjection} WHERE bookings.id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      throw new BookingServiceError(
        "BOOKING_NOT_FOUND",
        "Booking not found.",
        404
      );
    }

    return result.rows[0];
  }

  async createBooking({ clientId, expertId, slotId }) {
    const connection = await this.database.connect();

    try {
      // Start transaction
      await connection.query("BEGIN");

      // Select slot for update
      const slotResult = await connection.query(
        `
          SELECT id, expert_id AS "expertId"
          FROM consultation_slots
          WHERE id = $1
          FOR UPDATE
        `,
        [slotId]
      );

      // Check whether the slot for a given slotId exists
      if (slotResult.rowCount === 0) {
        throw new BookingServiceError(
          "SLOT_NOT_FOUND",
          "Consultation slot not found.",
          404
        );
      }

      // Check if supplied expertId matches the one stored in DB
      if (slotResult.rows[0].expertId !== expertId) {
        throw new BookingServiceError(
          "SLOT_EXPERT_MISMATCH",
          "The consultation slot does not belong to the selected expert.",
          400
        );
      }

      // Check if there's a booking for supplied slotId
      const existingBookingResult = await connection.query(
        `${bookingProjection} WHERE bookings.slot_id = $1`,
        [slotId]
      );

      if (existingBookingResult.rowCount > 0) {
        const existingBooking = existingBookingResult.rows[0];

        // If existing booking's clientId mathces supplied clientId return the booking
        if (existingBooking.clientId === clientId) {
          await connection.query("COMMIT");

          return {
            booking: existingBooking,
            created: false
          };
        }

        // ... and throw BookingServiceError if there's a mismatch
        throw new BookingServiceError(
          "SLOT_ALREADY_BOOKED",
          "The consultation slot has already been booked.",
          409
        );
      }

      // Subtract the credits needed for making the booking
      // Note: we don't need to explicitly lock the rows here (as we did for previous operations) because Postgres does this for us
      const balanceResult = await connection.query(
        `
          UPDATE clients
          SET credits = credits - $2
          WHERE id = $1
            AND credits >= $2
          RETURNING credits
        `,
        [clientId, BOOKING_PRICE]
      );

      if (balanceResult.rowCount === 0) {
        const clientResult = await connection.query(
          "SELECT id FROM clients WHERE id = $1",
          [clientId]
        );

        if (clientResult.rowCount === 0) {
          throw new BookingServiceError(
            "CLIENT_NOT_FOUND",
            "Client not found.",
            404
          );
        }

        throw new BookingServiceError(
          "INSUFFICIENT_CREDITS",
          `A booking requires ${BOOKING_PRICE} credits.`,
          422
        );
      }

      const bookingResult = await connection.query(
        `
          INSERT INTO bookings (client_id, slot_id)
          VALUES ($1, $2)
          RETURNING id
        `,
        [clientId, slotId]
      );

      const booking = await this.getBookingWithConnection(
        connection,
        bookingResult.rows[0].id
      );

      await connection.query("COMMIT");

      return {
        booking,
        created: true
      };
    } catch (error) {
      await connection.query("ROLLBACK");
      throw error;
    } finally {
      connection.release();
    }
  }

  async getBookingWithConnection(connection, id) {
    const result = await connection.query(
      `${bookingProjection} WHERE bookings.id = $1`,
      [id]
    );

    return result.rows[0];
  }
}
