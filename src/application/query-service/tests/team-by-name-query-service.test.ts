import { beforeEach, describe, expect, test, vi } from "vitest";
import type { TeamByNameQueryServiceInterface } from "../team-by-name-query-service";

/**
 * TeamByNameQueryServiceのモック実装
 */
class MockTeamByNameQueryService implements TeamByNameQueryServiceInterface {
  private teamsByName = new Map<
    string,
    {
      id: string;
      name: string;
      members: {
        id: string;
        name: string;
        email: string;
        status: string;
      }[];
    }
  >();

  constructor() {
    // テスト用のデータを初期化
    this.teamsByName.set("alpha", {
      id: "team-1",
      name: "alpha",
      members: [
        {
          id: "member-1",
          name: "山田太郎",
          email: "yamada@example.com",
          status: "在籍中",
        },
      ],
    });
  }

  public async invoke(input: { name: string }) {
    return this.teamsByName.get(input.name);
  }
}

describe("TeamByNameQueryService", () => {
  let teamByNameQueryService: TeamByNameQueryServiceInterface;

  beforeEach(() => {
    teamByNameQueryService = new MockTeamByNameQueryService();
  });

  test("存在するチーム名を指定した場合、チーム情報が取得できる", async () => {
    // 実行
    const result = await teamByNameQueryService.invoke({ name: "alpha" });

    // 検証
    expect(result).toBeDefined();
    if (result) {
      expect(result.id).toBe("team-1");
      expect(result.name).toBe("alpha");
      expect(result.members).toHaveLength(1);

      const member = result.members[0];
      expect(member).toBeDefined();
      if (member) {
        expect(member.name).toBe("山田太郎");
      }
    }
  });

  test("存在しないチーム名を指定した場合、undefinedが返される", async () => {
    // 実行
    const result = await teamByNameQueryService.invoke({ name: "nonexistent" });

    // 検証
    expect(result).toBeUndefined();
  });
});
