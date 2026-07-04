import { Router } from "express";
import { getExpertSlotsRequestSchema } from "./expertSchemas.js";

export function createExpertsRouter(services) {
  const router = Router();
  const { expertService } = services

  /**
   * @openapi
   * /api/experts:
   *   get:
   *     tags:
   *       - Experts
   *     summary: List experts with available slots
   *     responses:
   *       "200":
   *         description: Experts that currently have at least one available slot.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/Expert"
   *       "500":
   *         description: Unexpected server error.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   */
  router.get("/", async (_request, response, next) => {
    try {
      response.json(await expertService.getAvailableExperts());
    } catch (error) {
      next(error);
    }
  });

  /** 
   * @openapi
   * /api/experts/{id}/slots:
   *   get:
   *     tags:
   *       - Experts
   *     summary: List an expert's available slots
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: Expert identifier.
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       "200":
   *         description: Future consultation slots that have not been booked.
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/ConsultationSlot"
   *       "400":
   *         description: Invalid expert identifier.
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/Error"
   *       "404":
   *         description: Expert not found.
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
  router.get("/:id/slots", async (request, response, next) => {
    const expertId = getExpertSlotsRequestSchema.parse(request.params.id);

    try {
      response.json(await expertService.getAvailableSlots(expertId));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
