import { beforeEach, describe, expect, test } from "vitest";
import type { TeamQueryServiceInterface } from "../team-query-service";

/**
 * TeamQueryServiceのモック実装
 */
class MockTeamQueryService implements TeamQueryServiceInterface {
  private teams = new Map<
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
    this.teams.set("team-1", {
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

  public async invoke(input: { id: string }) {
    return this.teams.get(input.id);
  }
}

describe("TeamQueryService", () => {
  let teamQueryService: TeamQueryServiceInterface;

  beforeEach(() => {
    teamQueryService = new MockTeamQueryService();
  });

  test("存在するチームIDを指定した場合、チーム情報が取得できる", async () => {
    // 実行
    const result = await teamQueryService.invoke({ id: "team-1" });

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

  test("存在しないチームIDを指定した場合、undefinedが返される", async () => {
    // 実行
    const result = await teamQueryService.invoke({ id: "non-existent-id" });

    // 検証
    expect(result).toBeUndefined();
  });
});
