import { DomainEvent } from "../../event";
import type { TeamName } from "../../shared/team-name";

/**
 * チーム過小サイズイベント
 * チームサイズが2名未満になったときに発行される
 */
export class TeamUndersizedEvent extends DomainEvent {
  constructor(
    public readonly teamId: string,
    public readonly teamName: TeamName,
    public readonly currentSize: number,
  ) {
    super();
  }
}
