import { DomainEvent } from "../../event";
import type { EmailAddress } from "../../shared/email-address";
import type { EnrollmentStatus } from "../../shared/enrollment-status";

/**
 * メンバー追加イベント
 * チームにメンバーが追加されたときに発行される
 */
export class MemberAddedEvent extends DomainEvent {
  constructor(
    public readonly teamId: string,
    public readonly memberId: string,
    public readonly memberName: string,
    public readonly memberEmail: EmailAddress,
    public readonly memberStatus: EnrollmentStatus,
  ) {
    super();
  }
}
