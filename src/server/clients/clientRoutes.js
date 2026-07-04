import { Router } from "express";
import { getClientBookingsRequestSchema } from "./clientSchemas.js";


 
export function createClientsRouter(services) {
  const router = Router();
  const { clientService } = services;


  /**
   * @openapi
   * /api/clients:
   *   get:
   *     tags:
   *       - Clients
   *     summary: List clients
   *     description: Returns clients that can be selected in the booking UI.
   *     responses:
   *       "200":
   *         description: Clients and their current credit balances.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Client"
   *       "500":
   *         description: Unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  router.get("/", async (req, resp, next) => {
    try {
      const clients = await clientService.getClients();
      resp.json(clients);
    } catch (error) {
      next(error);
    }
  });


  /** 
   * @openapi
   * /api/clients/{id}/bookings:
   *   get:
   *     tags:
   *       - Clients
   *       - Bookings
   *     summary: List a client's bookings
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Client identifier.
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "200":
   *         description: The client's bookings.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/ClientBooking"
   *       "400":
   *         description: Invalid client identifier.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: Client not found.
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
  router.get("/:id/bookings", async (req, resp, next) => {
    const clientId = getClientBookingsRequestSchema.parse(req.params.id)
    try {
      const bookings = await clientService.getClientBookings(clientId);
      resp.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
