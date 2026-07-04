import { ServiceError } from "../shared/errors/serviceError.js";

export class BookingServiceError extends ServiceError {
  constructor(code, message, status) {
    super(code, message, status);
    this.name = "BookingServiceError";
  }
}


