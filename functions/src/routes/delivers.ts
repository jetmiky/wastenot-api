import Router = require("@koa/router");
import Joi = require("joi");

import verifyToken from "../middlewares/tokens";
import db from "../utils/db";
import { FieldValue } from "firebase-admin/firestore";
import { ForbiddenError, NotFoundError } from "../types/Error";
import DeliverOrder, { DeliverStatus } from "../types/DeliverOrder";

const router = new Router();

router.get("/", verifyToken("user"), async (ctx) => {
  const status = ctx.query.status as DeliverStatus;
  const page = parseInt(ctx.query.page as string);
  const paginate = isNaN(page) ? 1 : page;

  const operator = status.toLowerCase() === "selesai" ? "==" : "!=";

  const orders: DeliverOrder[] = [];
  const documents = await db.deliverOrders
    .where("userId", "==", ctx.state.uid)
    .where("status", operator, "Selesai")
    .orderBy("createdAt")
    .limit(6)
    .offset(paginate * 6)
    .get();

  documents.forEach((document) => orders.push(document.data()));
  ctx.ok(orders);
});

router.get("/:id", verifyToken("user"), async (ctx) => {
  const id = ctx.params.id;
  const document = await db.deliverOrders.doc(id).get();

  if (!document.exists) throw new NotFoundError();
  const order = document.data();

  if (order?.userId !== ctx.state.uid) throw new ForbiddenError();
  ctx.ok(order);
});

router.post("/", verifyToken("user"), async (ctx) => {
  const schema = Joi.object({
    bankId: Joi.string().required(),
    senderName: Joi.string().min(3).max(100).required(),
    senderPhone: Joi.string()
      .pattern(/^\\+62\\d{10,12}$/)
      .required(),
    sendSchedule: Joi.string().isoDate(),
  });

  const body = await schema.validateAsync(ctx.req.body);

  const { id } = await db.deliverOrders.add({
    userId: ctx.state.uid,
    bankId: body.bankId,
    sender: {
      name: body.senderName,
      phone: body.senderPhone,
    },
    sendSchedule: body.sendSchedule,
    wasteImageUrl: "",
    wastes: [],
    status: "Belum diproses",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  ctx.ok({ id });
});

export default router;
