import Router = require("@koa/router");

import verifyToken from "../middlewares/tokens";
import db from "../utils/db";
import { NotFoundError } from "../types/Error";
import Product from "../types/Product";

const router = new Router();

router.get("/", verifyToken("user"), async (ctx) => {
  const page = parseInt(ctx.query.page as string);
  const paginate = isNaN(page) ? 1 : page;
  const search = ctx.query.search;

  const products: Product[] = [];
  const documents = await db.products
    .orderBy("name")
    .startAt(search)
    .endAt(search + "~")
    .limit(6)
    .offset(paginate * 6)
    .get();

  documents.forEach((document) => products.push(document.data()));
  ctx.ok(products);
});

router.get("/:id", verifyToken("user"), async (ctx) => {
  const id = ctx.params.id;
  const document = await db.products.doc(id).get();

  if (!document.exists) throw new NotFoundError();

  const product = document.data();
  ctx.ok(product);
});

export default router;
