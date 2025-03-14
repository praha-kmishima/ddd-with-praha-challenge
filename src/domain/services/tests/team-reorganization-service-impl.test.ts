import { beforeEach, describe, expect, test, vi } from "vitest";
import { type Result, ok } from "../../shared/result";
import { TeamName } from "../../shared/team-name";
import type { TeamRepository } from "../../team";
import { Team } from "../../team/team";
import { TeamMember } from "../../team/team-member";
import { TeamReorganizationServiceImpl } from "../team-reorganization-service-impl";

// モックリポジトリの実装
class MockTeamRepository {
  private teams = new Map<string, Team>();

  // 状態のリセット
  reset(): void {
    this.teams.clear();
  }

  // インターフェースの実装
  async save(team: Team): Promise<Result<void, Error>> {
    this.teams.set(team.getId(), team);
    return ok(undefined);
  }

  async findById(id: string): Promise<Result<Team | null, Error>> {
    return ok(this.teams.get(id) || null);
  }

  async findByName(name: TeamName): Promise<Result<Team | null, Error>> {
    for (const team of this.teams.values()) {
      if (team.getName().equals(name)) {
        return ok(team);
      }
    }
    return ok(null);
  }

  async findAll(): Promise<Result<Team[], Error>> {
    return ok(Array.from(this.teams.values()));
  }

  async findByMemberId(memberId: string): Promise<Result<Team | null, Error>> {
    for (const team of this.teams.values()) {
      const members = team.getMembers();
      if (members.some((member) => member.getId() === memberId)) {
        return ok(team);
      }
    }
    return ok(null);
  }

  async exists(name: TeamName): Promise<Result<boolean, Error>> {
    for (const team of this.teams.values()) {
      if (team.getName().equals(name)) {
        return ok(true);
      }
    }
    return ok(false);
  }

  async findSmallestTeam(): Promise<Result<Team | null, Error>> {
    if (this.teams.size === 0) {
      return ok(null);
    }

    let smallestTeam: Team | null = null;
    let smallestSize = Number.MAX_SAFE_INTEGER;

    for (const team of this.teams.values()) {
      const size = team.getMembers().length;
      if (size < smallestSize) {
        smallestTeam = team;
        smallestSize = size;
      }
    }

    return ok(smallestTeam);
  }
}

// テストヘルパー関数
function createTeamMember(name: string, email: string): TeamMember {
  const result = TeamMember.create({ name, email });
  if (!result.ok) {
    throw new Error(`Failed to create team member: ${result.error.message}`);
  }
  return result.value;
}

function createTeam(name: string, members: TeamMember[] = []): Team {
  const teamNameResult = TeamName.create(name);
  if (!teamNameResult.ok) {
    throw new Error(
      `Failed to create team name: ${teamNameResult.error.message}`,
    );
  }

  const teamResult = Team.create({ name: teamNameResult.value });
  if (!teamResult.ok) {
    throw new Error(`Failed to create team: ${teamResult.error.message}`);
  }

  const team = teamResult.value;
  for (const member of members) {
    const addResult = team.addMember(member);
    if (!addResult.ok) {
      throw new Error(
        `Failed to add member to team: ${addResult.error.message}`,
      );
    }
  }

  return team;
}

