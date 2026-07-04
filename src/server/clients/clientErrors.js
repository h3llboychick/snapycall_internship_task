import { ServiceError } from "../shared/errors/serviceError.js";

export class ClientServiceError extends ServiceError {
  constructor(code, message, status) {
    super(code, message, status);
    this.name = "ClientServiceError";
  }
}

