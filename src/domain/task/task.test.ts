import { describe, expect, test } from "vitest";
import { z } from "zod";
import { ulid } from "../../libs/ulid";
import { ProgressStatus } from "../shared/progress-status";
import { Task } from "./task";

describe("task", () => {
  describe("タイトルと所有者IDでタスクを作成", () => {
    const title = "牛乳を買う";
    const ownerId = ulid();
    const task = new Task({ title, ownerId });

    test("idがulidで生成される", () => {
      const generated = task.id;
      const isUlid = z.string().ulid().safeParse(generated);

      expect(isUlid.success).toBe(true);
    });

    test("タイトルが設定される", () => {
      expect(task.title).toBe(title);
    });

    test("所有者IDが設定される", () => {
      expect(task.ownerId).toBe(ownerId);
    });

    test("進捗ステータスは「未着手」", () => {
      expect(task.progressStatus.equals(ProgressStatus.NOT_STARTED)).toBe(true);
    });
  });

  describe("すべてのプロパティを指定してタスクを作成", () => {
    const id = ulid();
    const title = "卵を買う";
    const ownerId = ulid();
    const progressStatus = ProgressStatus.IN_PROGRESS;
    const task = new Task({ id, title, progressStatus, ownerId });

    test("指定したプロパティが設定される", () => {
      expect(task.id).toBe(id);
      expect(task.title).toBe(title);
      expect(task.ownerId).toBe(ownerId);
      expect(task.progressStatus.equals(progressStatus)).toBe(true);
    });
  });

  describe("タイトルが空文字の場合", () => {
    const title = "";
    const ownerId = ulid();

    test("エラーが発生する", () => {
      expect(() => new Task({ title, ownerId })).toThrow(
        "title must not be empty",
      );
    });
  });

  describe("タイトルが100文字を超える場合", () => {
    const title = "a".repeat(101);
    const ownerId = ulid();

    test("エラーが発生する", () => {
      expect(() => new Task({ title, ownerId })).toThrow(
        "title must be less than 100 characters",
      );
    });
  });

  describe("タイトルを編集する", () => {
    const before = "ご飯を炊く";
    const after = "パスタを茹でる";
    const ownerId = ulid();
    const task = new Task({ title: before, ownerId });
    task.edit(after);

    test("タイトルが更新される", () => {
      expect(task.title).toBe(after);
    });
  });

  describe("タイトルを空文字に編集する", () => {
    const before = "掃除機をかける";
    const after = "";
    const ownerId = ulid();
    const task = new Task({ title: before, ownerId });

    test("エラーが発生する", () => {
      expect(() => task.edit(after)).toThrow("title must not be empty");
    });
  });

  describe("タイトルを100文字を超える文字列に編集する", () => {
    const before = "ご飯を炊く";
    const after = "a".repeat(101);
    const ownerId = ulid();
    const task = new Task({ title: before, ownerId });

    test("エラーが発生する", () => {
      expect(() => task.edit(after)).toThrow(
        "title must be less than 100 characters",
      );
    });
  });

  describe("進捗ステータスを変更する", () => {
    describe("所有者が「未着手」から「取組中」に変更する場合", () => {
      const ownerId = ulid();
      const task = new Task({ title: "洗濯機を回す", ownerId });
      const result = task.changeProgressStatus(
        ProgressStatus.IN_PROGRESS,
        ownerId,
      );

      test("変更が成功する", () => {
        expect(result.ok).toBe(true);
      });

      test("進捗ステータスが「取組中」になる", () => {
        expect(task.progressStatus.equals(ProgressStatus.IN_PROGRESS)).toBe(
          true,
        );
      });
    });

    describe("所有者が「未着手」から「レビュー待ち」に変更する場合（不正な遷移）", () => {
      const ownerId = ulid();
      const task = new Task({ title: "洗濯機を回す", ownerId });
      const result = task.changeProgressStatus(
        ProgressStatus.WAITING_FOR_REVIEW,
        ownerId,
      );

      test("変更が失敗する", () => {
        expect(result.ok).toBe(false);
      });

      test("エラーメッセージが返される", () => {
        if (!result.ok) {
          expect(result.error.message).toContain(
            "進捗ステータスを未着手からレビュー待ちに変更することはできません",
          );
        }
      });

      test("進捗ステータスは変更されない", () => {
        expect(task.progressStatus.equals(ProgressStatus.NOT_STARTED)).toBe(
          true,
        );
      });
    });

    describe("所有者以外が進捗ステータスを変更する場合", () => {
      const ownerId = ulid();
      const otherUserId = ulid();
      const task = new Task({ title: "洗濯機を回す", ownerId });
      const result = task.changeProgressStatus(
        ProgressStatus.IN_PROGRESS,
        otherUserId,
      );

      test("変更が失敗する", () => {
        expect(result.ok).toBe(false);
      });

      test("エラーメッセージが返される", () => {
        if (!result.ok) {
          expect(result.error.message).toBe(
            "タスクの進捗ステータスを変更できるのは所有者のみです",
          );
        }
      });

      test("進捗ステータスは変更されない", () => {
        expect(task.progressStatus.equals(ProgressStatus.NOT_STARTED)).toBe(
          true,
        );
      });
    });

    describe("複数回の状態遷移", () => {
      const ownerId = ulid();
      const task = new Task({ title: "洗濯機を回す", ownerId });

      test("未着手→取組中→レビュー待ち→完了の遷移が成功する", () => {
        // 未着手→取組中
        const result1 = task.changeProgressStatus(
          ProgressStatus.IN_PROGRESS,
          ownerId,
        );
        expect(result1.ok).toBe(true);
        expect(task.progressStatus.equals(ProgressStatus.IN_PROGRESS)).toBe(
          true,
        );

        // 取組中→レビュー待ち
        const result2 = task.changeProgressStatus(
          ProgressStatus.WAITING_FOR_REVIEW,
          ownerId,
        );
        expect(result2.ok).toBe(true);
        expect(
          task.progressStatus.equals(ProgressStatus.WAITING_FOR_REVIEW),
        ).toBe(true);

        // レビュー待ち→完了
        const result3 = task.changeProgressStatus(
          ProgressStatus.COMPLETED,
          ownerId,
        );
        expect(result3.ok).toBe(true);
        expect(task.progressStatus.equals(ProgressStatus.COMPLETED)).toBe(true);
      });

      test("完了状態からの変更は失敗する", () => {
        // 事前準備：完了状態にする
        task.changeProgressStatus(ProgressStatus.IN_PROGRESS, ownerId);
        task.changeProgressStatus(ProgressStatus.WAITING_FOR_REVIEW, ownerId);
        task.changeProgressStatus(ProgressStatus.COMPLETED, ownerId);

        // 完了→取組中（失敗するはず）
        const result = task.changeProgressStatus(
          ProgressStatus.IN_PROGRESS,
          ownerId,
        );
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain(
            "進捗ステータスを完了から取組中に変更することはできません",
          );
        }
        expect(task.progressStatus.equals(ProgressStatus.COMPLETED)).toBe(true);
      });
    });
  });
});
