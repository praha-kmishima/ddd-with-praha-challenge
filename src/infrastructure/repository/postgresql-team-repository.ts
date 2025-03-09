import { and, eq, sql } from "drizzle-orm";
import { type Result, err, ok } from "../../domain/shared/result";
import { TeamName } from "../../domain/shared/team-name";
import { Team } from "../../domain/team/team";
import { TeamMember } from "../../domain/team/team-member";
import type { TeamRepository } from "../../domain/team/team-repository";
import type { Database } from "../../libs/drizzle/get-database";
import { teamMembers, teams } from "../../libs/drizzle/schema";

/**
 * PostgreSQLを使用したチームリポジトリの実装
 */
export class PostgresqlTeamRepository implements TeamRepository {
  constructor(private readonly database: Database) {}

  /**
   * チームを保存する
   * @param team 保存するチーム
   * @returns 保存結果
   */
  async save(team: Team): Promise<Result<void, Error>> {
    try {
      // トランザクションを開始
      await this.database.transaction(async (tx) => {
        // チーム情報を保存
        await tx
          .insert(teams)
          .values({
            id: team.getId(),
            name: team.getName().getValue(),
          })
          .onConflictDoUpdate({
            target: teams.id,
            set: {
              name: sql.raw(`excluded.${teams.name.name}`),
            },
          });

        // 現在のメンバーIDを取得
        const currentMemberIds = (
          await tx
            .select({ id: teamMembers.id })
            .from(teamMembers)
            .where(eq(teamMembers.teamId, team.getId()))
        ).map((row) => row.id);

        // 新しいメンバーのIDを取得
        const newMemberIds = team.getMembers().map((member) => member.getId());

        // 削除すべきメンバーを特定して削除
        const memberIdsToDelete = currentMemberIds.filter(
          (id) => !newMemberIds.includes(id),
        );
        if (memberIdsToDelete.length > 0) {
          await tx
            .delete(teamMembers)
            .where(
              and(
                eq(teamMembers.teamId, team.getId()),
                sql`${teamMembers.id} IN (${sql.join(memberIdsToDelete)})`,
              ),
            );
        }

        // メンバー情報を保存（既存メンバーの更新と新規メンバーの追加）
        for (const member of team.getMembers()) {
          await tx
            .insert(teamMembers)
            .values({
              id: member.getId(),
              teamId: team.getId(),
              name: member.getName(),
              email: member.getEmail().getValue(),
              status: member.getStatus().getValue(),
            })
            .onConflictDoUpdate({
              target: teamMembers.id,
              set: {
                teamId: sql.raw(`excluded.${teamMembers.teamId.name}`),
                name: sql.raw(`excluded.${teamMembers.name.name}`),
                email: sql.raw(`excluded.${teamMembers.email.name}`),
                status: sql.raw(`excluded.${teamMembers.status.name}`),
              },
            });
        }
      });

      return ok(undefined);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * IDでチームを取得する
   * @param id チームID
   * @returns 取得結果
   */
  async findById(id: string): Promise<Result<Team | null, Error>> {
    try {
      // チーム情報を取得
      const teamRow = await this.database
        .select({
          id: teams.id,
          name: teams.name,
        })
        .from(teams)
        .where(eq(teams.id, id))
        .then((rows) => rows[0]);

      if (!teamRow) {
        return ok(null);
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
        .where(eq(teamMembers.teamId, id));

      // チーム名の値オブジェクトを作成
      const teamNameResult = TeamName.create(teamRow.name);
      if (!teamNameResult.ok) {
        return err(teamNameResult.error);
      }

      // メンバーのエンティティを作成
      const members: TeamMember[] = [];
      for (const memberRow of memberRows) {
        const memberResult = TeamMember.reconstruct({
          id: memberRow.id,
          name: memberRow.name,
          email: memberRow.email,
          status: memberRow.status,
        });

        if (!memberResult.ok) {
          return err(memberResult.error);
        }

        members.push(memberResult.value);
      }

      // チームエンティティを再構築
      const teamResult = Team.reconstruct({
        id: teamRow.id,
        name: teamNameResult.value,
        members,
      });

      if (!teamResult.ok) {
        return err(teamResult.error);
      }

      return ok(teamResult.value);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * チーム名でチームを取得する
   * @param name チーム名
   * @returns 取得結果
   */
  async findByName(name: TeamName): Promise<Result<Team | null, Error>> {
    try {
      const teamRow = await this.database
        .select({
          id: teams.id,
        })
        .from(teams)
        .where(eq(teams.name, name.getValue()))
        .then((rows) => rows[0]);

      if (!teamRow) {
        return ok(null);
      }

      return this.findById(teamRow.id);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * すべてのチームを取得する
   * @returns 取得結果
   */
  async findAll(): Promise<Result<Team[], Error>> {
    try {
      const teamRows = await this.database.select().from(teams);

      const teamsResult: Team[] = [];
      for (const teamRow of teamRows) {
        const teamResult = await this.findById(teamRow.id);
        if (!teamResult.ok) {
          return err(teamResult.error);
        }

        if (teamResult.value) {
          teamsResult.push(teamResult.value);
        }
      }

      return ok(teamsResult);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * メンバーIDでチームを取得する
   * @param memberId メンバーID
   * @returns 取得結果
   */
  async findByMemberId(memberId: string): Promise<Result<Team | null, Error>> {
    try {
      const memberRow = await this.database
        .select({
          teamId: teamMembers.teamId,
        })
        .from(teamMembers)
        .where(eq(teamMembers.id, memberId))
        .then((rows) => rows[0]);

      if (!memberRow) {
        return ok(null);
      }

      return this.findById(memberRow.teamId);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * チーム名が既に使用されているかを確認する
   * @param name チーム名
   * @returns 確認結果
   */
  async exists(name: TeamName): Promise<Result<boolean, Error>> {
    try {
      const count = await this.database
        .select({ count: sql`count(*)` })
        .from(teams)
        .where(eq(teams.name, name.getValue()))
        .then((rows) => Number(rows[0]?.count || 0));

      return ok(count > 0);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * 最も人数の少ないチームを取得する
   * @returns 取得結果
   */
  async findSmallestTeam(): Promise<Result<Team | null, Error>> {
    try {
      // チームごとのメンバー数を集計
      const teamSizes = await this.database
        .select({
          teamId: teamMembers.teamId,
          memberCount: sql<number>`count(${teamMembers.id})`,
        })
        .from(teamMembers)
        .groupBy(teamMembers.teamId)
        .orderBy(sql`memberCount asc`)
        .limit(1);

      if (teamSizes.length === 0 || !teamSizes[0]) {
        return ok(null);
      }

      return this.findById(teamSizes[0].teamId);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
