import Router = require("@koa/router");
import Joi = require("joi");

import verifyToken from "../middlewares/tokens";
import multipart from "../middlewares/multipart";
import db from "../utils/db";
import { upload, getSignedUrl } from "../utils/storage";
import { FieldValue } from "firebase-admin/firestore";

import { BadRequestError, ForbiddenError, NotFoundError } from "../types/Error";
import DeliverOrder, { DeliverStatus, Waste } from "../types/DeliverOrder";
import Bank from "../types/Bank";
import { timestampFromISODateString } from "../utils/formats";
import { phoneNumberPattern } from "../utils/patterns";

const router = new Router();

type DeliverOrderResponse = DeliverOrder & {
  bank?: Bank;
  wasteImageUrl: string;
  sendScheduleTime?: string;
  createdTime: string;
  updatedTime: string;
  wastesUpdate?: (Waste & { wasteName: string })[];
};

router.get("/", verifyToken("user"), async (ctx) => {
  const status = ctx.query.status as DeliverStatus;
  const page = parseInt(ctx.query.page as string);
  const paginate = isNaN(page) ? 1 : page;

  const orders: DeliverOrderResponse[] = [];

  let query = db.deliverOrders.where("userId", "==", ctx.state.uid);

  if (status) {
    query = query.where("status", "==", status);
  }

  query = query
    .orderBy("createdAt")
    .limit(6)
    .offset((paginate - 1) * 6);

  const documents = await query.get();

  for (const document of documents.docs) {
    const order = document.data();

    const createdTime = order.createdAt.toDate().toISOString();
    const updatedTime = order.createdAt.toDate().toISOString();

    const bankSnapshot = await db.banks.doc(order.bankId).get();
    const bank = bankSnapshot.data() as Bank;

    const wasteImageUrl = await getSignedUrl(order.wasteImagePath);

    orders.push({
      ...order,
      id: document.id,
      bank,
      wasteImageUrl,
      createdTime,
      updatedTime,
    });
  }

  ctx.ok(orders);
});

router.get("/bank", verifyToken("bank"), async (ctx) => {
  const status = ctx.query.status as DeliverStatus;
  const orders: DeliverOrderResponse[] = [];

  let query = db.deliverOrders.where("bankId", "==", ctx.state.uid);

  if (status) {
    query = query.where("status", "==", status);
  }

  query = query.orderBy("createdAt");

  const documents = await query.get();

  for (const document of documents.docs) {
    const order = document.data();

    const createdTime = order.createdAt.toDate().toISOString();
    const updatedTime = order.createdAt.toDate().toISOString();
    const sendScheduleTime = order.sendSchedule.toDate().toISOString();

    const wasteImageUrl = await getSignedUrl(order.wasteImagePath);

    orders.push({
      ...order,
      id: document.id,
      wasteImageUrl,
      sendScheduleTime,
      createdTime,
      updatedTime,
    });
  }

  ctx.ok(orders);
});

router.get("/:id", verifyToken("user"), async (ctx) => {
  const id = ctx.params.id;
  const document = await db.deliverOrders.doc(id).get();

  if (!document.exists) throw new NotFoundError();

  const order = document.data() as DeliverOrder;
  if (order?.userId !== ctx.state.uid) throw new ForbiddenError();

  const bankSnapshot = await db.banks.doc(order.bankId).get();
  const bank = bankSnapshot.data() as Bank;

  const wasteImageUrl = await getSignedUrl(order.wasteImagePath);

  const response: DeliverOrderResponse = {
    ...order,
    id,
    bank,
    wasteImageUrl,
    createdTime: order.createdAt.toDate().toISOString(),
    updatedTime: "",
    wastesUpdate: [],
  };

  if (order.status === "Selesai") {
    response.updatedTime = order.updatedAt.toDate().toISOString();
  } else {
    response.updatedTime = order.sendSchedule.toDate().toISOString();
  }

  for (const waste of order.wastes) {
    const wasteDoc = await db.wastes.doc(waste.wasteId).get();
    const wasteName = wasteDoc.data()?.name as string;

    response.wastesUpdate?.push({ ...waste, wasteName });
  }

  ctx.ok(response);
});

