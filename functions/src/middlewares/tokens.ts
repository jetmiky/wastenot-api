import admin = require("firebase-admin");
import { Next, Context, Middleware } from "koa";
import UserRole from "../types/UserRole";

/**
 * Middleware to verify access token and add user object in context.
 *
 * @param {UserRole} allowedRole User role that can proceed the middleware.
 * @return {Middleware}
 */
export default function verifyToken(allowedRole: UserRole): Middleware {
  return async (ctx: Context, next: Next) => {
    try {
      const authorization = ctx.request.headers.authorization;
      if (authorization) {
        const [, token] = authorization.split("Bearer ");
        const { uid, role } = await admin.auth().verifyIdToken(token);

        ctx.state.uid = uid;
        ctx.state.role = role;

        if (role === allowedRole) {
          return await next();
        }
      }

      throw new Error();
    } catch (error) {
      return ctx.unauthorized();
    }
  };
}
