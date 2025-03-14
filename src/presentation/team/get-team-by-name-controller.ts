import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import type { TeamByNameQueryServiceInterface } from "../../application/query-service/team-by-name-query-service";
import { PostgresqlTeamByNameQueryService } from "../../infrastructure/query-service/postgresql-team-by-name-query-service";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    teamByNameQueryService: TeamByNameQueryServiceInterface;
  };
};

export const getTeamByNameController = new Hono<Env>();

getTeamByNameController.get(
  "/teams/by-name/:name",
  zValidator("param", z.object({ name: z.string() }), (result, c) => {
    if (!result.success) {
      return c.text("invalid name", 400);
    }

    return;
  }),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const teamByNameQueryService = new PostgresqlTeamByNameQueryService(
      database,
    );
    context.set("teamByNameQueryService", teamByNameQueryService);

    await next();
  }),
  async (context) => {
    const param = context.req.valid("param");

    const payload = await context.var.teamByNameQueryService.invoke({
      name: param.name,
    });
    if (!payload) {
      return context.text("team not found", 404);
    }
    return context.json(payload);
  },
);
