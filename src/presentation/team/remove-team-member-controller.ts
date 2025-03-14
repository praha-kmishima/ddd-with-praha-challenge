import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import {
  RemoveTeamMemberUseCase,
  RemoveTeamMemberUseCaseMemberNotFoundError,
  RemoveTeamMemberUseCaseTeamNotFoundError,
  RemoveTeamMemberUseCaseTeamSizeError,
} from "../../application/use-case/remove-team-member-use-case";
import { PostgresqlTeamRepository } from "../../infrastructure/repository/postgresql-team-repository";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    removeTeamMemberUseCase: RemoveTeamMemberUseCase;
  };
};

export const removeTeamMemberController = new Hono<Env>();

removeTeamMemberController.delete(
  "/teams/:id/members/:memberId",
  zValidator(
    "param",
    z.object({
      id: z.string(),
      memberId: z.string(),
    }),
    (result, c) => {
      if (!result.success) {
        return c.text("無効なパラメータです", 400);
      }
      return;
    },
  ),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const teamRepository = new PostgresqlTeamRepository(database);
    const removeTeamMemberUseCase = new RemoveTeamMemberUseCase(teamRepository);
    context.set("removeTeamMemberUseCase", removeTeamMemberUseCase);

    await next();
  }),
  async (context) => {
    try {
      const param = context.req.valid("param");

      const payload = await context.var.removeTeamMemberUseCase.invoke({
        teamId: param.id,
        memberId: param.memberId,
      });

      return context.json(payload, 200);
    } catch (error) {
      if (error instanceof RemoveTeamMemberUseCaseTeamNotFoundError) {
        return context.text(error.message, 404);
      }
      if (error instanceof RemoveTeamMemberUseCaseMemberNotFoundError) {
        return context.text(error.message, 404);
      }
      if (error instanceof RemoveTeamMemberUseCaseTeamSizeError) {
        return context.text(error.message, 400);
      }

      // その他のエラー
      console.error("チームメンバー削除エラー:", error);
      return context.text("チームメンバーの削除に失敗しました", 500);
    }
  },
);
