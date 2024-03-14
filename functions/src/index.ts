import functions = require("firebase-functions");
import admin = require("firebase-admin");

import Koa = require("koa");
import cors = require("@koa/cors");
import respond = require("koa-respond");

admin.initializeApp(functions.config().firebase);

const app = new Koa();

app.use(cors());
app.use(respond());

module.exports.api = functions.https.onRequest(app.callback());
