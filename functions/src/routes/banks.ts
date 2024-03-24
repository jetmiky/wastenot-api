import Router = require("@koa/router");
import Joi = require("joi");

import { GeoPoint } from "firebase-admin/firestore";
import verifyToken from "../middlewares/tokens";
import db from "../utils/db";
import { timePattern } from "../utils/patterns";

import { NotFoundError } from "../types/Error";
import Bank from "../types/Bank";

const router = new Router();

router.get("/", verifyToken("user"), async (ctx) => {
  const search = ctx.query.search;

  const banks: Bank[] = [];
  const documentsRef = search ?
    db.banks
      .orderBy("name")
      .startAt(search)
      .endAt(search + "~") :
    db.banks;

  const documents = await documentsRef.limit(6).get();

  documents.forEach((document) => {
    banks.push({ ...document.data(), id: document.id });
  });

  ctx.ok(banks);
});

router.get("/:id", verifyToken("admin"), async (ctx) => {
  const id = ctx.params.id;
  const document = await db.banks.doc(id).get();

  if (!document.exists) throw new NotFoundError();

  const bank = document.data();
  ctx.ok(bank);
});

router.post("/", verifyToken("admin"), async (ctx) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    address: Joi.string().min(3).max(254).required(),
    closedDates: Joi.array().items(Joi.string().isoDate()).required(),
    openSchedules: Joi.array()
      .items({
        dayOfWeek: Joi.string().valid("0", "1", "2", "3", "4", "5", "6"),
        scheduleTimeOpen: Joi.string().pattern(timePattern),
        scheduleTimeClose: Joi.string().pattern(timePattern),
      })
      .required(),
  });

  const body = await schema.validateAsync(ctx.request.body);
  const { name, address, closedDates, openSchedules } = body;

  const bank: Bank = {
    name,
    address,
    geoPoint: new GeoPoint(1, 2),
    closedDates,
    openSchedules,
  };

  const { id } = await db.banks.add(bank);
  ctx.created({ id, ...bank });
});

router.put("/:id", verifyToken("admin"), async (ctx) => {
  const bankId = ctx.params.id;

  const schema = Joi.object({
    name: Joi.string().min(3).max(100),
    address: Joi.string().min(3).max(254),
    closedDates: Joi.array().items(Joi.string().isoDate()),
    openSchedules: Joi.array().items({
      dayOfWeek: Joi.string().valid("0", "1", "2", "3", "4", "5", "6"),
      scheduleTimeOpen: Joi.string().pattern(timePattern),
      scheduleTimeClose: Joi.string().pattern(timePattern),
    }),
  });

  const body = await schema.validateAsync(ctx.request.body);
  const { name, address, closedDates, openSchedules } = body;

  const documentRef = db.banks.doc(bankId);
  const document = await documentRef.get();

  if (!document.exists) throw new NotFoundError();

  const existingBank = document.data() as Bank;
  const updatedBank = { ...existingBank };

  if (name) updatedBank.name = name;
  if (address) updatedBank.address = address;
  if (closedDates) updatedBank.closedDates = closedDates;
  if (openSchedules) updatedBank.openSchedules = openSchedules;

  await documentRef.update(updatedBank);

  ctx.ok({ ...updatedBank, id: document.id });
});

router.delete("/:id", verifyToken("admin"), async (ctx) => {
  const bankId = ctx.params.id;

  const documentRef = db.banks.doc(bankId);
  const document = await documentRef.get();

  if (!document.exists) throw new NotFoundError();
  // TODO: Checks if already have deliver orders or pickup orders

  await documentRef.delete();

  ctx.noContent();
});

export default router;
