import Router = require("@koa/router");

import verifyToken from "../middlewares/tokens";
import db from "../utils/db";
import Bank from "../types/Bank";

const router = new Router();

router.get("/", verifyToken("user"), async (ctx) => {
  const search = ctx.query.search;

  const banks: Bank[] = [];
  const documents = await db.banks
    .orderBy("name")
    .startAt(search)
    .endAt(search + "~")
    .limit(6)
    .get();

  documents.forEach((document) => banks.push(document.data()));
  ctx.ok(banks);
});

export default router;
