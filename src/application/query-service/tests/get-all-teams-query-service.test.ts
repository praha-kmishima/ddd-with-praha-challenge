import { beforeEach, describe, expect, test } from "vitest";
import type { GetAllTeamsQueryServiceInterface } from "../get-all-teams-query-service";

/**
 * GetAllTeamsQueryServiceのモック実装
 */
class MockGetAllTeamsQueryService implements GetAllTeamsQueryServiceInterface {
  private teams = [
    {
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
    },
    {
      id: "team-2",
      name: "beta",
      members: [
        {
          id: "member-2",
          name: "鈴木花子",
          email: "suzuki@example.com",
          status: "在籍中",
        },
        {
          id: "member-3",
          name: "佐藤次郎",
          email: "sato@example.com",
          status: "在籍中",
        },
      ],
    },
    {
      id: "team-3",
      name: "gamma",
      members: [],
    },
  ];

  public async invoke() {
    return this.teams;
  }
}

describe("GetAllTeamsQueryService", () => {
  let getAllTeamsQueryService: GetAllTeamsQueryServiceInterface;

  beforeEach(() => {
    getAllTeamsQueryService = new MockGetAllTeamsQueryService();
  });

  test("すべてのチーム情報が取得できる", async () => {
    // 実行
    const result = await getAllTeamsQueryService.invoke();

    // 検証
    expect(result).toBeDefined();
    expect(result).toHaveLength(3);

    // チーム1の検証
    expect(result[0]).toBeDefined();
    if (result[0]) {
      expect(result[0].id).toBe("team-1");
      expect(result[0].name).toBe("alpha");
      expect(result[0].members).toHaveLength(1);

      expect(result[0].members[0]).toBeDefined();
      if (result[0].members[0]) {
        expect(result[0].members[0].name).toBe("山田太郎");
      }
    }

    // チーム2の検証
    expect(result[1]).toBeDefined();
    if (result[1]) {
      expect(result[1].id).toBe("team-2");
      expect(result[1].name).toBe("beta");
      expect(result[1].members).toHaveLength(2);
    }

    // チーム3の検証（メンバーがいないチーム）
    expect(result[2]).toBeDefined();
    if (result[2]) {
      expect(result[2].id).toBe("team-3");
      expect(result[2].name).toBe("gamma");
      expect(result[2].members).toHaveLength(0);
    }
  });
});
