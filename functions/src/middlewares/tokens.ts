import admin = require("firebase-admin");
import { Next, Context, Middleware } from "koa";

/**
 * Middleware to verify access token and add user object in context.
 *
 * @return {Middleware}
 */
export default function verifyToken(): Middleware {
  return async (ctx: Context, next: Next) => {
    try {
      const authorization = ctx.request.headers.authorization;
      if (authorization) {
        const [, token] = authorization.split("Bearer ");
        const { uid } = await admin.auth().verifyIdToken(token);

        ctx.state.uid = uid;
        return await next();
      }

      throw new Error();
    } catch (error) {
      return ctx.unauthorized();
    }
  };
}
