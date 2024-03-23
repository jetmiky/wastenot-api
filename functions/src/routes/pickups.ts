import Router = require("@koa/router");

import verifyToken from "../middlewares/tokens";
import db from "../utils/db";
import { ForbiddenError, NotFoundError } from "../types/Error";
import PickupOrder, { PickupStatus } from "../types/PickupOrder";

const router = new Router();

router.get("/", verifyToken("user"), async (ctx) => {
  const status = ctx.query.status as PickupStatus;
  const page = parseInt(ctx.query.page as string);
  const paginate = isNaN(page) ? 1 : page;

  const operator = status.toLowerCase() === "selesai" ? "==" : "!=";

  const orders: PickupOrder[] = [];
  const documents = await db.pickupOrders
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
  const document = await db.pickupOrders.doc(id).get();

  if (!document.exists) throw new NotFoundError();
  const order = document.data();

  if (order?.userId !== ctx.state.uid) throw new ForbiddenError();
  ctx.ok(order);
});

export default router;
