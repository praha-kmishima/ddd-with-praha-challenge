import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskCreatedEvent, TaskProgressChangedEvent } from "..";
import { DomainEvents } from "../../../event";
import { ProgressStatus } from "../../../shared/progress-status";
import { Task } from "../../task";

describe("Task Events", () => {
  beforeEach(() => {
    // テスト前にイベントハンドラをクリア
    DomainEvents.clearHandlers();
  });

  describe("TaskCreatedEvent", () => {
    it("課題作成時にTaskCreatedEventが発行されること", () => {
      // モックハンドラを設定
      const handler = vi.fn();
      DomainEvents.subscribe("TaskCreatedEvent", handler);

      // 課題を作成
      const task = new Task({
        title: "テスト課題",
        ownerId: "owner-1",
      });

      // イベントハンドラが呼び出されたことを確認
      expect(handler).toHaveBeenCalledTimes(1);

      // 発行されたイベントを検証
      const event = handler.mock.calls[0][0];
      expect(event).toBeInstanceOf(TaskCreatedEvent);
      expect(event.taskId).toBe(task.id);
      expect(event.title).toBe("テスト課題");
      expect(event.ownerId).toBe("owner-1");
      expect(event.progressStatus).toBe(ProgressStatus.NOT_STARTED);
    });
  });

  describe("TaskProgressChangedEvent", () => {
    it("進捗ステータス変更時にTaskProgressChangedEventが発行されること", () => {
      // 課題を作成
      const task = new Task({
        title: "テスト課題",
        ownerId: "owner-1",
      });

      // モックハンドラを設定
      const handler = vi.fn();
      DomainEvents.subscribe("TaskProgressChangedEvent", handler);

      // 進捗ステータスを変更
      const result = task.changeProgressStatus(
        ProgressStatus.IN_PROGRESS,
        "owner-1",
      );
      expect(result.ok).toBe(true);

      // イベントハンドラが呼び出されたことを確認
      expect(handler).toHaveBeenCalledTimes(1);

      // 発行されたイベントを検証
      const event = handler.mock.calls[0][0];
      expect(event).toBeInstanceOf(TaskProgressChangedEvent);
      expect(event.taskId).toBe(task.id);
      expect(event.ownerId).toBe("owner-1");
      expect(event.previousStatus).toBe(ProgressStatus.NOT_STARTED);
      expect(event.newStatus).toBe(ProgressStatus.IN_PROGRESS);
    });

    it("進捗ステータス変更が失敗した場合、イベントは発行されないこと", () => {
      // 課題を作成
      const task = new Task({
        title: "テスト課題",
        ownerId: "owner-1",
      });

      // モックハンドラを設定
      const handler = vi.fn();
      DomainEvents.subscribe("TaskProgressChangedEvent", handler);

      // 無効な進捗ステータス変更を試みる（未着手→完了は直接遷移できない）
      const result = task.changeProgressStatus(
        ProgressStatus.COMPLETED,
        "owner-1",
      );
      expect(result.ok).toBe(false);

      // イベントハンドラが呼び出されていないことを確認
      expect(handler).not.toHaveBeenCalled();
    });

    it("所有者でない場合、進捗ステータス変更が失敗してイベントは発行されないこと", () => {
      // 課題を作成
      const task = new Task({
        title: "テスト課題",
        ownerId: "owner-1",
      });

      // モックハンドラを設定
      const handler = vi.fn();
      DomainEvents.subscribe("TaskProgressChangedEvent", handler);

      // 所有者でないユーザーが進捗ステータス変更を試みる
      const result = task.changeProgressStatus(
        ProgressStatus.IN_PROGRESS,
        "other-user",
      );
      expect(result.ok).toBe(false);

      // イベントハンドラが呼び出されていないことを確認
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
