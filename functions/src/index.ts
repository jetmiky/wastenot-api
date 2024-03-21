import functions = require("firebase-functions");
import admin = require("firebase-admin");

import Koa = require("koa");
import cors = require("@koa/cors");
import respond = require("koa-respond");
import { bodyParser } from "@koa/bodyparser";
import Router = require("@koa/router");

import auth from "./routes/auth";

admin.initializeApp(functions.config().firebase);

const app = new Koa();
const router = new Router();

router.use("/auth", auth.routes());

app.use(cors());
app.use(respond());
app.use(bodyParser({ enableRawChecking: true, encoding: "utf-8" }));
app.use(router.routes());

module.exports.api = functions.https.onRequest(app.callback());
