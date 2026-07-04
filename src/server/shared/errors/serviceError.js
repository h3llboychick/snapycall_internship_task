export class ServiceError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.status = status;
  }
}
