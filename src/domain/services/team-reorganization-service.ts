import type { Result } from "../shared/result";
import type { Team } from "../team/team";

/**
 * チーム再編サービス
 * チームの統合や分割などの複雑なアルゴリズムを提供する
 */
export interface TeamReorganizationService {
  /**
   * チームを統合する
   * @param sourceTeam 統合元のチーム（通常は1名のチーム）
   * @param targetTeam 統合先のチーム
   * @returns 統合結果
   */
  mergeTeams(sourceTeam: Team, targetTeam: Team): Promise<Result<void, Error>>;

  /**
   * チームを分割する
   * @param oversizedTeam 分割対象のチーム（通常は5名以上のチーム）
   * @returns 分割結果
   */
  splitTeam(oversizedTeam: Team): Promise<Result<Team[], Error>>;
}
