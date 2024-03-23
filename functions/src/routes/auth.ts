import admin = require("firebase-admin");
import Router = require("@koa/router");
import Joi = require("joi");

import { getAsyncErrorMessage } from "../utils/errors";

const router = new Router();

router.post("/register", async (ctx) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(/^[a-zA-Z0-9]{8,30}/, {}),
    confirm_password: Joi.ref("password"),
  }).with("password", "confirm_password");

  try {
    const { name, email, password } = await schema.validateAsync(ctx.req.body);

    const user = await admin.auth().createUser({
      displayName: name,
      email,
      password,
      emailVerified: false,
      disabled: false,
    });

    await admin.auth().setCustomUserClaims(user.uid, { role: "user" });

    return ctx.ok({ uid: user.uid, email: user.email });
  } catch (error) {
    const message = getAsyncErrorMessage(error);

    if (error instanceof Joi.ValidationError) {
      return ctx.badRequest(message);
    }

    return ctx.internalServerError(message);
  }
});

export default router;
