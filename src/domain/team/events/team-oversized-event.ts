import { DomainEvent } from "../../event";
import type { TeamName } from "../../shared/team-name";

/**
 * チーム過大サイズイベント
 * チームサイズが4名を超えたときに発行される
 */
export class TeamOversizedEvent extends DomainEvent {
  constructor(
    public readonly teamId: string,
    public readonly teamName: TeamName,
    public readonly currentSize: number,
  ) {
    super();
  }
}
