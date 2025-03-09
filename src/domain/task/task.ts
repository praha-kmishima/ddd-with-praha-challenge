import { z } from "zod";
import { ulid } from "../../libs/ulid";
import { DomainEvents } from "../event";
import { ProgressStatus } from "../shared/progress-status";
import { type Result, err, ok } from "../shared/result";
import { TaskCreatedEvent, TaskProgressChangedEvent } from "./events";

export class Task {
  readonly #id: string;
  #title: string;
  #progressStatus: ProgressStatus;
  readonly #ownerId: string;

  private readonly titleSchema = z
    .string()
    .min(1, "title must not be empty")
    .max(100, "title must be less than 100 characters");

  public constructor(
    props:
      | { title: string; ownerId: string }
      | {
          id: string;
          title: string;
          progressStatus: ProgressStatus;
          ownerId: string;
        },
  ) {
    const fromData = "id" in props;
    if (fromData) {
      this.#id = props.id;
      this.#title = props.title;
      this.#progressStatus = props.progressStatus;
      this.#ownerId = props.ownerId;
    } else {
      this.#id = ulid();
      this.#title = this.titleSchema.parse(props.title);
      this.#progressStatus = ProgressStatus.NOT_STARTED;
      this.#ownerId = props.ownerId;

      // イベント発行
      DomainEvents.publish(
        new TaskCreatedEvent(
          this.#id,
          this.#title,
          this.#ownerId,
          this.#progressStatus,
        ),
      );
    }
  }

  public get id() {
    return this.#id;
  }

  public get title() {
    return this.#title;
  }

  public get progressStatus() {
    return this.#progressStatus;
  }

  public get ownerId() {
    return this.#ownerId;
  }

  public edit(title: string) {
    this.#title = this.titleSchema.parse(title);
  }

  /**
   * 進捗ステータスを変更する
   * @param newStatus 新しい進捗ステータス
   * @param requesterId リクエスト者のID
   * @returns 変更結果
   */
  public changeProgressStatus(
    newStatus: ProgressStatus,
    requesterId: string,
  ): Result<void, Error> {
    // 所有者チェック
    if (this.#ownerId !== requesterId) {
      return err(
        new Error("タスクの進捗ステータスを変更できるのは所有者のみです"),
      );
    }

    // 状態遷移チェック
    if (!this.#progressStatus.canTransitionTo(newStatus)) {
      return err(
        new Error(
          `進捗ステータスを${this.#progressStatus.getValue()}から${newStatus.getValue()}に変更することはできません`,
        ),
      );
    }

    // 前の状態を保存
    const previousStatus = this.#progressStatus;

    // 状態を更新
    this.#progressStatus = newStatus;

    // イベント発行
    DomainEvents.publish(
      new TaskProgressChangedEvent(
        this.#id,
        this.#ownerId,
        previousStatus,
        newStatus,
      ),
    );

    return ok(undefined);
  }
}
