import functions = require("firebase-functions");
import admin = require("firebase-admin");

import Koa = require("koa");
import cors = require("@koa/cors");
import respond = require("koa-respond");

import hybridBodyParser from "./middlewares/bodyparser";

admin.initializeApp(functions.config().firebase);

const app = new Koa();

app.use(cors());
app.use(respond());
app.use(hybridBodyParser());

module.exports.api = functions.https.onRequest(app.callback());
