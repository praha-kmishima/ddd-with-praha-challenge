import { beforeEach, describe, expect, test } from "vitest";
import { type Result, ok } from "../../domain/shared/result";
import { TeamName } from "../../domain/shared/team-name";
import { Team } from "../../domain/team/team";
import { TeamMember } from "../../domain/team/team-member";
import type { TeamRepository } from "../../domain/team/team-repository";

/**
 * TeamRepositoryインターフェースのモック実装
 * テスト用に最小限の機能を提供する
 */
class MockTeamRepository implements TeamRepository {
  private teams = new Map<string, Team>();
  private teamsByName = new Map<string, Team>();
  private teamsByMemberId = new Map<string, Team>();

  /**
   * リポジトリの状態をリセットする
   */
  reset(): void {
    this.teams.clear();
    this.teamsByName.clear();
    this.teamsByMemberId.clear();
  }

  /**
   * チームを保存する
   */
  async save(team: Team): Promise<Result<void, Error>> {
    this.teams.set(team.getId(), team);
    this.teamsByName.set(team.getName().getValue(), team);

    // 既存のメンバーとチームの関連付けを削除
    for (const [memberId, existingTeam] of this.teamsByMemberId.entries()) {
      if (existingTeam.getId() === team.getId()) {
        this.teamsByMemberId.delete(memberId);
      }
    }

    // 新しいメンバーとチームの関連付けを追加
    for (const member of team.getMembers()) {
      this.teamsByMemberId.set(member.getId(), team);
    }

    return ok(undefined);
  }

  /**
   * IDでチームを取得する
   */
  async findById(id: string): Promise<Result<Team | null, Error>> {
    const team = this.teams.get(id) || null;
    return ok(team);
  }

  /**
   * チーム名でチームを取得する
   */
  async findByName(name: TeamName): Promise<Result<Team | null, Error>> {
    const team = this.teamsByName.get(name.getValue()) || null;
    return ok(team);
  }

  /**
   * すべてのチームを取得する
   */
  async findAll(): Promise<Result<Team[], Error>> {
    return ok(Array.from(this.teams.values()));
  }

  /**
   * メンバーIDでチームを取得する
   */
  async findByMemberId(memberId: string): Promise<Result<Team | null, Error>> {
    const team = this.teamsByMemberId.get(memberId) || null;
    return ok(team);
  }

  /**
   * チーム名が既に使用されているかを確認する
   */
  async exists(name: TeamName): Promise<Result<boolean, Error>> {
    return ok(this.teamsByName.has(name.getValue()));
  }

  /**
   * 最も人数の少ないチームを取得する
   */
  async findSmallestTeam(): Promise<Result<Team | null, Error>> {
    if (this.teams.size === 0) {
      return ok(null);
    }

    let smallestTeam: Team | null = null;
    let smallestSize = Number.POSITIVE_INFINITY;

    for (const team of this.teams.values()) {
      const size = team.getMembers().length;
      if (size < smallestSize) {
        smallestSize = size;
        smallestTeam = team;
      }
    }

    return ok(smallestTeam);
  }
}

