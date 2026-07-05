import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedTestData, testData } from "../../db/seeds/testData.js";
import {
  startIntegrationTestContext,
  stopIntegrationTestContext
} from "./integrationTestContext.js";

const clients = testData.clients;
const slots = testData.slots;
const bookingIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const missingBookingId = "ffffffff-ffff-4fff-8fff-ffffffffffff";

async function createBooking(clientId, expertId, slotId, context) {
  return request(context.app)
    .post("/api/bookings")
    .send({
      clientId,
      expertId,
      slotId
    });
}

async function getClient(context, clientId) {
  const response = await request(context.app).get("/api/clients");

  expect(response.status).toBe(200);

  const client = response.body.find(({ id }) => id === clientId);
  expect(client).toBeDefined();

  return client;
}

async function getClientBookings(context, clientId) {
  const response = await request(context.app).get(
    `/api/clients/${clientId}/bookings`
  );

  expect(response.status).toBe(200);

  return response.body;
}

function expectConfirmedBooking(body, { clientId, expertId, slotId }) {
  expect(body).toEqual({
    id: expect.stringMatching(bookingIdPattern),
    clientId,
    expertId,
    slotId,
    status: "CONFIRMED",
    createdAt: expect.any(String)
  });
  expect(Number.isNaN(Date.parse(body.createdAt))).toBe(false);
}

