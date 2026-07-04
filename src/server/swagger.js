import { fileURLToPath } from "node:url";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const routesGlob = fileURLToPath(
  new URL("./**/*Routes.js", import.meta.url)
);

export const openApiSpecification = swaggerJsdoc({
  failOnErrors: true,
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Consultation Booking API",
      version: "1.0.0",
      description:
        "Create and retrieve consultation bookings with transactional credit charging."
    },
    tags: [
      {
        name: "Bookings",
        description: "Consultation booking operations"
      },
      {
        name: "Clients",
        description: "Selectable clients and their bookings"
      },
      {
        name: "Experts",
        description: "Experts and their available consultation slots"
      }
    ],
    components: {
      schemas: {
        CreateBookingRequest: {
          type: "object",
          required: ["clientId", "expertId", "slotId"],
          properties: {
            clientId: {
              type: "string",
              format: "uuid"
            },
            expertId: {
              type: "string",
              format: "uuid"
            },
            slotId: {
              type: "string",
              format: "uuid"
            }
          }
        },
        Booking: {
          type: "object",
          required: [
            "id",
            "clientId",
            "expertId",
            "slotId",
            "status",
            "createdAt"
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid"
            },
            clientId: {
              type: "string",
              format: "uuid"
            },
            expertId: {
              type: "string",
              format: "uuid"
            },
            slotId: {
              type: "string",
              format: "uuid"
            },
            status: {
              type: "string",
              enum: ["CONFIRMED"]
            },
            createdAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        Client: {
          type: "object",
          required: ["id", "name", "credits"],
          properties: {
            id: {
              type: "string",
              format: "uuid"
            },
            name: {
              type: "string"
            },
            credits: {
              type: "integer",
              minimum: 0
            }
          }
        },
        Expert: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: {
              type: "string",
              format: "uuid"
            },
            name: {
              type: "string"
            }
          }
        },
        ConsultationSlot: {
          type: "object",
          required: ["id", "expertId", "startsAt", "endsAt"],
          properties: {
            id: {
              type: "string",
              format: "uuid"
            },
            expertId: {
              type: "string",
              format: "uuid"
            },
            startsAt: {
              type: "string",
              format: "date-time"
            },
            endsAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        ClientBooking: {
          allOf: [
            {
              $ref: "#/components/schemas/Booking"
            },
            {
              type: "object",
              required: ["expertName", "startsAt", "endsAt"],
              properties: {
                expertName: {
                  type: "string"
                },
                startsAt: {
                  type: "string",
                  format: "date-time"
                },
                endsAt: {
                  type: "string",
                  format: "date-time"
                }
              }
            }
          ]
        },
        Error: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: {
                  type: "string"
                },
                message: {
                  type: "string"
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [routesGlob]
});

export function registerSwaggerDocs(app) {
  app.get("/api/docs/docs.json", (_request, response) => {
    response.json(openApiSpecification);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiSpecification, {
      customSiteTitle: "Consultation Booking API"
    })
  );
}