describe("TeamRepository", () => {
  // モックリポジトリのインスタンスを作成
  const repository = new MockTeamRepository();

  // 各テスト前にリポジトリをリセット
  beforeEach(() => {
    repository.reset();
  });

  describe("save", () => {
    test("チームを保存できること", async () => {
      // チーム名の作成
      const teamNameResult = TeamName.create("testteam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // チームの作成
      const teamResult = Team.create({ name: teamNameResult.value });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;

      // チームの保存
      const saveResult = await repository.save(teamResult.value);
      expect(saveResult.ok).toBe(true);

      // 保存されたチームの取得
      const findResult = await repository.findById(teamResult.value.getId());
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したチームの検証
      const team = findResult.value;
      expect(team).not.toBeNull();
      if (!team) return;
      expect(team.getName().getValue()).toBe("testteam");
      expect(team.getMembers().length).toBe(0);
    });

    test("メンバー付きのチームを保存できること", async () => {
      // チーム名の作成
      const teamNameResult = TeamName.create("teamwithmembers");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // チームの作成
      const teamResult = Team.create({ name: teamNameResult.value });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;
      const team = teamResult.value;

      // メンバーの作成
      const memberResult = TeamMember.create({
        name: "Test Member",
        email: "test@example.com",
      });
      expect(memberResult.ok).toBe(true);
      if (!memberResult.ok) return;

      // チームにメンバーを追加
      const addResult = team.addMember(memberResult.value);
      expect(addResult.ok).toBe(true);

      // チームの保存
      const saveResult = await repository.save(team);
      expect(saveResult.ok).toBe(true);

      // 保存されたチームの取得
      const findResult = await repository.findById(team.getId());
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したチームの検証
      const savedTeam = findResult.value;
      expect(savedTeam).not.toBeNull();
      if (!savedTeam) return;
      expect(savedTeam.getName().getValue()).toBe("teamwithmembers");
      expect(savedTeam.getMembers().length).toBe(1);

      const member = savedTeam.getMembers()[0];
      expect(member).toBeDefined();
      if (!member) return;

      expect(member.getName()).toBe("Test Member");
      expect(member.getEmail().getValue()).toBe("test@example.com");
    });

    test("チームを更新できること", async () => {
      // チーム名の作成
      const teamNameResult = TeamName.create("originalteam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // チームの作成
      const teamResult = Team.create({ name: teamNameResult.value });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;
      const team = teamResult.value;

      // チームの保存
      const saveResult = await repository.save(team);
      expect(saveResult.ok).toBe(true);

      // 新しいチーム名の作成
      const newTeamNameResult = TeamName.create("updatedteam");
      expect(newTeamNameResult.ok).toBe(true);
      if (!newTeamNameResult.ok) return;

      // 新しいチームの作成（同じID）
      const updatedTeamResult = Team.reconstruct({
        id: team.getId(),
        name: newTeamNameResult.value,
        members: [],
      });
      expect(updatedTeamResult.ok).toBe(true);
      if (!updatedTeamResult.ok) return;

      // 更新されたチームの保存
      const updateResult = await repository.save(updatedTeamResult.value);
      expect(updateResult.ok).toBe(true);

      // 更新されたチームの取得
      const findResult = await repository.findById(team.getId());
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したチームの検証
      const updatedTeam = findResult.value;
      expect(updatedTeam).not.toBeNull();
      if (!updatedTeam) return;
      expect(updatedTeam.getName().getValue()).toBe("updatedteam");
    });
  });

  describe("findByName", () => {
    test("チーム名でチームを検索できること", async () => {
      // チーム名の作成
      const teamNameResult = TeamName.create("searchteam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // チームの作成
      const teamResult = Team.create({ name: teamNameResult.value });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;

      // チームの保存
      const saveResult = await repository.save(teamResult.value);
      expect(saveResult.ok).toBe(true);

      // チーム名による検索
      const findResult = await repository.findByName(teamNameResult.value);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したチームの検証
      const team = findResult.value;
      expect(team).not.toBeNull();
      if (!team) return;
      expect(team.getId()).toBe(teamResult.value.getId());
      expect(team.getName().getValue()).toBe("searchteam");
    });

    test("存在しないチーム名の場合はnullを返すこと", async () => {
      // 存在しないチーム名の作成
      const nonExistentTeamNameResult = TeamName.create("nonexistent");
      expect(nonExistentTeamNameResult.ok).toBe(true);
      if (!nonExistentTeamNameResult.ok) return;

      // 存在しないチーム名による検索
      const findResult = await repository.findByName(
        nonExistentTeamNameResult.value,
      );
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 結果の検証
      expect(findResult.value).toBeNull();
    });
  });

  describe("findByMemberId", () => {
    test("メンバーIDでチームを検索できること", async () => {
      // チーム名の作成
      const teamNameResult = TeamName.create("memberteam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // チームの作成
      const teamResult = Team.create({ name: teamNameResult.value });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;
      const team = teamResult.value;

      // メンバーの作成
      const memberResult = TeamMember.create({
        name: "Member For Search",
        email: "member-search@example.com",
      });
      expect(memberResult.ok).toBe(true);
      if (!memberResult.ok) return;
      const member = memberResult.value;

      // チームにメンバーを追加
      const addResult = team.addMember(member);
      expect(addResult.ok).toBe(true);

      // チームの保存
      const saveResult = await repository.save(team);
      expect(saveResult.ok).toBe(true);

      // メンバーIDによる検索
      const findResult = await repository.findByMemberId(member.getId());
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したチームの検証
      const foundTeam = findResult.value;
      expect(foundTeam).not.toBeNull();
      if (!foundTeam) return;
      expect(foundTeam.getId()).toBe(team.getId());
      expect(foundTeam.getName().getValue()).toBe("memberteam");
    });

    test("存在しないメンバーIDの場合はnullを返すこと", async () => {
      // 存在しないメンバーIDによる検索
      const findResult = await repository.findByMemberId("non-existent-id");
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 結果の検証
      expect(findResult.value).toBeNull();
    });
  });

  describe("findAll", () => {
    test("すべてのチームを取得できること", async () => {
      // チームAの作成と保存
      const teamNameAResult = TeamName.create("teamA");
      expect(teamNameAResult.ok).toBe(true);
      if (!teamNameAResult.ok) return;
      const teamAResult = Team.create({ name: teamNameAResult.value });
      expect(teamAResult.ok).toBe(true);
      if (!teamAResult.ok) return;
      const saveResultA = await repository.save(teamAResult.value);
      expect(saveResultA.ok).toBe(true);

      // チームBの作成と保存
      const teamNameBResult = TeamName.create("teamB");
      expect(teamNameBResult.ok).toBe(true);
      if (!teamNameBResult.ok) return;
      const teamBResult = Team.create({ name: teamNameBResult.value });
      expect(teamBResult.ok).toBe(true);
      if (!teamBResult.ok) return;
      const saveResultB = await repository.save(teamBResult.value);
      expect(saveResultB.ok).toBe(true);

      // すべてのチームの取得
      const findAllResult = await repository.findAll();
      expect(findAllResult.ok).toBe(true);
      if (!findAllResult.ok) return;

      // 結果の検証
      const teams = findAllResult.value;
      expect(teams.length).toBe(2);
      const teamNames = teams.map((team) => team.getName().getValue()).sort();
      expect(teamNames).toEqual(["teamA", "teamB"]);
    });

    test("チームが存在しない場合は空配列を返すこと", async () => {
      // すべてのチームの取得
      const findAllResult = await repository.findAll();
      expect(findAllResult.ok).toBe(true);
      if (!findAllResult.ok) return;

      // 結果の検証
      const teams = findAllResult.value;
      expect(teams.length).toBe(0);
    });
  });

  describe("exists", () => {
    test("チーム名が存在する場合はtrueを返すこと", async () => {
      // チーム名の作成
      const teamNameResult = TeamName.create("existingteam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // チームの作成
      const teamResult = Team.create({ name: teamNameResult.value });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;

      // チームの保存
      const saveResult = await repository.save(teamResult.value);
      expect(saveResult.ok).toBe(true);

      // チーム名の存在確認
      const existsResult = await repository.exists(teamNameResult.value);
      expect(existsResult.ok).toBe(true);
      if (!existsResult.ok) return;

      // 結果の検証
      expect(existsResult.value).toBe(true);
    });

    test("チーム名が存在しない場合はfalseを返すこと", async () => {
      // 存在しないチーム名の作成
      const nonExistentTeamNameResult = TeamName.create("nonexistentteam");
      expect(nonExistentTeamNameResult.ok).toBe(true);
      if (!nonExistentTeamNameResult.ok) return;

      // チーム名の存在確認
      const existsResult = await repository.exists(
        nonExistentTeamNameResult.value,
      );
      expect(existsResult.ok).toBe(true);
      if (!existsResult.ok) return;

      // 結果の検証
      expect(existsResult.value).toBe(false);
    });
  });

  describe("findSmallestTeam", () => {
    test("最も人数の少ないチームを取得できること", async () => {
      // チーム1（2名）の作成と保存
      const teamName1Result = TeamName.create("largeteam");
      expect(teamName1Result.ok).toBe(true);
      if (!teamName1Result.ok) return;
      const team1Result = Team.create({ name: teamName1Result.value });
      expect(team1Result.ok).toBe(true);
      if (!team1Result.ok) return;
      const team1 = team1Result.value;

      // メンバー1の作成と追加
      const member1Result = TeamMember.create({
        name: "Member 1",
        email: "member1@example.com",
      });
      expect(member1Result.ok).toBe(true);
      if (!member1Result.ok) return;
      const addResult1 = team1.addMember(member1Result.value);
      expect(addResult1.ok).toBe(true);

      // メンバー2の作成と追加
      const member2Result = TeamMember.create({
        name: "Member 2",
        email: "member2@example.com",
      });
      expect(member2Result.ok).toBe(true);
      if (!member2Result.ok) return;
      const addResult2 = team1.addMember(member2Result.value);
      expect(addResult2.ok).toBe(true);

      // チーム1の保存
      const saveResult1 = await repository.save(team1);
      expect(saveResult1.ok).toBe(true);

      // チーム2（1名）の作成と保存
      const teamName2Result = TeamName.create("smallteam");
      expect(teamName2Result.ok).toBe(true);
      if (!teamName2Result.ok) return;
      const team2Result = Team.create({ name: teamName2Result.value });
      expect(team2Result.ok).toBe(true);
      if (!team2Result.ok) return;
      const team2 = team2Result.value;

      // メンバー3の作成と追加
      const member3Result = TeamMember.create({
        name: "Member 3",
        email: "member3@example.com",
      });
      expect(member3Result.ok).toBe(true);
      if (!member3Result.ok) return;
      const addResult3 = team2.addMember(member3Result.value);
      expect(addResult3.ok).toBe(true);

      // チーム2の保存
      const saveResult2 = await repository.save(team2);
      expect(saveResult2.ok).toBe(true);

      // 最も人数の少ないチームの取得
      const findSmallestResult = await repository.findSmallestTeam();
      expect(findSmallestResult.ok).toBe(true);
      if (!findSmallestResult.ok) return;

      // 結果の検証
      const smallestTeam = findSmallestResult.value;
      expect(smallestTeam).not.toBeNull();
      if (!smallestTeam) return;
      expect(smallestTeam.getName().getValue()).toBe("smallteam");
      expect(smallestTeam.getMembers().length).toBe(1);
    });

    test("チームが存在しない場合はnullを返すこと", async () => {
      // 最も人数の少ないチームの取得
      const findSmallestResult = await repository.findSmallestTeam();
      expect(findSmallestResult.ok).toBe(true);
      if (!findSmallestResult.ok) return;

      // 結果の検証
      expect(findSmallestResult.value).toBeNull();
    });
  });
});
