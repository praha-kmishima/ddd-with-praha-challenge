import { type DomainEvent, DomainEvents } from "../../domain/event";
import type {
  TeamOversizedEvent,
  TeamUndersizedEvent,
} from "../../domain/team/events";
import type { TeamReorganizationService } from "../../domain/team/team-reorganization-service";
import type { TeamRepository } from "../../domain/team/team-repository";

/**
 * チーム再編ポリシー
 * チームサイズの変更に応じたチーム再編処理を調整する
 */
export class TeamReorganizationPolicy {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly teamReorganizationService: TeamReorganizationService,
  ) {
    // イベント購読の設定
    this.subscribeToEvents();
  }

  /**
   * イベント購読を設定する
   */
  private subscribeToEvents(): void {
    DomainEvents.subscribe(
      "TeamUndersizedEvent",
      this.handleTeamUndersized.bind(this),
    );
    DomainEvents.subscribe(
      "TeamOversizedEvent",
      this.handleTeamOversized.bind(this),
    );
  }

  /**
   * チームサイズが2名未満になった時の処理
   * @param event チーム過小サイズイベント
   */
  private async handleTeamUndersized(domainEvent: DomainEvent): Promise<void> {
    // DomainEventをTeamUndersizedEventにキャスト
    const event = domainEvent as TeamUndersizedEvent;
    console.log(
      `[TeamReorganizationPolicy] Team ${event.teamId} is undersized with ${event.currentSize} members`,
    );

    try {
      // 過小サイズのチームを取得
      const undersizedTeamResult = await this.teamRepository.findById(
        event.teamId,
      );
      if (!undersizedTeamResult.ok || !undersizedTeamResult.value) {
        console.error(
          `[TeamReorganizationPolicy] Failed to find undersized team: ${event.teamId}`,
        );
        return;
      }
      const undersizedTeam = undersizedTeamResult.value;

      // チームサイズが1名の場合、他のチームに統合する
      if (event.currentSize === 1) {
        // 最も人数が少ないチームを検索（同数の場合は最初に見つかったもの）
        const teamsResult = await this.teamRepository.findAll();
        if (!teamsResult.ok) {
          console.error(
            `[TeamReorganizationPolicy] Failed to find teams: ${teamsResult.error.message}`,
          );
          return;
        }

        // 統合先のチームを選択（自分自身以外で最も人数が少ないチーム）
        const targetTeam = teamsResult.value
          .filter((team) => team.getId() !== event.teamId) // 自分自身を除外
          .sort((a, b) => a.getMembers().length - b.getMembers().length)[0]; // メンバー数で昇順ソート // 最初の要素（最も人数が少ないチーム）

        if (!targetTeam) {
          console.log(
            "[TeamReorganizationPolicy] No target team found for merging",
          );
          // TODO: 管理者への通知
          return;
        }

        // チーム統合処理の実行
        const mergeResult = await this.teamReorganizationService.mergeTeams(
          undersizedTeam,
          targetTeam,
        );
        if (!mergeResult.ok) {
          console.error(
            `[TeamReorganizationPolicy] Failed to merge teams: ${mergeResult.error.message}`,
          );
          // TODO: 管理者への通知
          return;
        }

        console.log(
          `[TeamReorganizationPolicy] Successfully merged team ${event.teamId} into team ${targetTeam.getId()}`,
        );
        // TODO: 管理者への通知
      } else {
        // チームサイズが0の場合は何もしない
        console.log(
          `[TeamReorganizationPolicy] Team ${event.teamId} has ${event.currentSize} members, no action needed`,
        );
      }
    } catch (error) {
      console.error(
        `[TeamReorganizationPolicy] Error handling undersized team: ${error instanceof Error ? error.message : String(error)}`,
      );
      // TODO: 管理者への通知
    }
  }

  /**
   * チームサイズが4名を超えた時の処理
   * @param event チーム過大サイズイベント
   */
  private async handleTeamOversized(domainEvent: DomainEvent): Promise<void> {
    // DomainEventをTeamOversizedEventにキャスト
    const event = domainEvent as TeamOversizedEvent;
    console.log(
      `[TeamReorganizationPolicy] Team ${event.teamId} is oversized with ${event.currentSize} members`,
    );

    try {
      // 過大サイズのチームを取得
      const oversizedTeamResult = await this.teamRepository.findById(
        event.teamId,
      );
      if (!oversizedTeamResult.ok || !oversizedTeamResult.value) {
        console.error(
          `[TeamReorganizationPolicy] Failed to find oversized team: ${event.teamId}`,
        );
        return;
      }
      const oversizedTeam = oversizedTeamResult.value;

      // チーム分割処理の実行
      const splitResult =
        await this.teamReorganizationService.splitTeam(oversizedTeam);
      if (!splitResult.ok) {
        console.error(
          `[TeamReorganizationPolicy] Failed to split team: ${splitResult.error.message}`,
        );
        // TODO: 管理者への通知
        return;
      }

      console.log(
        `[TeamReorganizationPolicy] Successfully split team ${event.teamId} into ${splitResult.value.length} teams`,
      );
      // TODO: 管理者への通知
    } catch (error) {
      console.error(
        `[TeamReorganizationPolicy] Error handling oversized team: ${error instanceof Error ? error.message : String(error)}`,
      );
      // TODO: 管理者への通知
    }
  }
}
