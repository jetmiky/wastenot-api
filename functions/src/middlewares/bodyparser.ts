import { Middleware } from "koa";
import { bodyParser } from "@koa/bodyparser";

/**
 * Hybrid body parser middleware.
 * Several Koa middlewares needs request.body,
 * while Firebase needs req.body.
 *
 * @return {Middleware}
 */
export default function hybridBodyParser(): Middleware {
  const bp = bodyParser();

  return async (ctx, next) => {
    ctx.request.body = ctx.request.body || ctx.req.body;
    return bp(ctx, next);
  };
}
