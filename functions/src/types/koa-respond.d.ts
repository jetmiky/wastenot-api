import * as Koa from "koa";

export = respond;

/**
 * Koa-Respond middleware factory.
 * Created due to not included in package.
 * @returns koa-respond middleware
 */
declare function respond(): Koa.Middleware;

declare module "koa" {
  interface ExtendableContext {
    ok: (response?: string | object) => Koa.Context;
    created: (response?: string | object) => Koa.Context;
    noContent: (response?: string | object) => Koa.Context;
    badRequest: (response?: string | object) => Koa.Context;
    unauthorized: (response?: string | object) => Koa.Context;
    forbidden: (response?: string | object) => Koa.Context;
    notFound: (response?: string | object) => Koa.Context;
    locked: (response?: string | object) => Koa.Context;
    internalServerError: (response?: string | object) => Koa.Context;
    notImplemented: (response?: string | object) => Koa.Context;
  }
}
