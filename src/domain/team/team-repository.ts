import type { Result } from "../shared/result";
import type { TeamName } from "../shared/team-name";
import type { Team } from "./team";

/**
 * チームリポジトリのインターフェース
 * チームの永続化と取得を担当する
 */
export interface TeamRepository {
  /**
   * チームを保存する
   * @param team 保存するチーム
   * @returns 保存結果
   */
  save(team: Team): Promise<Result<void, Error>>;

  /**
   * IDでチームを取得する
   * @param id チームID
   * @returns 取得結果
   */
  findById(id: string): Promise<Result<Team | null, Error>>;

  /**
   * チーム名でチームを取得する
   * @param name チーム名
   * @returns 取得結果
   */
  findByName(name: TeamName): Promise<Result<Team | null, Error>>;

  /**
   * すべてのチームを取得する
   * @returns 取得結果
   */
  findAll(): Promise<Result<Team[], Error>>;

  /**
   * メンバーIDでチームを取得する
   * @param memberId メンバーID
   * @returns 取得結果
   */
  findByMemberId(memberId: string): Promise<Result<Team | null, Error>>;

  /**
   * チーム名が既に使用されているかを確認する
   * @param name チーム名
   * @returns 確認結果
   */
  exists(name: TeamName): Promise<Result<boolean, Error>>;

  /**
   * 最も人数の少ないチームを取得する
   * @returns 取得結果
   */
  findSmallestTeam(): Promise<Result<Team | null, Error>>;
}
