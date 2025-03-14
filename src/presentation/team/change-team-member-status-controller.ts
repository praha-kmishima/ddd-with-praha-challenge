import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import {
  ChangeTeamMemberStatusUseCase,
  ChangeTeamMemberStatusUseCaseInvalidStatusError,
  ChangeTeamMemberStatusUseCaseInvalidTransitionError,
  ChangeTeamMemberStatusUseCaseMemberNotFoundError,
  ChangeTeamMemberStatusUseCaseTeamNotFoundError,
} from "../../application/use-case/change-team-member-status-use-case";
import { PostgresqlTeamRepository } from "../../infrastructure/repository/postgresql-team-repository";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    changeTeamMemberStatusUseCase: ChangeTeamMemberStatusUseCase;
  };
};

export const changeTeamMemberStatusController = new Hono<Env>();

changeTeamMemberStatusController.patch(
  "/teams/:id/members/:memberId/status",
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
  zValidator(
    "json",
    z.object({
      newStatus: z.enum(["在籍中", "休会中", "退会済"], {
        errorMap: () => ({
          message:
            "在籍状態は「在籍中」「休会中」「退会済」のいずれかを指定してください",
        }),
      }),
    }),
    (result, c) => {
      if (!result.success) {
        return c.text("無効な在籍状態です", 400);
      }
      return;
    },
  ),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const teamRepository = new PostgresqlTeamRepository(database);
    const changeTeamMemberStatusUseCase = new ChangeTeamMemberStatusUseCase(
      teamRepository,
    );
    context.set("changeTeamMemberStatusUseCase", changeTeamMemberStatusUseCase);

    await next();
  }),
  async (context) => {
    try {
      const param = context.req.valid("param");
      const body = context.req.valid("json");

      const payload = await context.var.changeTeamMemberStatusUseCase.invoke({
        teamId: param.id,
        memberId: param.memberId,
        newStatus: body.newStatus,
      });

      return context.json(payload, 200);
    } catch (error) {
      if (error instanceof ChangeTeamMemberStatusUseCaseTeamNotFoundError) {
        return context.text(error.message, 404);
      }
      if (error instanceof ChangeTeamMemberStatusUseCaseMemberNotFoundError) {
        return context.text(error.message, 404);
      }
      if (error instanceof ChangeTeamMemberStatusUseCaseInvalidStatusError) {
        return context.text(error.message, 400);
      }
      if (
        error instanceof ChangeTeamMemberStatusUseCaseInvalidTransitionError
      ) {
        return context.text(error.message, 400);
      }

      // その他のエラー
      console.error("チームメンバー在籍状態変更エラー:", error);
      return context.text("チームメンバーの在籍状態変更に失敗しました", 500);
    }
  },
);
