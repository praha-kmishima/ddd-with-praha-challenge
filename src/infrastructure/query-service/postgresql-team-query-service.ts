import { eq } from "drizzle-orm";
import type {
  TeamQueryServiceInput,
  TeamQueryServiceInterface,
  TeamQueryServicePayload,
} from "../../application/query-service/team-query-service";
import type { Database } from "../../libs/drizzle/get-database";
import { teamMembers, teams } from "../../libs/drizzle/schema";

export class PostgresqlTeamQueryService implements TeamQueryServiceInterface {
  public constructor(private readonly database: Database) {}

  public async invoke(
    input: TeamQueryServiceInput,
  ): Promise<TeamQueryServicePayload | undefined> {
    // チーム情報を取得
    const teamRow = await this.database
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teams)
      .where(eq(teams.id, input.id))
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
