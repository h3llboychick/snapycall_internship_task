import { Router } from "express";
import { createBookingRequestSchema, getBookingRequestSchema } from "./bookingSchemas.js";

export function createBookingsRouter(services) {
  const router = Router();
  const { bookingService } = services;

  /**
   * @openapi
   * /api/bookings:
   *   post:
   *     tags:
   *       - Bookings
   *     summary: Create a consultation booking
   *     description: |
   *       Reserves an available consultation slot and charges the client 100
   *       credits. Repeating the same logical operation returns the existing
   *       booking without charging the client again.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/CreateBookingRequest"
   *     responses:
   *       "201":
   *         description: Booking created and credits charged.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Booking"
   *       "200":
   *         description: Idempotent retry returning the existing booking.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Booking"
   *       "400":
   *         description: Invalid request or slot/expert mismatch.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: Client or consultation slot not found.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "409":
   *         description: The slot has already been booked by another client.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "422":
   *         description: The client does not have enough credits.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "500":
   *         description: Unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */

  router.post("/", async (request, response, next) => {
    const command = createBookingRequestSchema.parse(request.body)
    try {
      const result = await bookingService.createBooking(command);

      response.status(result.created ? 201 : 200).json(result.booking);
    } catch (error) {
      next(error);
    }
  });

   /**  
    * @openapi
    * /api/bookings/{id}:
    *   get:
    *     tags:
    *       - Bookings
    *     summary: Retrieve a booking
    *     parameters:
    *       - name: id
    *         in: path
    *         required: true
    *         description: Booking identifier.
    *         schema:
    *           type: string
    *           format: uuid
    *     responses:
    *       "200":
    *         description: Booking details.
    *         content:
    *           application/json:
    *             schema:
    *               $ref: "#/components/schemas/Booking"
    *       "400":
    *         description: Invalid booking identifier.
    *         content:
    *           application/json:
    *             schema:
    *               $ref: "#/components/schemas/Error"
    *       "404":
    *         description: Booking not found.
    *         content:
    *           application/json:
    *             schema:
    *               $ref: "#/components/schemas/Error"
    *       "500":
    *         description: Unexpected server error.
    *         content:
    *           application/json:
    *             schema:
    *               $ref: "#/components/schemas/Error"
    */

  router.get("/:id", async (request, response, next) => {
    const bookingId = getBookingRequestSchema.parse(request.params.id)
    try {
      const booking = await bookingService.getBookingById(bookingId);
      response.json(booking);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
