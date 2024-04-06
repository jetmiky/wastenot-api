import functions = require("firebase-functions");
import admin = require("firebase-admin");
import * as serviceAccount from "./serviceAccount.json";

import Koa = require("koa");
import cors = require("@koa/cors");
import respond = require("koa-respond");
import { bodyParser } from "@koa/bodyparser";
import handleErrors from "./middlewares/errors";
import Router = require("@koa/router");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: "wastenot-c13cd.appspot.com",
});

import auth from "./routes/auth";
import banks from "./routes/banks";
import sellers from "./routes/sellers";
import pickup from "./routes/pickups";
import deliver from "./routes/delivers";
import products from "./routes/products";
import initialize from "./routes/initialize";
import ping from "./routes/ping";

const app = new Koa();
const router = new Router();

router.use("/auth", auth.routes());
router.use("/banks", banks.routes());
router.use("/sellers", sellers.routes());
router.use("/pickups", pickup.routes());
router.use("/delivers", deliver.routes());
router.use("/products", products.routes());
router.use("/initialize", initialize.routes());
router.use("/ping", ping.routes());

app.use(cors());
app.use(respond());
app.use(bodyParser({ enableRawChecking: true, encoding: "utf-8" }));
app.use(handleErrors());
app.use(router.routes());

module.exports.api = functions.https.onRequest(app.callback());
