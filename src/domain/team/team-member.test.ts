import { describe, expect, test } from "vitest";
import { EnrollmentStatus } from "../shared/enrollment-status";
import { TeamMember } from "./team-member";

describe("TeamMember", () => {
  describe("create", () => {
    test("有効な名前とメールアドレスでチームメンバーを作成できる", () => {
      const result = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const member = result.value;
        expect(member.getName()).toBe("山田太郎");
        expect(member.getEmail().getValue()).toBe("taro@example.com");
        expect(member.getStatus()).toBe(EnrollmentStatus.ACTIVE);
      }
    });

    test("名前が空の場合はエラーになる", () => {
      const result = TeamMember.create({
        name: "",
        email: "taro@example.com",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("名前は必須です");
      }
    });

    test("メールアドレスが不正な場合はエラーになる", () => {
      const result = TeamMember.create({
        name: "山田太郎",
        email: "invalid-email",
      });

      expect(result.ok).toBe(false);
    });
  });

  describe("reconstruct", () => {
    test("有効なデータからチームメンバーを復元できる", () => {
      const result = TeamMember.reconstruct({
        id: "01ABCDEF",
        name: "山田太郎",
        email: "taro@example.com",
        status: "在籍中",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const member = result.value;
        expect(member.getId()).toBe("01ABCDEF");
        expect(member.getName()).toBe("山田太郎");
        expect(member.getEmail().getValue()).toBe("taro@example.com");
        expect(member.getStatus()).toBe(EnrollmentStatus.ACTIVE);
      }
    });

    test("メールアドレスが不正な場合はエラーになる", () => {
      const result = TeamMember.reconstruct({
        id: "01ABCDEF",
        name: "山田太郎",
        email: "invalid-email",
        status: "在籍中",
      });

      expect(result.ok).toBe(false);
    });

    test("在籍状態が不正な場合はエラーになる", () => {
      const result = TeamMember.reconstruct({
        id: "01ABCDEF",
        name: "山田太郎",
        email: "taro@example.com",
        status: "不正な状態",
      });

      expect(result.ok).toBe(false);
    });
  });

  describe("changeStatus", () => {
    test("在籍状態を変更できる", () => {
      const createResult = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const member = createResult.value;
        const changeResult = member.changeStatus(EnrollmentStatus.INACTIVE);
        expect(changeResult.ok).toBe(true);
        expect(member.getStatus()).toBe(EnrollmentStatus.INACTIVE);
      }
    });

    test("無効な状態遷移はエラーになる", () => {
      const createResult = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const member = createResult.value;

        // 在籍中から休会中に変更
        const changeResult1 = member.changeStatus(EnrollmentStatus.INACTIVE);
        expect(changeResult1.ok).toBe(true);
        expect(member.getStatus()).toBe(EnrollmentStatus.INACTIVE);

        // 休会中から退会済に変更
        const changeResult2 = member.changeStatus(EnrollmentStatus.WITHDRAWN);
        expect(changeResult2.ok).toBe(true);
        expect(member.getStatus()).toBe(EnrollmentStatus.WITHDRAWN);

        // 退会済から休会中に変更（無効な遷移）
        const changeResult3 = member.changeStatus(EnrollmentStatus.INACTIVE);
        expect(changeResult3.ok).toBe(false);
        if (!changeResult3.ok) {
          expect(changeResult3.error.message).toContain(
            "変更することはできません",
          );
        }

        // 状態は変わらない
        expect(member.getStatus()).toBe(EnrollmentStatus.WITHDRAWN);
      }
    });
  });

  describe("canJoinTeam", () => {
    test("在籍中のメンバーはチームに所属可能", () => {
      const result = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });
      expect(result.ok).toBe(true);

      if (result.ok) {
        const member = result.value;
        expect(member.canJoinTeam()).toBe(true);
      }
    });

    test("休会中のメンバーはチームに所属不可", () => {
      const createResult = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const member = createResult.value;
        const changeResult = member.changeStatus(EnrollmentStatus.INACTIVE);
        expect(changeResult.ok).toBe(true);
        expect(member.canJoinTeam()).toBe(false);
      }
    });

    test("退会済のメンバーはチームに所属不可", () => {
      const createResult = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const member = createResult.value;
        const changeResult = member.changeStatus(EnrollmentStatus.WITHDRAWN);
        expect(changeResult.ok).toBe(true);
        expect(member.canJoinTeam()).toBe(false);
      }
    });
  });

  describe("equals", () => {
    test("同じIDを持つメンバーは等価", () => {
      const id = "01ABCDEF";

      const result1 = TeamMember.reconstruct({
        id,
        name: "山田太郎",
        email: "taro@example.com",
        status: "在籍中",
      });

      const result2 = TeamMember.reconstruct({
        id,
        name: "山田次郎", // 名前が異なる
        email: "jiro@example.com", // メールアドレスが異なる
        status: "在籍中",
      });

      expect(result1.ok && result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    test("異なるIDを持つメンバーは等価でない", () => {
      const result1 = TeamMember.reconstruct({
        id: "01ABCDEF",
        name: "山田太郎",
        email: "taro@example.com",
        status: "在籍中",
      });

      const result2 = TeamMember.reconstruct({
        id: "01GHIJKL",
        name: "山田太郎", // 名前が同じ
        email: "taro@example.com", // メールアドレスが同じ
        status: "在籍中",
      });

      expect(result1.ok && result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });
  });
});
