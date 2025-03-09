import { describe, expect, test } from "vitest";
import { z } from "zod";
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
        expect(member.getStatus().equals(EnrollmentStatus.ACTIVE)).toBe(true);

        // IDがULIDフォーマットであることを確認
        const isUlid = z.string().ulid().safeParse(member.getId());
        expect(isUlid.success).toBe(true);
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

    test("無効なメールアドレスの場合はエラーになる", () => {
      const result = TeamMember.create({
        name: "山田太郎",
        email: "invalid-email",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("無効なメールアドレス形式です");
      }
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
        expect(member.getStatus().equals(EnrollmentStatus.ACTIVE)).toBe(true);
      }
    });

    test("無効なメールアドレスの場合はエラーになる", () => {
      const result = TeamMember.reconstruct({
        id: "01ABCDEF",
        name: "山田太郎",
        email: "invalid-email",
        status: "在籍中",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("無効なメールアドレス形式です");
      }
    });

    test("無効な在籍状態の場合はエラーになる", () => {
      const result = TeamMember.reconstruct({
        id: "01ABCDEF",
        name: "山田太郎",
        email: "taro@example.com",
        status: "無効な状態",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("無効な在籍状態です");
      }
    });
  });

  describe("changeStatus", () => {
    test("在籍中から休会中に変更できる", () => {
      const createResult = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const member = createResult.value;
        const changeResult = member.changeStatus(EnrollmentStatus.INACTIVE);

        expect(changeResult.ok).toBe(true);
        expect(member.getStatus().equals(EnrollmentStatus.INACTIVE)).toBe(true);
      }
    });

    test("在籍中から退会済に変更できる", () => {
      const createResult = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const member = createResult.value;
        const changeResult = member.changeStatus(EnrollmentStatus.WITHDRAWN);

        expect(changeResult.ok).toBe(true);
        expect(member.getStatus().equals(EnrollmentStatus.WITHDRAWN)).toBe(
          true,
        );
      }
    });

    test("退会済から在籍中に変更できる", () => {
      const createResult = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const member = createResult.value;

        // まず退会済に変更
        const withdrawResult = member.changeStatus(EnrollmentStatus.WITHDRAWN);
        expect(withdrawResult.ok).toBe(true);

        // 退会済から在籍中に変更
        const reactivateResult = member.changeStatus(EnrollmentStatus.ACTIVE);
        expect(reactivateResult.ok).toBe(true);
        expect(member.getStatus().equals(EnrollmentStatus.ACTIVE)).toBe(true);
      }
    });

    test("退会済から休会中に変更できない", () => {
      const createResult = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const member = createResult.value;

        // まず退会済に変更
        const withdrawResult = member.changeStatus(EnrollmentStatus.WITHDRAWN);
        expect(withdrawResult.ok).toBe(true);

        // 退会済から休会中に変更を試みる
        const changeResult = member.changeStatus(EnrollmentStatus.INACTIVE);
        expect(changeResult.ok).toBe(false);
        if (!changeResult.ok) {
          expect(changeResult.error.message).toContain(
            "在籍状態を退会済から休会中に変更することはできません",
          );
        }
      }
    });
  });

  describe("canJoinTeam", () => {
    test("在籍中のメンバーはチームに所属可能", () => {
      const createResult = TeamMember.create({
        name: "山田太郎",
        email: "taro@example.com",
      });

      expect(createResult.ok).toBe(true);
      if (createResult.ok) {
        const member = createResult.value;
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

        // 休会中に変更
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

        // 退会済に変更
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
        email: "jiro@example.com", // メールが異なる
        status: "休会中", // 状態が異なる
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
        email: "taro@example.com", // メールが同じ
        status: "在籍中", // 状態が同じ
      });

      expect(result1.ok && result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });
  });
});
