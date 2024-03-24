import Router = require("@koa/router");
const router = new Router();

router.get("/", async (ctx) => {
  ctx.ok("Hello from Waste Not API!");
});

export default router;
