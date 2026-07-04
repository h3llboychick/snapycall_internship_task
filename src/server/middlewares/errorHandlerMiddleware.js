import { ServiceError } from "../shared/errors/serviceError.js"
import { ZodError } from "zod";

export function errorHandlerMiddleware(error, req, resp, next) {
  if (error instanceof ZodError) {
    resp.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed."
      }
    });
    return;
  }

  if (error instanceof ServiceError) {
    resp.status(error.status).json({
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400) {
    resp.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON."
      }
    });
    return;
  }

  console.error("Unhandled request error", error);

  resp.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred."
    }
  });
}
