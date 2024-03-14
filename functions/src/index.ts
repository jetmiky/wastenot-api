import { onRequest } from "firebase-functions/v2/https";

import Koa = require("koa");
import Router = require("@koa/router");

const app = new Koa();
const router = new Router();

router.get("/ping", (ctx) => {
  ctx.body = "Hello world!";
});

app.use(router.routes()).use(router.allowedMethods());

module.exports.api = onRequest(app.callback());
