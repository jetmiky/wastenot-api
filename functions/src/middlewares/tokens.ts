import * as admin from "firebase-admin";
import { Next, Context, Middleware } from "koa";
import UserRole from "../types/UserRole";
import { ForbiddenError, UnauthorizedError } from "../types/Error";
import { FirebaseAuthError } from "firebase-admin/lib/utils/error";

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
      if (!authorization) throw new UnauthorizedError();

      const [, token] = authorization.split("Bearer ");
      const user = await admin.auth().verifyIdToken(token);
      if (!user) throw new UnauthorizedError();

      const { uid, role } = user;
      ctx.state.uid = uid;
      ctx.state.role = role;

      if (role !== allowedRole) throw new ForbiddenError();

      return await next();
    } catch (error) {
      if (error instanceof FirebaseAuthError) {
        throw new UnauthorizedError(error.code, error.message);
      }

      throw error;
    }
  };
}
