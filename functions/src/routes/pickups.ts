import Router = require("@koa/router");
import Joi = require("joi");

import verifyToken from "../middlewares/tokens";
import db from "../utils/db";
import { upload, getSignedUrl } from "../utils/storage";
import multipart from "../middlewares/multipart";
import { FieldValue, GeoPoint } from "firebase-admin/firestore";

import { BadRequestError, ForbiddenError, NotFoundError } from "../types/Error";
import PickupOrder, { PickupStatus, Waste } from "../types/PickupOrder";
import Bank from "../types/Bank";
import { timestampFromISODateString } from "../utils/formats";
import { phoneNumberPattern } from "../utils/patterns";

const router = new Router();

type PickupOrderResponse = PickupOrder & {
  bank: Bank | null;
  wasteImageUrl: string;
  createdTime: string;
  updatedTime: string;
  wastesUpdate?: (Waste & { wasteName: string })[];
};

router.get("/", verifyToken("user"), async (ctx) => {
  const status = ctx.query.status as PickupStatus;
  const page = parseInt(ctx.query.page as string);
  const paginate = isNaN(page) ? 1 : page;

  const orders: PickupOrderResponse[] = [];

  let query = db.pickupOrders.where("userId", "==", ctx.state.uid);

  if (status) {
    query = query.where("status", "==", status);
  }

  query = query
    .orderBy("createdAt")
    .limit(6)
    .offset((paginate - 1) * 6);

  const documents = await query.get();

  for (const document of documents.docs) {
    let bank: Bank | null = null;
    const order = document.data();

    const createdTime = order.createdAt.toDate().toISOString();
    const updatedTime = order.createdAt.toDate().toISOString();

    if (order.bankId) {
      const bankSnapshot = await db.banks.doc(order.bankId).get();
      bank = bankSnapshot.data() as Bank;
    }

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

router.get("/:id", verifyToken("user"), async (ctx) => {
  const id = ctx.params.id;
  const document = await db.pickupOrders.doc(id).get();

  if (!document.exists) throw new NotFoundError();

  const order = document.data() as PickupOrder;
  if (order?.userId !== ctx.state.uid) throw new ForbiddenError();

  let bank: Bank | null = null;
  if (order.bankId) {
    const bankSnapshot = await db.banks.doc(order.bankId).get();
    bank = bankSnapshot.data() as Bank;
  }

  const wasteImageUrl = await getSignedUrl(order.wasteImagePath);

  const response: PickupOrderResponse = {
    ...order,
    id,
    bank,
    wasteImageUrl,
    createdTime: order.createdAt.toDate().toISOString(),
    updatedTime: "",
    wastesUpdate: [],
  };

  if (order.realizedPickupTime) {
    response.updatedTime = order.realizedPickupTime.toDate().toISOString();
  } else {
    response.updatedTime = order.requester.pickupSchedule
      .toDate()
      .toISOString();
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
    bankId: Joi.string().allow(null, ""),
    requesterName: Joi.string().min(3).max(100).required(),
    requesterPhone: Joi.string().pattern(phoneNumberPattern).required(),
    requesterAddress: Joi.string().max(254).required(),
    pickupSchedule: Joi.date().iso().required(),
    geoPoint: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180),
    }),
    wasteImage: Joi.any(),
  });

  const body = await schema.validateAsync(ctx.request.body);
  const {
    bankId,
    requesterName,
    requesterPhone,
    requesterAddress,
    pickupSchedule,
    geoPoint,
  } = body;

  const { extension, mimeType, buffer } = ctx.request.files.wasteImage;
  const path = await upload("pickups", "random", extension, mimeType, buffer);

  const { id } = await db.pickupOrders.add({
    userId: ctx.state.uid,
    bankId,
    requester: {
      name: requesterName,
      phone: requesterPhone,
      address: requesterAddress,
      pickupSchedule: timestampFromISODateString(pickupSchedule),
      geoPoint: new GeoPoint(geoPoint?.latitude ?? 0, geoPoint?.longitude ?? 0),
    },
    wasteImagePath: path,
    wastes: [],
    status: "Belum diproses",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  ctx.ok({ id });
});

router.put("/:id", verifyToken(["bank", "user"]), async (ctx) => {
  const orderId = ctx.params.id;

  const documentRef = db.pickupOrders.doc(orderId);
  const document = await documentRef.get();

  if (!document.exists) throw new NotFoundError();

  const existingOrder = document.data() as PickupOrder;
  const updatedOrder: PickupOrder = { ...existingOrder };

  let schema: Joi.ObjectSchema;

  if (ctx.state.role === "user") {
    if (existingOrder.userId !== ctx.state.uid) throw new ForbiddenError();
    if (existingOrder.status !== "Belum diproses") {
      throw new ForbiddenError("Pickup Order sudah diproses");
    }

    schema = Joi.object({
      bankId: Joi.string(),
      requesterName: Joi.string().min(3).max(100),
      requesterPhone: Joi.string().pattern(phoneNumberPattern),
      requesterAddress: Joi.string().max(254),
      pickupSchedule: Joi.date().iso(),
      geoPoint: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
      }).and("latitude", "longitude"),
    });

    const body = await schema.validateAsync(ctx.request.body);
    const {
      bankId,
      requesterName,
      requesterPhone,
      requesterAddress,
      pickupSchedule,
      geoPoint,
    } = body;

    if (bankId) updatedOrder.bankId = bankId;
    if (requesterName) updatedOrder.requester.name = requesterName;
    if (requesterPhone) updatedOrder.requester.phone = requesterPhone;
    if (requesterAddress) updatedOrder.requester.address = requesterAddress;
    if (pickupSchedule) {
      updatedOrder.requester.pickupSchedule =
        timestampFromISODateString(pickupSchedule);
    }
    if (geoPoint) {
      updatedOrder.requester.geoPoint = new GeoPoint(
        geoPoint.latitude,
        geoPoint.longitude
      );
    }

    await db.pickupOrders.doc(orderId).update({
      ...updatedOrder,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else if (ctx.state.role === "bank") {
    if (existingOrder.bankId !== ctx.state.uid) throw new ForbiddenError();

    schema = Joi.object({
      status: Joi.string()
        .valid("Proses diambil", "Menunggu penimbangan", "Selesai")
        .required(),
      wastes: Joi.when("status", {
        is: Joi.string().equal("Selesai"),
        then: Joi.array().required().items({
          wasteId: Joi.string().required(),
          wasteWeight: Joi.number().required(),
        }),
        otherwise: Joi.any(),
      }),
      realizedPickupTime: Joi.when("status", {
        is: Joi.string().equal("Selesai"),
        then: Joi.date().iso().required(),
        otherwise: Joi.any(),
      }),
    });

    const { status, wastes, realizedPickupTime } = await schema.validateAsync(
      ctx.request.body
    );
    updatedOrder.status = status;

    if (status === "Proses diambil" || status === "Menunggu penimbangan") {
      await db.pickupOrders.doc(orderId).update({
        ...updatedOrder,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (status === "Selesai") {
      let totalPoint = 0;
      wastes.forEach(async (waste: Waste) => {
        const doc = await db.wastes.doc(waste.wasteId).get();
        const data = doc.data()?.point ?? 0;
        const point = data * waste.wasteWeight;

        waste.wastePoint = point;
        totalPoint += point;
      });

      updatedOrder.wastes = wastes;
      updatedOrder.realizedPickupTime =
        timestampFromISODateString(realizedPickupTime);

      await db.firestore.runTransaction(async () => {
        await db.users.doc(existingOrder.userId).update({
          totalPoints: FieldValue.increment(totalPoint),
        });

        await db.pickupOrders.doc(orderId).update({
          ...updatedOrder,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
    }
  }

  ctx.ok(updatedOrder);
});

router.delete("/:id", verifyToken("user"), async (ctx) => {
  const orderId = ctx.params.id;

  const documentRef = db.pickupOrders.doc(orderId);
  const document = await documentRef.get();

  if (!document.exists) throw new NotFoundError();

  const order = document.data() as PickupOrder;

  if (order.userId !== ctx.state.uid) throw new ForbiddenError();
  if (order.status !== "Belum diproses") {
    throw new BadRequestError("Pickup Order tidak dapat dihapus.");
  }

  await documentRef.delete();

  ctx.noContent();
});

export default router;
