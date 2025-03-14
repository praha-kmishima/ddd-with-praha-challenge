import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import {
  CreateTeamUseCase,
  CreateTeamUseCaseInvalidNameError,
  CreateTeamUseCaseNameExistsError,
} from "../../application/use-case/create-team-use-case";
import { PostgresqlTeamRepository } from "../../infrastructure/repository/postgresql-team-repository";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    createTeamUseCase: CreateTeamUseCase;
  };
};

export const createTeamController = new Hono<Env>();

createTeamController.post(
  "/teams",
  zValidator(
    "json",
    z.object({
      name: z.string().min(1, "チーム名は必須です"),
    }),
    (result, c) => {
      if (!result.success) {
        return c.text("無効なチーム名です", 400);
      }
      return;
    },
  ),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const teamRepository = new PostgresqlTeamRepository(database);
    const createTeamUseCase = new CreateTeamUseCase(teamRepository);
    context.set("createTeamUseCase", createTeamUseCase);

    await next();
  }),
  async (context) => {
    try {
      const body = context.req.valid("json");

      const payload = await context.var.createTeamUseCase.invoke({
        name: body.name,
      });

      return context.json(payload, 201);
    } catch (error) {
      if (error instanceof CreateTeamUseCaseInvalidNameError) {
        return context.text(error.message, 400);
      }
      if (error instanceof CreateTeamUseCaseNameExistsError) {
        return context.text(error.message, 409); // 409 Conflict
      }

      // その他のエラー
      console.error("チーム作成エラー:", error);
      return context.text("チームの作成に失敗しました", 500);
    }
  },
);
