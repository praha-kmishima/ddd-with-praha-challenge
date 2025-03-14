import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import {
  UpdateTaskProgressUseCase,
  UpdateTaskProgressUseCaseInvalidStatusError,
  UpdateTaskProgressUseCaseNotFoundError,
} from "../../application/use-case/update-task-progress-use-case";
import { PostgresqlTaskRepository } from "../../infrastructure/repository/postgresql-task-repository";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    updateTaskProgressUseCase: UpdateTaskProgressUseCase;
  };
};

export const updateTaskProgressController = new Hono<Env>();

updateTaskProgressController.put(
  "/tasks/:id/progress",
  zValidator("param", z.object({ id: z.string() }), (result, c) => {
    if (!result.success) {
      return c.text("invalid id", 400);
    }

    return;
  }),
  zValidator(
    "json",
    z.object({
      progressStatus: z.enum(["未着手", "取組中", "レビュー待ち", "完了"]),
      userId: z.string(), // userIdを必須項目とする
    }),
    (result, c) => {
      if (!result.success) {
        return c.text("invalid request body", 400);
      }

      return;
    },
  ),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const taskRepository = new PostgresqlTaskRepository(database);
    const updateTaskProgressUseCase = new UpdateTaskProgressUseCase(
      taskRepository,
    );
    context.set("updateTaskProgressUseCase", updateTaskProgressUseCase);

    await next();
  }),
  async (context) => {
    try {
      const param = context.req.valid("param");
      const body = context.req.valid("json");

      // userIdが空文字の場合はエラーを返す
      if (!body.userId) {
        return context.text("userId is required", 401);
      }

      const payload = await context.var.updateTaskProgressUseCase.invoke({
        taskId: param.id,
        progressStatus: body.progressStatus,
        requesterId: body.userId,
      });
      return context.json(payload);
    } catch (error) {
      if (error instanceof UpdateTaskProgressUseCaseNotFoundError) {
        return context.text(error.message, 404);
      }
      if (error instanceof UpdateTaskProgressUseCaseInvalidStatusError) {
        return context.text(error.message, 400);
      }

      throw error;
    }
  },
);
