import * as z from "zod";

export const createBookingRequestSchema = z.object({
    clientId: z.uuid(),
    expertId: z.uuid(),
    slotId: z.uuid()
})

export const getBookingRequestSchema = z.uuid()