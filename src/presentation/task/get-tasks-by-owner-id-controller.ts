import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import type { GetTasksByOwnerIdQueryServiceInterface } from "../../application/query-service/get-tasks-by-owner-id-query-service";
import { PostgresqlGetTasksByOwnerIdQueryService } from "../../infrastructure/query-service/postgresql-get-tasks-by-owner-id-query-service";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    getTasksByOwnerIdQueryService: GetTasksByOwnerIdQueryServiceInterface;
  };
};

export const getTasksByOwnerIdController = new Hono<Env>();

getTasksByOwnerIdController.get(
  "/tasks/owner/:ownerId",
  zValidator("param", z.object({ ownerId: z.string() }), (result, c) => {
    if (!result.success) {
      return c.text("invalid owner id", 400);
    }

    return;
  }),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const getTasksByOwnerIdQueryService =
      new PostgresqlGetTasksByOwnerIdQueryService(database);
    context.set("getTasksByOwnerIdQueryService", getTasksByOwnerIdQueryService);

    await next();
  }),
  async (context) => {
    const param = context.req.valid("param");

    const payload = await context.var.getTasksByOwnerIdQueryService.invoke({
      ownerId: param.ownerId,
    });

    return context.json(payload);
  },
);
