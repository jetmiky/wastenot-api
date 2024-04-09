import admin = require("firebase-admin");
import Router = require("@koa/router");
import Joi = require("joi");

import db from "../utils/db";
import { phoneNumberPattern } from "../utils/patterns";
import verifyToken from "../middlewares/tokens";

import { NotFoundError } from "../types/Error";
import Seller from "../types/Seller";

type SellerResponse = Seller & {
  email: string | undefined;
  phoneNumber: string | undefined;
};

const router = new Router();

router.get("/", verifyToken("admin"), async (ctx) => {
  const sellers: SellerResponse[] = [];

  const snapshot = await db.sellers.get();

  for (const document of snapshot.docs) {
    const { email, phoneNumber } = await admin.auth().getUser(document.id);
    sellers.push({ ...document.data(), id: document.id, email, phoneNumber });
  }

  ctx.ok(sellers);
});

router.get("/:id", verifyToken("admin"), async (ctx) => {
  const id = ctx.params.id;
  const document = await db.sellers.doc(id).get();

  if (!document.exists) throw new NotFoundError();

  const seller = document.data();
  const { email, phoneNumber } = await admin.auth().getUser(document.id);

  ctx.ok({ ...seller, id: document.id, email, phoneNumber });
});

router.post("/", verifyToken("admin"), async (ctx) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(/^[a-zA-Z0-9]{8,30}/, {})
      .required(),
    phoneNumber: Joi.string().pattern(phoneNumberPattern).required(),
    address: Joi.string().required(),
  });

  const { name, email, password, phoneNumber, address } =
    await schema.validateAsync(ctx.req.body);

  const { uid } = await admin.auth().createUser({
    displayName: name,
    email,
    password,
    phoneNumber,
    emailVerified: false,
    disabled: false,
  });

  admin.auth().setCustomUserClaims(uid, { role: "seller" });

  await db.sellers.doc(uid).set({ name, address });

  ctx.created({ sellerId: uid, email });
});

router.put("/:id", verifyToken("admin"), async (ctx) => {
  const sellerId = ctx.params.id;

  const schema = Joi.object({
    name: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    phoneNumber: Joi.string().pattern(phoneNumberPattern),
    address: Joi.string(),
  });

  const body = await schema.validateAsync(ctx.req.body);
  const { name, email, phoneNumber, address } = body;
  const updatedSeller: { [key: string]: string } = {};

  if (name) updatedSeller.displayName = name;
  if (email) updatedSeller.email = email;
  if (phoneNumber) updatedSeller.phoneNumber = phoneNumber;

  await admin.auth().updateUser(sellerId, updatedSeller);
  await db.sellers.doc(sellerId).update({ name, address });

  return ctx.ok({ sellerId, email });
});

export default router;
