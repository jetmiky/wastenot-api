import admin = require("firebase-admin");
import Router = require("@koa/router");
import JoiDateFactory from "@joi/date";
import JoiCore = require("joi");

const Joi = JoiCore.extend(JoiDateFactory) as typeof JoiCore;

import { GeoPoint } from "firebase-admin/firestore";
import verifyToken from "../middlewares/tokens";
import db from "../utils/db";

import { NotFoundError, NotImplemented } from "../types/Error";
import Bank from "../types/Bank";
import { phoneNumberPattern } from "../utils/patterns";

type BankResponse = Bank & {
  email: string | undefined;
  phoneNumber: string | undefined;
};

const router = new Router();

router.get("/", verifyToken(["user", "admin"]), async (ctx) => {
  const search = ctx.query.search;

  const banks: BankResponse[] = [];
  const documentsRef = search ?
    db.banks
      .orderBy("name")
      .startAt(search)
      .endAt(search + "~") :
    db.banks;

  const snapshot = await documentsRef.limit(6).get();

  for (const document of snapshot.docs) {
    const { email, phoneNumber } = await admin.auth().getUser(document.id);
    banks.push({ ...document.data(), id: document.id, email, phoneNumber });
  }

  ctx.ok(banks);
});

router.get("/:id", verifyToken(["user", "admin"]), async (ctx) => {
  const id = ctx.params.id;
  const document = await db.banks.doc(id).get();

  if (!document.exists) throw new NotFoundError();

  const bank = document.data() as Bank;
  const { email, phoneNumber } = await admin.auth().getUser(document.id);

  ctx.ok({ ...bank, id: document.id, email, phoneNumber });
});

router.post("/", verifyToken("admin"), async (ctx) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string()
      .pattern(/^[a-zA-Z0-9]{8,30}/, {})
      .required(),
    phoneNumber: Joi.string().pattern(phoneNumberPattern).required(),
    address: Joi.string().min(3).max(254).required(),
    closedDates: Joi.array()
      .items(Joi.date().format("YYYY-MM-DD").raw())
      .default([]),
    openSchedules: Joi.array()
      .items({
        dayOfWeek: Joi.date().format("E").raw(),
        scheduleTimeOpen: Joi.date().format("HH:mm").raw(),
        scheduleTimeClose: Joi.date().format("HH:mm").raw(),
      })
      .default([]),
    geoPoint: Joi.object({
      latitude: Joi.number().min(-90).max(90).default(0),
      longitude: Joi.number().min(-180).max(180).default(0),
    }).default({ latitude: 0, longitude: 0 }),
  });

  const body = await schema.validateAsync(ctx.request.body);
  const {
    name,
    email,
    password,
    phoneNumber,
    address,
    closedDates,
    openSchedules,
    geoPoint,
  } = body;

  const { uid } = await admin.auth().createUser({
    displayName: name,
    email,
    password,
    phoneNumber,
    emailVerified: false,
    disabled: false,
  });

  admin.auth().setCustomUserClaims(uid, { role: "bank" });

  const bank: Bank = {
    name,
    address,
    geoPoint: new GeoPoint(geoPoint.latitude, geoPoint.longitude),
    closedDates,
    openSchedules,
  };

  await db.banks.doc(uid).set(bank);

  ctx.created({ bankId: uid, ...bank });
});

router.put("/:id", verifyToken("admin"), async (ctx) => {
  const bankId = ctx.params.id;

  const schema = Joi.object({
    name: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    phoneNumber: Joi.string().pattern(phoneNumberPattern),
    address: Joi.string().min(3).max(254),
    closedDates: Joi.array().items(Joi.date().format("YYYY-MM-DD").raw()),
    openSchedules: Joi.array().items({
      dayOfWeek: Joi.date().format("E").raw(),
      scheduleTimeOpen: Joi.date().format("HH:mm").raw(),
      scheduleTimeClose: Joi.date().format("HH:mm").raw(),
    }),
    geoPoint: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
    }).and("latitude", "longitude"),
  });

  const body = await schema.validateAsync(ctx.request.body);
  const {
    name,
    email,
    phoneNumber,
    address,
    closedDates,
    openSchedules,
    geoPoint,
  } = body;

  const documentRef = db.banks.doc(bankId);
  const document = await documentRef.get();

  if (!document.exists) throw new NotFoundError();

  const updatedAuthBank: { [key: string]: string } = {};

  if (name) updatedAuthBank.displayName = name;
  if (email) updatedAuthBank.email = email;
  if (phoneNumber) updatedAuthBank.phoneNumber = phoneNumber;

  await admin.auth().updateUser(bankId, updatedAuthBank);

  const existingBank = document.data() as Bank;
  const updatedBank = { ...existingBank };

  if (name) updatedBank.name = name;
  if (address) updatedBank.address = address;
  if (closedDates) updatedBank.closedDates = closedDates;
  if (openSchedules) updatedBank.openSchedules = openSchedules;
  if (geoPoint) {
    updatedBank.geoPoint = new GeoPoint(geoPoint.latitude, geoPoint.longitude);
  }

  await documentRef.update(updatedBank);

  ctx.ok({ ...updatedBank, id: document.id });
});

router.delete("/:id", verifyToken("admin"), async (ctx) => {
  throw new NotImplemented();

  const bankId = ctx.params.id;

  const documentRef = db.banks.doc(bankId);
  const document = await documentRef.get();

  if (!document.exists) throw new NotFoundError();
  // TODO: Checks if already have deliver orders or pickup orders

  await documentRef.delete();

  ctx.noContent();
});

export default router;
