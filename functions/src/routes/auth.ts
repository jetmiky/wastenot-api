import admin = require("firebase-admin");
import Router = require("@koa/router");
import Joi = require("joi");

import db from "../utils/db";
import verifyToken from "../middlewares/tokens";
import { phoneNumberPattern } from "../utils/patterns";

import User from "../types/User";
import Level from "../types/Level";

const router = new Router();

router.get("/", verifyToken("user"), async (ctx) => {
  const uid = ctx.state.uid;
  const { displayName, email, phoneNumber } = await admin.auth().getUser(uid);

  const userDocument = await db.users.doc(uid).get();
  const { levelId, ...user } = userDocument.data() as User;

  const levelDocument = await db.levels.doc(levelId).get();
  const level = levelDocument.data() as Level;

  ctx.ok({ name: displayName, email, phoneNumber, level, ...user });
});

router.post("/register", async (ctx) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(/^[a-zA-Z0-9]{8,30}/, {})
      .required(),
    confirmPassword: Joi.ref("password"),
    phoneNumber: Joi.string().pattern(phoneNumberPattern).required(),
    gender: Joi.string().valid("Laki Laki", "Perempuan").required(),
  }).with("password", "confirmPassword");

  const { name, email, password, phoneNumber, gender } =
    await schema.validateAsync(ctx.req.body);

  const user = await admin.auth().createUser({
    displayName: name,
    email,
    password,
    phoneNumber,
    emailVerified: false,
    disabled: false,
  });

  await admin.auth().setCustomUserClaims(user.uid, { role: "user" });

  let levelId = "";
  const levelDocument = await db.levels.where("requiredPoint", "==", 0).get();
  levelDocument.forEach(({ id }) => {
    levelId = id;
  });

  await db.users.doc(user.uid).set({
    levelId,
    gender,
    address: "",
    totalPoints: 0,
    wasteCollected: 0,
  });

  return ctx.created({ uid: user.uid, email: user.email });
});

router.put("/", verifyToken("user"), async (ctx) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    password: Joi.string().pattern(/^[a-zA-Z0-9]{8,30}/, {}),
    confirmPassword: Joi.ref("password"),
    phoneNumber: Joi.string().pattern(phoneNumberPattern),
    gender: Joi.string().valid("Laki Laki", "Perempuan"),
  }).with("password", "confirmPassword");

  const body = await schema.validateAsync(ctx.req.body);
  const { name, email, password, phoneNumber, gender } = body;
  const updatedUser: { [key: string]: string } = {};

  if (name) updatedUser.displayName = name;
  if (email) updatedUser.email = email;
  if (password) updatedUser.password = password;
  if (phoneNumber) updatedUser.phoneNumber = phoneNumber;

  await admin.auth().updateUser(ctx.state.uid, updatedUser);
  if (gender) await db.users.doc(ctx.state.uid).update({ gender });

  return ctx.ok({ uid: ctx.state.uid, email });
});

export default router;
