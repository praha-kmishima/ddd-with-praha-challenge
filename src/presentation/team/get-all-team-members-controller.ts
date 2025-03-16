import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import type { GetAllTeamMembersQueryServiceInterface } from "../../application/query-service/get-all-team-members-query-service";
import { PostgresqlGetAllTeamMembersQueryService } from "../../infrastructure/query-service/postgresql-get-all-team-members-query-service";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    getAllTeamMembersQueryService: GetAllTeamMembersQueryServiceInterface;
  };
};

export const getAllTeamMembersController = new Hono<Env>();

getAllTeamMembersController.get(
  "/team-members",
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const getAllTeamMembersQueryService =
      new PostgresqlGetAllTeamMembersQueryService(database);
    context.set("getAllTeamMembersQueryService", getAllTeamMembersQueryService);

    await next();
  }),
  async (context) => {
    const teamMembers =
      await context.var.getAllTeamMembersQueryService.invoke();
    return context.json(teamMembers);
  },
);
