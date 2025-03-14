import type { TeamReorganizationService } from "../domain/services/team-reorganization-service";
import type { TeamRepository } from "../domain/team/team-repository";
import { TeamReorganizationPolicy } from "./policy/team-reorganization-policy";

/**
 * アプリケーションポリシーを初期化する
 * @param teamRepository チームリポジトリ
 * @param taskRepository タスクリポジトリ
 * @param teamReorganizationService チーム再編サービス
 */
export function initializeApplicationPolicies(
  teamRepository: TeamRepository,
  teamReorganizationService: TeamReorganizationService,
): void {
  // ポリシーのインスタンス化
  new TeamReorganizationPolicy(teamRepository, teamReorganizationService);

  console.log("Application policies initialized");
}
