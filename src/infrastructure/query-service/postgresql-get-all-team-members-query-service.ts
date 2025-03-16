import type {
  GetAllTeamMembersQueryServiceInterface,
  GetAllTeamMembersQueryServicePayload,
} from "../../application/query-service/get-all-team-members-query-service";
import type { Database } from "../../libs/drizzle/get-database";
import { teamMembers } from "../../libs/drizzle/schema";

export class PostgresqlGetAllTeamMembersQueryService
  implements GetAllTeamMembersQueryServiceInterface
{
  public constructor(private readonly database: Database) {}

  public async invoke(): Promise<GetAllTeamMembersQueryServicePayload> {
    return this.database
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        email: teamMembers.email,
        status: teamMembers.status,
        teamId: teamMembers.teamId,
      })
      .from(teamMembers);
  }
}
