import { Next, Context, Middleware } from "koa";
import * as Errors from "../types/Error";

/**
 * Error object wrapper to extract message.
 *
 * @param {unknown} error
 * @return {string}
 */
function getAsyncErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
      const message = getAsyncErrorMessage(error);

      if (error instanceof Errors.ValidationError) {
        ctx.badRequest(message);
      } else if (error instanceof Errors.UnauthorizedError) {
        ctx.unauthorized(message);
      } else if (error instanceof Errors.ForbiddenError) {
        ctx.forbidden(message);
      } else if (error instanceof Errors.NotFoundError) {
        ctx.notFound(message);
      } else {
        ctx.internalServerError(message);
      }
    }
  };
}
