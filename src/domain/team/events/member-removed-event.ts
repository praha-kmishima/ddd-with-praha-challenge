import { DomainEvent } from "../../event";

/**
 * メンバー削除イベント
 * チームからメンバーが削除されたときに発行される
 */
export class MemberRemovedEvent extends DomainEvent {
  constructor(
    public readonly teamId: string,
    public readonly memberId: string,
    public readonly memberName: string,
  ) {
    super();
  }
}
