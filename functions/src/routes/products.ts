import Router = require("@koa/router");
import Joi = require("joi");

import verifyToken from "../middlewares/tokens";
import db from "../utils/db";
import { ForbiddenError, NotFoundError } from "../types/Error";
import Product from "../types/Product";

const router = new Router();

router.get("/", verifyToken("user"), async (ctx) => {
  const page = parseInt(ctx.query.page as string);
  const paginate = isNaN(page) ? 1 : page;
  const search = ctx.query.search;

  const products: Product[] = [];
  const documentsRef = search ?
    db.products
      .orderBy("name")
      .startAt(search)
      .endAt(search + "~") :
    db.products;

  const documents = await documentsRef
    .limit(6)
    .offset((paginate - 1) * 6)
    .get();

  documents.forEach((document) => {
    products.push({ ...document.data(), id: document.id });
  });

  ctx.ok(products);
});

router.get("/:id", verifyToken("user"), async (ctx) => {
  const id = ctx.params.id;
  const document = await db.products.doc(id).get();

  if (!document.exists) throw new NotFoundError();

  const product = document.data();
  ctx.ok(product);
});

router.post("/", verifyToken(["bank", "seller"]), async (ctx) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().min(3).max(254).required(),
    price: Joi.number().min(1).required(),
    marketplaces: Joi.array()
      .min(1)
      .items({
        name: Joi.string().required(),
        url: Joi.string().required(),
      })
      .required(),
  });

  const body = await schema.validateAsync(ctx.request.body);
  const { name, description, price, marketplaces } = body;

  const product: Product = {
    name,
    description,
    price,
    marketplaces,
    ownerId: ctx.state.uid,
  };

  const { id } = await db.products.add(product);
  ctx.created({ id, ...product });
});

router.put("/:id", verifyToken(["bank", "seller"]), async (ctx) => {
  const productId = ctx.params.id;

  const schema = Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().min(3).max(254),
    price: Joi.number().min(1),
    marketplaces: Joi.array().min(1).items({
      name: Joi.string().required(),
      url: Joi.string().required(),
    }),
  });

  const body = await schema.validateAsync(ctx.request.body);
  const { name, description, price, marketplaces } = body;

  const documentRef = db.products.doc(productId);
  const document = await documentRef.get();

  if (!document.exists) throw new NotFoundError();

  const existingProduct = document.data() as Product;
  if (existingProduct.ownerId !== ctx.state.uid) throw new ForbiddenError();

  const updatedProduct = { ...existingProduct };

  if (name) updatedProduct.name = name;
  if (description) updatedProduct.description = description;
  if (price) updatedProduct.price = price;
  if (marketplaces) updatedProduct.marketplaces = marketplaces;

  await db.products.doc(productId).update(updatedProduct);

  ctx.ok(updatedProduct);
});

router.delete("/:id", verifyToken(["bank", "seller"]), async (ctx) => {
  const productId = ctx.params.id;

  const documentRef = db.products.doc(productId);
  const document = await documentRef.get();

  if (!document.exists) throw new NotFoundError();
  if (document.data()?.ownerId !== ctx.state.uid) throw new ForbiddenError();

  await documentRef.delete();

  ctx.noContent();
});

export default router;