describe("Booking API", () => {
  let context;

  beforeAll(async () => {
    context = await startIntegrationTestContext();
  }, 120_000);

  beforeEach(async () => {
    await seedTestData(context.database);
  });

  afterAll(async () => {
    await stopIntegrationTestContext(context);
  }, 30_000);

  it("1. creates a booking for a valid request", async () => {
    const clientId = clients[0].id;
    const expertId = slots[0].expertId;
    const slotId = slots[0].id;

    const response = await createBooking(
      clientId,
      expertId,
      slotId,
      context
    );

    expect(response.status).toBe(201);
    expectConfirmedBooking(response.body, {
      clientId,
      expertId,
      slotId
    });
  });

  it("2. returns one booking for duplicate submissions", async () => {
    const clientId = clients[0].id;
    const expertId = slots[0].expertId;
    const slotId = slots[0].id;

    const firstResponse = await createBooking(
      clientId,
      expertId,
      slotId,
      context
    );
    const secondResponse = await createBooking(
      clientId,
      expertId,
      slotId,
      context
    );
    const thirdResponse = await createBooking(
      clientId,
      expertId,
      slotId,
      context
    );

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(200);
    expect(thirdResponse.status).toBe(200);
    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(thirdResponse.body).toEqual(firstResponse.body);

    const bookings = await getClientBookings(context, clientId);
    expect(bookings).toHaveLength(1);
    expect(bookings[0].id).toBe(firstResponse.body.id);
  });

  it("3. rejects a second client when the slot is already booked", async () => {
    const firstClientId = clients[0].id;
    const secondClientId = clients[1].id;
    const expertId = slots[0].expertId;
    const slotId = slots[0].id;

    const firstResponse = await createBooking(
      firstClientId,
      expertId,
      slotId,
      context
    );
    const conflictResponse = await createBooking(
      secondClientId,
      expertId,
      slotId,
      context
    );

    expect(firstResponse.status).toBe(201);
    expect(conflictResponse.status).toBe(409);
    expect(conflictResponse.body).toEqual({
      error: {
        code: "SLOT_ALREADY_BOOKED",
        message: "The consultation slot has already been booked."
      }
    });

    const bookingLists = await Promise.all(
      [firstClientId, secondClientId].map((clientId) =>
        getClientBookings(context, clientId)
      )
    );
    expect(bookingLists.flat()).toHaveLength(1);
    expect(bookingLists.flat()[0].id).toBe(firstResponse.body.id);
  });

  it("4. creates only one booking for concurrent slot requests", async () => {
    const competingClients = [clients[0], clients[1]];
    const slot = slots[0];

    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, index) => {
        const client = competingClients[index % competingClients.length];

        return createBooking(client.id, slot.expertId, slot.id, context);
      })
    );

    const createdResponses = responses.filter(({ status }) => status === 201);
    const successfulResponses = responses.filter(
      ({ status }) => status >= 200 && status < 300
    );

    expect(createdResponses).toHaveLength(1);
    expect(
      responses.every(({ status }) => [200, 201, 409].includes(status))
    ).toBe(true);
    expect(
      successfulResponses.every(
        ({ body }) => body.id === createdResponses[0].body.id
      )
    ).toBe(true);

    const bookingLists = await Promise.all(
      competingClients.map(({ id }) => getClientBookings(context, id))
    );
    expect(bookingLists.flat()).toHaveLength(1);
    expect(bookingLists.flat()[0].id).toBe(createdResponses[0].body.id);
  });

  it("5. returns an existing booking by ID", async () => {
    const clientId = clients[0].id;
    const slot = slots[0];
    const createResponse = await createBooking(
      clientId,
      slot.expertId,
      slot.id,
      context
    );

    const getResponse = await request(context.app).get(
      `/api/bookings/${createResponse.body.id}`
    );

    expect(createResponse.status).toBe(201);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(createResponse.body);
  });

  it("6. returns 404 for a missing booking", async () => {
    const response = await request(context.app).get(
      `/api/bookings/${missingBookingId}`
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "BOOKING_NOT_FOUND",
        message: "Booking not found."
      }
    });
  });

  it("7. charges 100 credits when a booking is created", async () => {
    const client = clients[0]; // selects client with 500 credits
    const slot = slots[0];

    const response = await createBooking(
      client.id,
      slot.expertId,
      slot.id,
      context
    );
    const updatedClient = await getClient(context, client.id);

    expect(response.status).toBe(201);
    expect(updatedClient.credits).toBe(400);
  });

  it("8. preserves the balance when credits are insufficient", async () => {
    const client = clients[2]; // selects client with 50 credits
    const slot = slots[0];

    const response = await createBooking(
      client.id,
      slot.expertId,
      slot.id,
      context
    );

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      error: {
        code: "INSUFFICIENT_CREDITS",
        message: "A booking requires 100 credits."
      }
    });

    const updatedClient = await getClient(context, client.id);
    const bookings = await getClientBookings(context, client.id);
    expect(updatedClient.credits).toBe(50);
    expect(bookings).toEqual([]);
  });

  it("9. does not charge twice for duplicate requests", async () => {
    const client = clients[0];
    const slot = slots[0];

    const firstResponse = await createBooking(
      client.id,
      slot.expertId,
      slot.id,
      context
    );
    const duplicateResponse = await createBooking(
      client.id,
      slot.expertId,
      slot.id,
      context
    );

    expect(firstResponse.status).toBe(201);
    expect(duplicateResponse.status).toBe(200);
    expect(duplicateResponse.body.id).toBe(firstResponse.body.id);

    const updatedClient = await getClient(context, client.id);
    const bookings = await getClientBookings(context, client.id);
    expect(updatedClient.credits).toBe(400);
    expect(bookings).toHaveLength(1);
  });

  it("10. does not overspend a balance during concurrent requests", async () => {
    const client = clients[1]; // select client with 100 credits
    const requestedSlots = slots.slice(0, 4);

    const responses = await Promise.all(
      requestedSlots.map((slot) =>
        createBooking(client.id, slot.expertId, slot.id, context)
      )
    );

    expect(responses.filter(({ status }) => status === 201)).toHaveLength(1);
    expect(responses.filter(({ status }) => status === 422)).toHaveLength(3);

    const updatedClient = await getClient(context, client.id);
    const bookings = await getClientBookings(context, client.id);
    expect(updatedClient.credits).toBe(0);
    expect(updatedClient.credits).toBeGreaterThanOrEqual(0);
    expect(bookings).toHaveLength(1);
  });
});
