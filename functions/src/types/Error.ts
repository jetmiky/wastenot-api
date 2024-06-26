/* eslint-disable require-jsdoc */

export { ValidationError } from "joi";

export class ErrorResponse extends Error {
  public code: string;
  public message: string;

  constructor(code: string, message: string);
  constructor(message: string);
  constructor();

  constructor(...args: string[]) {
    let message = "";
    let code = "";

    if (args.length === 1) {
      message = args[0];
    } else if (args.length === 2) {
      code = args[0];
      message = args[1];
    }

    super(message);

    this.code = code;
    this.message = message;
  }
}

export class BadRequestError extends ErrorResponse {
  public message = "Bad Request!";
}

export class UnauthorizedError extends ErrorResponse {
  public message = "Unauthorized!";
}

export class ForbiddenError extends ErrorResponse {
  public message = "Forbidden!";
}

export class NotFoundError extends ErrorResponse {
  public message = "Not Found!";
}

export class NotImplemented extends ErrorResponse {
  public message = "Service is not implemented";
}
