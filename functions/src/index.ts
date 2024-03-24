import functions = require("firebase-functions");
import admin = require("firebase-admin");

import Koa = require("koa");
import cors = require("@koa/cors");
import respond = require("koa-respond");
import { bodyParser } from "@koa/bodyparser";
import handleErrors from "./middlewares/errors";
import Router = require("@koa/router");

admin.initializeApp(functions.config().firebase);

import auth from "./routes/auth";
import pickup from "./routes/pickups";
import deliver from "./routes/delivers";
import products from "./routes/products";
import ping from "./routes/ping";

const app = new Koa();
const router = new Router();

router.use("/auth", auth.routes());
router.use("/pickups", pickup.routes());
router.use("/delivers", deliver.routes());
router.use("/products", products.routes());
router.use("/ping", ping.routes());

app.use(cors());
app.use(respond());
app.use(bodyParser({ enableRawChecking: true, encoding: "utf-8" }));
app.use(handleErrors());
app.use(router.routes());

module.exports.api = functions.https.onRequest(app.callback());
