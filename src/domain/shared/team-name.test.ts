import { describe, expect, test } from "vitest";
import { TeamName } from "./team-name";

describe("TeamName", () => {
  describe("有効なチーム名の場合", () => {
    test("英文字のみのチーム名で成功する", () => {
      const validName = "TeamA";
      const result = TeamName.create(validName);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(validName);
      }
    });
  });

  describe("無効なチーム名の場合", () => {
    test("空文字の場合はエラーが発生する", () => {
      const result = TeamName.create("");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("チーム名は空にできません");
      }
    });

    test("英文字以外を含む場合はエラーが発生する", () => {
      const result = TeamName.create("Team1");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("チーム名は英文字のみ使用できます");
      }
    });

    test("日本語を含む場合はエラーが発生する", () => {
      const result = TeamName.create("チームA");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("チーム名は英文字のみ使用できます");
      }
    });
  });

  describe("等価性の確認", () => {
    test("同じ値のTeamNameは等価", () => {
      const name1Result = TeamName.create("TeamA");
      const name2Result = TeamName.create("TeamA");
      expect(name1Result.ok && name2Result.ok).toBe(true);
      if (name1Result.ok && name2Result.ok) {
        expect(name1Result.value.equals(name2Result.value)).toBe(true);
      }
    });

    test("異なる値のTeamNameは非等価", () => {
      const name1Result = TeamName.create("TeamA");
      const name2Result = TeamName.create("TeamB");
      expect(name1Result.ok && name2Result.ok).toBe(true);
      if (name1Result.ok && name2Result.ok) {
        expect(name1Result.value.equals(name2Result.value)).toBe(false);
      }
    });
  });
});
