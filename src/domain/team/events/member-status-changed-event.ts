import { DomainEvent } from "../../event";
import type { EnrollmentStatus } from "../../shared/enrollment-status";

/**
 * メンバー状態変更イベント
 * チームメンバーの在籍状態が変更されたときに発行される
 */
export class MemberStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly teamId: string,
    public readonly memberId: string,
    public readonly memberName: string,
    public readonly previousStatus: EnrollmentStatus,
    public readonly newStatus: EnrollmentStatus,
  ) {
    super();
  }
}
