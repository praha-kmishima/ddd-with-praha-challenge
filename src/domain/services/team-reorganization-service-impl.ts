import { type Result, err, ok } from "../shared/result";
import { TeamName } from "../shared/team-name";
import { Team } from "../team/team";
import type { TeamRepository } from "../team/team-repository";
import type { TeamReorganizationService } from "./team-reorganization-service";

/**
 * チーム再編成サービスの実装
 * チームの統合や分割などの複雑なアルゴリズムを提供する
 */
export class TeamReorganizationServiceImpl
  implements TeamReorganizationService
{
  constructor(private readonly teamRepository: TeamRepository) {}

  /**
   * チームを統合する
   * @param sourceTeam 統合元のチーム（通常は1名のチーム）
   * @param targetTeam 統合先のチーム
   * @returns 統合結果
   */
  async mergeTeams(
    sourceTeam: Team,
    targetTeam: Team,
  ): Promise<Result<void, Error>> {
    // 前提条件のチェック
    // 1. sourceTeamとtargetTeamが同一でないこと
    if (sourceTeam.equals(targetTeam)) {
      return err(new Error("統合元と統合先のチームが同一です"));
    }

    // 2. sourceTeamのメンバー数が0より大きいこと
    const sourceMembers = sourceTeam.getMembers();
    if (sourceMembers.length === 0) {
      return err(new Error("統合元のチームにメンバーがいません"));
    }

    // 3. 統合後のチームサイズが4名以下であること
    const targetMembers = targetTeam.getMembers();
    if (sourceMembers.length + targetMembers.length > 4) {
      return err(
        new Error(
          `統合後のチームサイズが制限を超えます（${sourceMembers.length + targetMembers.length}名）`,
        ),
      );
    }

    // sourceTeamのメンバーをtargetTeamに移動
    for (const member of sourceMembers) {
      const addResult = targetTeam.addMember(member);
      if (!addResult.ok) {
        return err(
          new Error(`メンバーの移動に失敗しました: ${addResult.error.message}`),
        );
      }
    }

    // 変更を保存
    // 1. targetTeamをリポジトリに保存
    const saveTargetResult = await this.teamRepository.save(targetTeam);
    if (!saveTargetResult.ok) {
      return err(
        new Error(
          `統合先チームの保存に失敗しました: ${saveTargetResult.error.message}`,
        ),
      );
    }

    // 2. sourceTeamのメンバーをすべて削除（チームは残す）
    for (const member of sourceMembers) {
      const removeResult = sourceTeam.removeMember(member.getId());
      if (!removeResult.ok) {
        return err(
          new Error(
            `統合元チームからのメンバー削除に失敗しました: ${removeResult.error.message}`,
          ),
        );
      }
    }

    // 3. 空になったsourceTeamを保存
    const saveSourceResult = await this.teamRepository.save(sourceTeam);
    if (!saveSourceResult.ok) {
      return err(
        new Error(
          `統合元チームの保存に失敗しました: ${saveSourceResult.error.message}`,
        ),
      );
    }

    return ok(undefined);
  }

  /**
   * チームを分割する
   * @param team 分割対象のチーム（4名のチームのみ分割可能）
   * @returns 分割結果
   */
  async splitTeam(team: Team): Promise<Result<Team[], Error>> {
    // 前提条件のチェック
    // チームサイズが4名であることを確認
    const members = team.getMembers();
    if (members.length !== 4) {
      return err(
        new Error(
          `チームサイズが分割条件を満たしていません（${members.length}名、4名である必要があります）`,
        ),
      );
    }

    // 新しいチーム名を生成
    const originalName = team.getName().getValue();
    const newTeamNameResult = TeamName.create(`${originalName}-2`);
    if (!newTeamNameResult.ok) {
      return err(
        new Error(
          `新しいチーム名の生成に失敗しました: ${newTeamNameResult.error.message}`,
        ),
      );
    }

    // 新しいチームを作成
    const newTeamResult = Team.create({
      name: newTeamNameResult.value,
    });
    if (!newTeamResult.ok) {
      return err(
        new Error(
          `新しいチームの作成に失敗しました: ${newTeamResult.error.message}`,
        ),
      );
    }
    const newTeam = newTeamResult.value;

    // メンバーの分配
    // 分配アルゴリズム: メンバーを均等に分配（4名の場合、各チーム2名ずつ）
    const membersToMove = members.slice(0, 2);

    // 新しいチームにメンバーを追加
    for (const member of membersToMove) {
      const addResult = newTeam.addMember(member);
      if (!addResult.ok) {
        return err(
          new Error(
            `新しいチームへのメンバー追加に失敗しました: ${addResult.error.message}`,
          ),
        );
      }
    }

    // 元のチームからメンバーを削除
    for (const member of membersToMove) {
      const removeResult = team.removeMember(member.getId());
      if (!removeResult.ok) {
        return err(
          new Error(
            `元のチームからのメンバー削除に失敗しました: ${removeResult.error.message}`,
          ),
        );
      }
    }

    // 両方のチームを保存
    const saveOriginalResult = await this.teamRepository.save(team);
    if (!saveOriginalResult.ok) {
      return err(
        new Error(
          `元のチームの保存に失敗しました: ${saveOriginalResult.error.message}`,
        ),
      );
    }

    const saveNewResult = await this.teamRepository.save(newTeam);
    if (!saveNewResult.ok) {
      return err(
        new Error(
          `新しいチームの保存に失敗しました: ${saveNewResult.error.message}`,
        ),
      );
    }

    return ok([team, newTeam]);
  }
}