router.post("/", verifyToken("user"), multipart("wasteImage"), async (ctx) => {
  const schema = Joi.object({
    bankId: Joi.string().required(),
    senderName: Joi.string().min(3).max(100).required(),
    senderPhone: Joi.string().pattern(phoneNumberPattern).required(),
    sendSchedule: Joi.date().iso().required(),
    wasteImage: Joi.any(),
  });

  const body = await schema.validateAsync(ctx.request.body);
  const { bankId, senderName, senderPhone, sendSchedule } = body;

  const { extension, mimeType, buffer } = ctx.request.files.wasteImage;
  const path = await upload("delivers", "random", extension, mimeType, buffer);

  const { id } = await db.deliverOrders.add({
    userId: ctx.state.uid,
    bankId,
    sender: {
      name: senderName,
      phone: senderPhone,
    },
    sendSchedule: timestampFromISODateString(sendSchedule),
    wasteImagePath: path,
    wastes: [],
    status: "Belum diproses",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  ctx.ok({ id });
});

router.put(
  "/:id",
  verifyToken(["bank", "user"]),
  multipart("wasteImage"),
  async (ctx) => {
    const orderId = ctx.params.id;

    const documentRef = db.deliverOrders.doc(orderId);
    const document = await documentRef.get();

    if (!document.exists) throw new NotFoundError();

    const existingOrder = document.data() as DeliverOrder;
    const updatedOrder: DeliverOrder = { ...existingOrder };

    let schema: Joi.ObjectSchema;

    if (ctx.state.role === "user") {
      if (existingOrder.userId !== ctx.state.uid) throw new ForbiddenError();
      if (existingOrder.status !== "Belum diproses") {
        throw new ForbiddenError("Deliver Order sudah diproses");
      }

      schema = Joi.object({
        bankId: Joi.string(),
        senderName: Joi.string().min(3).max(100),
        senderPhone: Joi.string().pattern(phoneNumberPattern),
        sendSchedule: Joi.date().iso(),
      });

      const body = await schema.validateAsync(ctx.request.body);
      const { bankId, senderName, senderPhone, sendSchedule } = body;

      if (bankId) updatedOrder.bankId = bankId;
      if (senderName) updatedOrder.sender.name = senderName;
      if (senderPhone) updatedOrder.sender.phone = senderPhone;
      if (sendSchedule) {
        updatedOrder.sendSchedule = timestampFromISODateString(sendSchedule);
      }

      await db.deliverOrders.doc(orderId).update({
        ...updatedOrder,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (ctx.state.role === "bank") {
      if (existingOrder.bankId !== ctx.state.uid) throw new ForbiddenError();

      schema = Joi.object({
        status: Joi.string()
          .valid("Menunggu penimbangan", "Selesai")
          .required(),
        wasteWeight: Joi.number().min(1).required(),
        // wastes: Joi.when("status", {
        // is: Joi.string().equal("Selesai"),
        // then: Joi.array().required().items({
        //   wasteId: Joi.string().required(),
        //   wasteWeight: Joi.number().required(),
        // }),
        //   then: Joi.
        //   otherwise: Joi.any(),
        // }),
        // wasteImage: Joi.any(),
      });

      const { status, wasteWeight } = await schema.validateAsync(
        ctx.request.body
      );
      updatedOrder.status = status;

      if (status === "Menunggu penimbangan") {
        await db.deliverOrders.doc(orderId).update({
          ...updatedOrder,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else if (status === "Selesai") {
        let totalPoint = 0;
        const wastes: Waste[] = [];

        const randomWaste = await db.wastes.where("point", "==", 1).get();
        for (const waste of randomWaste.docs) {
          const data = waste.data()?.point ?? 0;
          const point = data * wasteWeight;

          totalPoint += point;

          wastes.push({ wasteId: waste.id, wastePoint: point, wasteWeight });
        }

        // wastes.forEach(async (waste: Waste) => {
        //   const doc = await db.wastes.doc(waste.wasteId).get();
        //   const data = doc.data()?.point ?? 0;
        //   const point = data * waste.wasteWeight;

        //   waste.wastePoint = point;
        //   totalPoint += point;
        // });

        updatedOrder.wastes = wastes;

        // const { extension, mimeType, buffer } = ctx.request.files.wasteImage;
        // const path = await upload(
        //   "delivers",
        //   "random",
        //   extension,
        //   mimeType,
        //   buffer
        // );

        // updatedOrder.wasteImagePath = path;

        await db.firestore.runTransaction(async () => {
          await db.users.doc(existingOrder.userId).update({
            totalPoints: FieldValue.increment(totalPoint),
          });

          await db.deliverOrders.doc(orderId).update({
            ...updatedOrder,
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
      }
    }

    ctx.ok(updatedOrder);
  }
);

router.delete("/:id", verifyToken("user"), async (ctx) => {
  const orderId = ctx.params.id;

  const documentRef = db.deliverOrders.doc(orderId);
  const document = await documentRef.get();

  if (!document.exists) throw new NotFoundError();

  const order = document.data() as DeliverOrder;

  if (order.userId !== ctx.state.uid) throw new ForbiddenError();
  if (order.status !== "Belum diproses") {
    throw new BadRequestError("Deliver Order tidak dapat dihapus.");
  }

  await documentRef.delete();

  ctx.noContent();
});

export default router;
