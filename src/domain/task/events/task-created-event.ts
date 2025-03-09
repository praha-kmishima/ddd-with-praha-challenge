import { DomainEvent } from "../../event";
import type { ProgressStatus } from "../../shared/progress-status";

/**
 * 課題作成イベント
 * 課題が新規作成されたときに発行される
 */
export class TaskCreatedEvent extends DomainEvent {
  constructor(
    public readonly taskId: string,
    public readonly title: string,
    public readonly ownerId: string,
    public readonly progressStatus: ProgressStatus,
  ) {
    super();
  }
}
