export class HttpException extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "HttpException";
    this.statusCode = statusCode;
    this.details = details;
  }
}

