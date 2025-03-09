import { describe, expect, test } from "vitest";
import { ProgressStatus } from "./progress-status";

describe("ProgressStatus", () => {
  describe("有効な進捗状態の場合", () => {
    test("「未着手」で成功する", () => {
      const result = ProgressStatus.create("未着手");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe("未着手");
        expect(result.value).toBe(ProgressStatus.NOT_STARTED);
      }
    });

    test("「取組中」で成功する", () => {
      const result = ProgressStatus.create("取組中");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe("取組中");
        expect(result.value).toBe(ProgressStatus.IN_PROGRESS);
      }
    });

    test("「レビュー待ち」で成功する", () => {
      const result = ProgressStatus.create("レビュー待ち");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe("レビュー待ち");
        expect(result.value).toBe(ProgressStatus.WAITING_FOR_REVIEW);
      }
    });

    test("「完了」で成功する", () => {
      const result = ProgressStatus.create("完了");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe("完了");
        expect(result.value).toBe(ProgressStatus.COMPLETED);
      }
    });
  });

  describe("無効な進捗状態の場合", () => {
    test("エラーが発生する", () => {
      const result = ProgressStatus.create("無効な値");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe(
          "無効な進捗状態です。「未着手」「取組中」「レビュー待ち」「完了」のいずれかを指定してください。",
        );
      }
    });
  });

  describe("等価性の確認", () => {
    test("同じ値のProgressStatusは等価", () => {
      const status1 = ProgressStatus.NOT_STARTED;
      const status2 = ProgressStatus.NOT_STARTED;
      expect(status1.equals(status2)).toBe(true);
    });

    test("異なる値のProgressStatusは非等価", () => {
      const status1 = ProgressStatus.NOT_STARTED;
      const status2 = ProgressStatus.IN_PROGRESS;
      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe("状態遷移の確認", () => {
    test("未着手から取組中への遷移は可能", () => {
      expect(
        ProgressStatus.NOT_STARTED.canTransitionTo(ProgressStatus.IN_PROGRESS),
      ).toBe(true);
    });

    test("未着手からレビュー待ちへの遷移は不可能", () => {
      expect(
        ProgressStatus.NOT_STARTED.canTransitionTo(
          ProgressStatus.WAITING_FOR_REVIEW,
        ),
      ).toBe(false);
    });

    test("未着手から完了への遷移は不可能", () => {
      expect(
        ProgressStatus.NOT_STARTED.canTransitionTo(ProgressStatus.COMPLETED),
      ).toBe(false);
    });

    test("取組中からレビュー待ちへの遷移は可能", () => {
      expect(
        ProgressStatus.IN_PROGRESS.canTransitionTo(
          ProgressStatus.WAITING_FOR_REVIEW,
        ),
      ).toBe(true);
    });

    test("取組中から未着手への遷移は不可能", () => {
      expect(
        ProgressStatus.IN_PROGRESS.canTransitionTo(ProgressStatus.NOT_STARTED),
      ).toBe(false);
    });

    test("取組中から完了への遷移は不可能", () => {
      expect(
        ProgressStatus.IN_PROGRESS.canTransitionTo(ProgressStatus.COMPLETED),
      ).toBe(false);
    });

    test("レビュー待ちから取組中への遷移は可能", () => {
      expect(
        ProgressStatus.WAITING_FOR_REVIEW.canTransitionTo(
          ProgressStatus.IN_PROGRESS,
        ),
      ).toBe(true);
    });

    test("レビュー待ちから完了への遷移は可能", () => {
      expect(
        ProgressStatus.WAITING_FOR_REVIEW.canTransitionTo(
          ProgressStatus.COMPLETED,
        ),
      ).toBe(true);
    });

    test("レビュー待ちから未着手への遷移は不可能", () => {
      expect(
        ProgressStatus.WAITING_FOR_REVIEW.canTransitionTo(
          ProgressStatus.NOT_STARTED,
        ),
      ).toBe(false);
    });

    test("完了からどの状態への遷移も不可能", () => {
      expect(
        ProgressStatus.COMPLETED.canTransitionTo(ProgressStatus.NOT_STARTED),
      ).toBe(false);
      expect(
        ProgressStatus.COMPLETED.canTransitionTo(ProgressStatus.IN_PROGRESS),
      ).toBe(false);
      expect(
        ProgressStatus.COMPLETED.canTransitionTo(
          ProgressStatus.WAITING_FOR_REVIEW,
        ),
      ).toBe(false);
    });

    test("同じ状態への遷移は常に可能", () => {
      expect(
        ProgressStatus.NOT_STARTED.canTransitionTo(ProgressStatus.NOT_STARTED),
      ).toBe(true);
      expect(
        ProgressStatus.IN_PROGRESS.canTransitionTo(ProgressStatus.IN_PROGRESS),
      ).toBe(true);
      expect(
        ProgressStatus.WAITING_FOR_REVIEW.canTransitionTo(
          ProgressStatus.WAITING_FOR_REVIEW,
        ),
      ).toBe(true);
      expect(
        ProgressStatus.COMPLETED.canTransitionTo(ProgressStatus.COMPLETED),
      ).toBe(true);
    });
  });
});
