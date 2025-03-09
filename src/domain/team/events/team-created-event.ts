import { DomainEvent } from "../../event";
import type { TeamName } from "../../shared/team-name";

/**
 * チーム作成イベント
 * チームが新規作成されたときに発行される
 */
export class TeamCreatedEvent extends DomainEvent {
  constructor(
    public readonly teamId: string,
    public readonly teamName: TeamName,
  ) {
    super();
  }
}
