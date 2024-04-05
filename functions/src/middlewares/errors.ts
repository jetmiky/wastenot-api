import { Next, Context, Middleware } from "koa";
import { logger } from "firebase-functions/v1";
import * as Errors from "../types/Error";

type Response = {
  message: string;
  code?: string;
};

/**
 * Construct error response from Error instance.
 *
 * @param {unknown} error
 * @return {string}
 */
function constructErrorResponse(error: unknown): Response {
  const response: Response = { message: "" };

  if (error instanceof Errors.ErrorResponse) {
    response.message = error.message;
    if (error.code) response.code = error.code;
  } else if (error instanceof Error) {
    response.message = error.message;
  }

  return response;
}

/**
 * Middleware to handle errors.
 *
 * @return {Middleware}
 */
export default function handleErrors(): Middleware {
  return async (ctx: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      const response = constructErrorResponse(error);

      if (
        error instanceof Errors.ValidationError ||
        error instanceof Errors.BadRequestError
      ) {
        ctx.badRequest(response);
      } else if (error instanceof Errors.UnauthorizedError) {
        ctx.unauthorized(response);
      } else if (error instanceof Errors.ForbiddenError) {
        ctx.forbidden(response);
      } else if (error instanceof Errors.NotFoundError) {
        ctx.notFound(response);
      } else {
        logger.error(response);
        ctx.internalServerError(response);
      }
    }
  };
}
