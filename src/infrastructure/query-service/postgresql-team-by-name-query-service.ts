import { eq } from "drizzle-orm";
import type {
  TeamByNameQueryServiceInput,
  TeamByNameQueryServiceInterface,
  TeamByNameQueryServicePayload,
} from "../../application/query-service/team-by-name-query-service";
import type { Database } from "../../libs/drizzle/get-database";
import { teamMembers, teams } from "../../libs/drizzle/schema";

export class PostgresqlTeamByNameQueryService
  implements TeamByNameQueryServiceInterface
{
  public constructor(private readonly database: Database) {}

  public async invoke(
    input: TeamByNameQueryServiceInput,
  ): Promise<TeamByNameQueryServicePayload | undefined> {
    // チーム情報を取得
    const teamRow = await this.database
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teams)
      .where(eq(teams.name, input.name))
      .then((rows) => rows[0]);

    if (!teamRow) {
      return undefined;
    }

    // チームメンバー情報を取得
    const memberRows = await this.database
      .select({
        id: teamMembers.id,
        name: teamMembers.name,
        email: teamMembers.email,
        status: teamMembers.status,
      })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamRow.id));

    // 結果を返却
    return {
      id: teamRow.id,
      name: teamRow.name,
      members: memberRows,
    };
  }
}
