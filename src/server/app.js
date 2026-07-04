import express from "express";
import { registerSwaggerDocs } from "./swagger.js";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware.js";
import { createBookingsRouter } from "./bookings/bookingRoutes.js";
import { createClientsRouter } from "./clients/clientRoutes.js";
import { createExpertsRouter } from "./experts/expertRoutes.js";

export function createApp({ services }) {
  const app = express();

  app.use(express.json());
  registerSwaggerDocs(app);

  app.use("/api/bookings", createBookingsRouter(services));
  app.use("/api/clients", createClientsRouter(services))
  app.use("/api/experts", createExpertsRouter(services))
  app.get("/api/health", (req, resp) => {
    resp.json({
      status: "ok",
      service: "consultation-booking-api"
    });
  });

  app.use(errorHandlerMiddleware);

  return app;
}