describe("TeamReorganizationServiceImpl", () => {
  // テスト用のモックリポジトリとサービスを準備
  const mockRepository = new MockTeamRepository();
  const service = new TeamReorganizationServiceImpl(
    mockRepository as unknown as TeamRepository, // TypeScriptの型エラーを回避するためにanyを使用
  );

  // 各テスト前にリポジトリをリセット
  beforeEach(() => {
    mockRepository.reset();
    vi.clearAllMocks();
  });

  describe("mergeTeams", () => {
    test("1名のチームを3名のチームに統合できること", async () => {
      // 準備
      const member1 = createTeamMember("メンバー1", "member1@example.com");
      const member2 = createTeamMember("メンバー2", "member2@example.com");
      const member3 = createTeamMember("メンバー3", "member3@example.com");
      const member4 = createTeamMember("メンバー4", "member4@example.com");

      const sourceTeam = createTeam("SourceTeam", [member1]);
      const targetTeam = createTeam("TargetTeam", [member2, member3, member4]);

      // リポジトリのsaveメソッドをスパイ
      const saveSpy = vi.spyOn(mockRepository, "save");

      // 実行
      const result = await service.mergeTeams(sourceTeam, targetTeam);

      // 検証
      expect(result.ok).toBe(true);
      expect(targetTeam.getMembers().length).toBe(4);
      expect(sourceTeam.getMembers().length).toBe(0);
      expect(saveSpy).toHaveBeenCalledTimes(2);
    });

    test("統合後のチームサイズが4名を超える場合はエラーを返すこと", async () => {
      // 準備
      const member1 = createTeamMember("メンバー1", "member1@example.com");
      const member2 = createTeamMember("メンバー2", "member2@example.com");
      const member3 = createTeamMember("メンバー3", "member3@example.com");
      const member4 = createTeamMember("メンバー4", "member4@example.com");
      const member5 = createTeamMember("メンバー5", "member5@example.com");

      const sourceTeam = createTeam("SourceTeam", [member1, member2]);
      const targetTeam = createTeam("TargetTeam", [member3, member4, member5]);

      // 実行
      const result = await service.mergeTeams(sourceTeam, targetTeam);

      // 検証
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain(
          "統合後のチームサイズが制限を超えます",
        );
      }
    });

    test("同一チームを統合しようとした場合はエラーを返すこと", async () => {
      // 準備
      const member1 = createTeamMember("メンバー1", "member1@example.com");
      const team = createTeam("Team", [member1]);

      // 実行
      const result = await service.mergeTeams(team, team);

      // 検証
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("統合元と統合先のチームが同一です");
      }
    });

    test("統合元のチームにメンバーがいない場合はエラーを返すこと", async () => {
      // 準備
      const member1 = createTeamMember("メンバー1", "member1@example.com");
      const sourceTeam = createTeam("SourceTeam");
      const targetTeam = createTeam("TargetTeam", [member1]);

      // 実行
      const result = await service.mergeTeams(sourceTeam, targetTeam);

      // 検証
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("統合元のチームにメンバーがいません");
      }
    });
  });

  describe("splitTeam", () => {
    test("4人チームを分割できること", async () => {
      // 準備: 4人チームを作成
      const member1 = createTeamMember("Member1", "member1@example.com");
      const member2 = createTeamMember("Member2", "member2@example.com");
      const member3 = createTeamMember("Member3", "member3@example.com");
      const member4 = createTeamMember("Member4", "member4@example.com");

      const team = createTeam("TeamFour", [member1, member2, member3, member4]);

      // TeamName.createをモック
      const originalTeamNameCreate = TeamName.create;
      TeamName.create = vi
        .fn()
        .mockReturnValue(ok({ getValue: () => "TeamFourTwo" } as TeamName));

      // リポジトリのsaveメソッドをモック
      mockRepository.save = vi.fn().mockResolvedValue(ok(undefined));

      try {
        // 実行
        const result = await service.splitTeam(team);

        // 検証
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.length).toBe(2);

          const splitTeam1 = result.value[0];
          const splitTeam2 = result.value[1];

          // 両方のチームが存在することを確認
          expect(splitTeam1).toBeDefined();
          expect(splitTeam2).toBeDefined();

          if (splitTeam1 && splitTeam2) {
            expect(splitTeam1.getMembers().length).toBe(2);
            expect(splitTeam2.getMembers().length).toBe(2);
          }
        }

        // saveメソッドが2回呼ばれたことを確認（元のチームと新しいチーム）
        expect(mockRepository.save).toHaveBeenCalledTimes(2);
      } finally {
        // モックを元に戻す
        TeamName.create = originalTeamNameCreate;
      }
    });

    test("4人未満のチームを分割しようとした場合はエラーを返すこと", async () => {
      // 準備: 3人チーム
      const smallTeam = createTeam("SmallTeam", [
        createTeamMember("Member1", "member1@example.com"),
        createTeamMember("Member2", "member2@example.com"),
        createTeamMember("Member3", "member3@example.com"),
      ]);

      // 実行: 3人チーム
      const smallTeamResult = await service.splitTeam(smallTeam);

      // 検証: 3人チーム
      expect(smallTeamResult.ok).toBe(false);
      if (!smallTeamResult.ok) {
        expect(smallTeamResult.error.message).toContain(
          "チームサイズが分割条件を満たしていません",
        );
        expect(smallTeamResult.error.message).toContain(
          "4名である必要があります",
        );
      }
    });
  });
});
