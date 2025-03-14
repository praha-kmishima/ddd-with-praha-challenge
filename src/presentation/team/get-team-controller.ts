import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import type { TeamQueryServiceInterface } from "../../application/query-service/team-query-service";
import { PostgresqlTeamQueryService } from "../../infrastructure/query-service/postgresql-team-query-service";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    teamQueryService: TeamQueryServiceInterface;
  };
};

export const getTeamController = new Hono<Env>();

getTeamController.get(
  "/teams/:id",
  zValidator("param", z.object({ id: z.string() }), (result, c) => {
    if (!result.success) {
      return c.text("invalid id", 400);
    }

    return;
  }),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const teamQueryService = new PostgresqlTeamQueryService(database);
    context.set("teamQueryService", teamQueryService);

    await next();
  }),
  async (context) => {
    const param = context.req.valid("param");

    const payload = await context.var.teamQueryService.invoke(param);
    if (!payload) {
      return context.text("team not found", 404);
    }
    return context.json(payload);
  },
);
