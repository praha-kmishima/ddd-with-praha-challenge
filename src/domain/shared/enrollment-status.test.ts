import { describe, expect, test } from "vitest";
import { EnrollmentStatus } from "./enrollment-status";

describe("EnrollmentStatus", () => {
  describe("有効な在籍状態の場合", () => {
    test("「在籍中」で成功する", () => {
      const result = EnrollmentStatus.create("在籍中");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe("在籍中");
        expect(result.value).toBe(EnrollmentStatus.ACTIVE);
      }
    });

    test("「休会中」で成功する", () => {
      const result = EnrollmentStatus.create("休会中");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe("休会中");
        expect(result.value).toBe(EnrollmentStatus.INACTIVE);
      }
    });

    test("「退会済」で成功する", () => {
      const result = EnrollmentStatus.create("退会済");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe("退会済");
        expect(result.value).toBe(EnrollmentStatus.WITHDRAWN);
      }
    });
  });

  describe("無効な在籍状態の場合", () => {
    test("エラーが発生する", () => {
      const result = EnrollmentStatus.create("無効な値");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe(
          "無効な在籍状態です。「在籍中」「休会中」「退会済」のいずれかを指定してください。",
        );
      }
    });
  });

  describe("等価性の確認", () => {
    test("同じ値のEnrollmentStatusは等価", () => {
      const status1 = EnrollmentStatus.ACTIVE;
      const status2 = EnrollmentStatus.ACTIVE;
      expect(status1.equals(status2)).toBe(true);
    });

    test("異なる値のEnrollmentStatusは非等価", () => {
      const status1 = EnrollmentStatus.ACTIVE;
      const status2 = EnrollmentStatus.INACTIVE;
      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe("状態遷移の確認", () => {
    test("在籍中から休会中への遷移は可能", () => {
      expect(
        EnrollmentStatus.ACTIVE.canTransitionTo(EnrollmentStatus.INACTIVE),
      ).toBe(true);
    });

    test("在籍中から退会済への遷移は可能", () => {
      expect(
        EnrollmentStatus.ACTIVE.canTransitionTo(EnrollmentStatus.WITHDRAWN),
      ).toBe(true);
    });

    test("休会中から在籍中への遷移は可能", () => {
      expect(
        EnrollmentStatus.INACTIVE.canTransitionTo(EnrollmentStatus.ACTIVE),
      ).toBe(true);
    });

    test("休会中から退会済への遷移は可能", () => {
      expect(
        EnrollmentStatus.INACTIVE.canTransitionTo(EnrollmentStatus.WITHDRAWN),
      ).toBe(true);
    });

    test("退会済から在籍中への遷移は可能", () => {
      expect(
        EnrollmentStatus.WITHDRAWN.canTransitionTo(EnrollmentStatus.ACTIVE),
      ).toBe(true);
    });

    test("退会済から休会中への遷移は不可能", () => {
      expect(
        EnrollmentStatus.WITHDRAWN.canTransitionTo(EnrollmentStatus.INACTIVE),
      ).toBe(false);
    });

    test("同じ状態への遷移は常に可能", () => {
      expect(
        EnrollmentStatus.ACTIVE.canTransitionTo(EnrollmentStatus.ACTIVE),
      ).toBe(true);
      expect(
        EnrollmentStatus.INACTIVE.canTransitionTo(EnrollmentStatus.INACTIVE),
      ).toBe(true);
      expect(
        EnrollmentStatus.WITHDRAWN.canTransitionTo(EnrollmentStatus.WITHDRAWN),
      ).toBe(true);
    });
  });

  describe("チーム所属可能性の確認", () => {
    test("在籍中はチームに所属可能", () => {
      expect(EnrollmentStatus.ACTIVE.canJoinTeam()).toBe(true);
    });

    test("休会中はチームに所属不可", () => {
      expect(EnrollmentStatus.INACTIVE.canJoinTeam()).toBe(false);
    });

    test("退会済はチームに所属不可", () => {
      expect(EnrollmentStatus.WITHDRAWN.canJoinTeam()).toBe(false);
    });
  });
});
