import { eq } from "drizzle-orm";
import type {
  GetTasksByOwnerIdQueryServiceInput,
  GetTasksByOwnerIdQueryServiceInterface,
  GetTasksByOwnerIdQueryServicePayload,
} from "../../application/query-service/get-tasks-by-owner-id-query-service";
import type { Database } from "../../libs/drizzle/get-database";
import { tasks } from "../../libs/drizzle/schema";

export class PostgresqlGetTasksByOwnerIdQueryService
  implements GetTasksByOwnerIdQueryServiceInterface
{
  public constructor(private readonly database: Database) {}

  public async invoke(
    input: GetTasksByOwnerIdQueryServiceInput,
  ): Promise<GetTasksByOwnerIdQueryServicePayload> {
    return this.database
      .select({
        id: tasks.id,
        title: tasks.title,
        ownerId: tasks.ownerId,
        progressStatus: tasks.progressStatus,
      })
      .from(tasks)
      .where(eq(tasks.ownerId, input.ownerId));
  }
}
