import admin = require("firebase-admin");
import Router = require("@koa/router");
import Joi = require("joi");

import verifyToken from "../middlewares/tokens";
import { phoneNumberPattern } from "../utils/patterns";

const router = new Router();

router.post("/register", async (ctx) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(/^[a-zA-Z0-9]{8,30}/, {}),
    confirm_password: Joi.ref("password"),
    phoneNumber: Joi.string().pattern(phoneNumberPattern).required(),
  }).with("password", "confirm_password");

  const { name, email, password, phoneNumber } = await schema.validateAsync(
    ctx.req.body
  );

  const user = await admin.auth().createUser({
    displayName: name,
    email,
    password,
    phoneNumber,
    emailVerified: false,
    disabled: false,
  });

  await admin.auth().setCustomUserClaims(user.uid, { role: "user" });

  return ctx.created({ uid: user.uid, email: user.email });
});

router.put("/", verifyToken("user"), async (ctx) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(/^[a-zA-Z0-9]{8,30}/, {}),
    confirm_password: Joi.ref("password"),
    phoneNumber: Joi.string().pattern(phoneNumberPattern).required(),
  }).with("password", "confirm_password");

  const { name, email, password, phoneNumber } = await schema.validateAsync(
    ctx.req.body
  );

  await admin.auth().updateUser(ctx.state.uid, {
    displayName: name,
    email,
    password,
    phoneNumber,
  });

  return ctx.ok({ uid: ctx.state.uid, email });
});

export default router;
