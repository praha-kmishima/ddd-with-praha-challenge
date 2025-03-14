import { inArray } from "drizzle-orm";
import type {
  GetAllTeamsQueryServiceInterface,
  GetAllTeamsQueryServicePayload,
} from "../../application/query-service/get-all-teams-query-service";
import type { Database } from "../../libs/drizzle/get-database";
import { teamMembers, teams } from "../../libs/drizzle/schema";

export class PostgresqlGetAllTeamsQueryService
  implements GetAllTeamsQueryServiceInterface
{
  public constructor(private readonly database: Database) {}

  public async invoke(): Promise<GetAllTeamsQueryServicePayload> {
    // すべてのチーム情報を取得
    const teamRows = await this.database
      .select({
        id: teams.id,
        name: teams.name,
      })
      .from(teams);

    // 結果が空の場合は空配列を返す
    if (teamRows.length === 0) {
      return [];
    }

    // すべてのチームIDを抽出
    const teamIds = teamRows.map((team) => team.id);

    // すべてのチームメンバーを一度に取得
    const memberRows = await this.database
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        name: teamMembers.name,
        email: teamMembers.email,
        status: teamMembers.status,
      })
      .from(teamMembers)
      .where(inArray(teamMembers.teamId, teamIds));

    // チームIDごとにメンバーをグループ化
    const membersByTeamId = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        status: string;
      }[]
    >();

    for (const member of memberRows) {
      if (!membersByTeamId.has(member.teamId)) {
        membersByTeamId.set(member.teamId, []);
      }

      const members = membersByTeamId.get(member.teamId);
      if (members) {
        members.push({
          id: member.id,
          name: member.name,
          email: member.email,
          status: member.status,
        });
      }
    }

    // 最終的な結果を構築
    return teamRows.map((team) => ({
      id: team.id,
      name: team.name,
      members: membersByTeamId.get(team.id) || [],
    }));
  }
}
