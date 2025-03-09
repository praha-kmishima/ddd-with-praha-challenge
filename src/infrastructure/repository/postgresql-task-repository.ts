import { eq, sql } from "drizzle-orm";
import { ProgressStatus } from "../../domain/shared/progress-status";
import { type Result, err, ok } from "../../domain/shared/result";
import { Task } from "../../domain/task/task";
import type { TaskRepositoryInterface } from "../../domain/task/task-repository";
import type { Database } from "../../libs/drizzle/get-database";
import { tasks } from "../../libs/drizzle/schema";

export class PostgresqlTaskRepository implements TaskRepositoryInterface {
  public constructor(private readonly database: Database) {}

  public async save(task: Task): Promise<Result<Task, Error>> {
    try {
      const [row] = await this.database
        .insert(tasks)
        .values({
          id: task.id,
          title: task.title,
          ownerId: task.ownerId,
          progressStatus: task.progressStatus.getValue(),
        })
        .onConflictDoUpdate({
          target: tasks.id,
          set: {
            title: sql.raw(`excluded.${tasks.title.name}`),
            progressStatus: sql.raw(`excluded.${tasks.progressStatus.name}`),
          },
        })
        .returning({
          id: tasks.id,
          title: tasks.title,
          ownerId: tasks.ownerId,
          progressStatus: tasks.progressStatus,
        });

      if (!row) {
        return err(new Error("Failed to save a task"));
      }

      // 進捗ステータスの復元
      const progressStatusResult = ProgressStatus.create(row.progressStatus);
      if (!progressStatusResult.ok) {
        return err(progressStatusResult.error);
      }

      return ok(
        new Task({
          id: row.id,
          title: row.title,
          ownerId: row.ownerId,
          progressStatus: progressStatusResult.value,
        }),
      );
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error("Unknown error occurred while saving task"),
      );
    }
  }

  public async findById(id: string): Promise<Result<Task | null, Error>> {
    try {
      const [row] = await this.database
        .select({
          id: tasks.id,
          title: tasks.title,
          ownerId: tasks.ownerId,
          progressStatus: tasks.progressStatus,
        })
        .from(tasks)
        .where(eq(tasks.id, id));

      if (!row) {
        return ok(null);
      }

      // 進捗ステータスの復元
      const progressStatusResult = ProgressStatus.create(row.progressStatus);
      if (!progressStatusResult.ok) {
        return err(progressStatusResult.error);
      }

      return ok(
        new Task({
          id: row.id,
          title: row.title,
          ownerId: row.ownerId,
          progressStatus: progressStatusResult.value,
        }),
      );
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error("Unknown error occurred while finding task"),
      );
    }
  }

  public async findByOwnerId(ownerId: string): Promise<Result<Task[], Error>> {
    try {
      const rows = await this.database
        .select({
          id: tasks.id,
          title: tasks.title,
          ownerId: tasks.ownerId,
          progressStatus: tasks.progressStatus,
        })
        .from(tasks)
        .where(eq(tasks.ownerId, ownerId));

      const taskResults = await Promise.all(
        rows.map(async (row) => {
          // 進捗ステータスの復元
          const progressStatusResult = ProgressStatus.create(
            row.progressStatus,
          );
          if (!progressStatusResult.ok) {
            return err(progressStatusResult.error);
          }

          return ok(
            new Task({
              id: row.id,
              title: row.title,
              ownerId: row.ownerId,
              progressStatus: progressStatusResult.value,
            }),
          );
        }),
      );

      // エラーがあれば最初のエラーを返す
      const errorResult = taskResults.find((result) => !result.ok);
      if (errorResult && !errorResult.ok) {
        return err(errorResult.error);
      }

      // すべて成功した場合は、タスクの配列を返す
      return ok(
        taskResults.map((result) => {
          if (result.ok) {
            return result.value;
          }
          throw new Error("Unexpected error"); // ここには到達しないはず
        }),
      );
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error("Unknown error occurred while finding tasks by owner"),
      );
    }
  }
}
