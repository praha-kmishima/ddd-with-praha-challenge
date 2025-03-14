import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import {
  AddTeamMemberUseCase,
  AddTeamMemberUseCaseInvalidMemberError,
  AddTeamMemberUseCaseMemberAlreadyExistsError,
  AddTeamMemberUseCaseTeamNotFoundError,
  AddTeamMemberUseCaseTeamSizeError,
} from "../../application/use-case/add-team-member-use-case";
import { PostgresqlTeamRepository } from "../../infrastructure/repository/postgresql-team-repository";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    addTeamMemberUseCase: AddTeamMemberUseCase;
  };
};

export const addTeamMemberController = new Hono<Env>();

addTeamMemberController.post(
  "/teams/:id/members",
  zValidator("param", z.object({ id: z.string() }), (result, c) => {
    if (!result.success) {
      return c.text("無効なチームIDです", 400);
    }
    return;
  }),
  zValidator(
    "json",
    z.object({
      memberName: z.string().min(1, "メンバー名は必須です"),
      memberEmail: z.string().email("有効なメールアドレスを入力してください"),
    }),
    (result, c) => {
      if (!result.success) {
        return c.text("無効なメンバー情報です", 400);
      }
      return;
    },
  ),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const teamRepository = new PostgresqlTeamRepository(database);
    const addTeamMemberUseCase = new AddTeamMemberUseCase(teamRepository);
    context.set("addTeamMemberUseCase", addTeamMemberUseCase);

    await next();
  }),
  async (context) => {
    try {
      const param = context.req.valid("param");
      const body = context.req.valid("json");

      const payload = await context.var.addTeamMemberUseCase.invoke({
        teamId: param.id,
        memberName: body.memberName,
        memberEmail: body.memberEmail,
      });

      return context.json(payload, 201);
    } catch (error) {
      if (error instanceof AddTeamMemberUseCaseTeamNotFoundError) {
        return context.text(error.message, 404);
      }
      if (error instanceof AddTeamMemberUseCaseInvalidMemberError) {
        return context.text(error.message, 400);
      }
      if (error instanceof AddTeamMemberUseCaseTeamSizeError) {
        return context.text(error.message, 400);
      }
      if (error instanceof AddTeamMemberUseCaseMemberAlreadyExistsError) {
        return context.text(error.message, 409); // 409 Conflict
      }

      // その他のエラー
      console.error("チームメンバー追加エラー:", error);
      return context.text("チームメンバーの追加に失敗しました", 500);
    }
  },
);
