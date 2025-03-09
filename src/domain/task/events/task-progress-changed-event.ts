import { DomainEvent } from "../../event";
import type { ProgressStatus } from "../../shared/progress-status";

/**
 * 課題進捗ステータス変更イベント
 * 課題の進捗ステータスが変更されたときに発行される
 */
export class TaskProgressChangedEvent extends DomainEvent {
  constructor(
    public readonly taskId: string,
    public readonly ownerId: string,
    public readonly previousStatus: ProgressStatus,
    public readonly newStatus: ProgressStatus,
  ) {
    super();
  }
}
