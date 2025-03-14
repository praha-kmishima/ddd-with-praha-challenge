import { beforeEach, describe, expect, test, vi } from "vitest";
import { err, ok } from "../../../domain/shared/result";
import { TeamName } from "../../../domain/shared/team-name";
import { Team } from "../../../domain/team/team";
import { TeamMember } from "../../../domain/team/team-member";
import {
  RemoveTeamMemberUseCase,
  RemoveTeamMemberUseCaseError,
  RemoveTeamMemberUseCaseMemberNotFoundError,
  RemoveTeamMemberUseCaseTeamNotFoundError,
} from "../remove-team-member-use-case";

describe("RemoveTeamMemberUseCase", () => {
  // モックリポジトリの作成
  const mockTeamRepository = {
    save: vi.fn(),
    exists: vi.fn(),
    findById: vi.fn(),
    findByName: vi.fn(),
    findAll: vi.fn(),
    findByMemberId: vi.fn(),
    findSmallestTeam: vi.fn(),
  };

  // テスト用のチーム名作成
  const createTestTeamName = () => {
    const teamNameResult = TeamName.create("alpha");
    if (!teamNameResult.ok) {
      throw new Error("チーム名の作成に失敗しました");
    }
    return teamNameResult.value;
  };

  // テスト用のチーム作成
  const createTestTeam = () => {
    const teamResult = Team.create({
      name: createTestTeamName(),
    });

    if (!teamResult.ok) {
      throw new Error("チームの作成に失敗しました");
    }

    return teamResult.value;
  };

  // テスト用のチームメンバー作成
  const createTestMember = (name: string, email: string) => {
    const memberResult = TeamMember.create({
      name,
      email,
    });

    if (!memberResult.ok) {
      throw new Error("チームメンバーの作成に失敗しました");
    }

    return memberResult.value;
  };

  // テスト用のチームとメンバーを作成
  const createTestTeamWithMembers = (
    memberCount: number,
  ): {
    team: Team;
    members: TeamMember[];
    getMember: (index: number) => TeamMember;
  } => {
    const team = createTestTeam();
    const members: TeamMember[] = [];

    for (let i = 1; i <= memberCount; i++) {
      const member = createTestMember(`メンバー${i}`, `member${i}@example.com`);
      team.addMember(member);
      members.push(member);
    }

    // 安全にメンバーを取得するヘルパー関数
    const getMember = (index: number): TeamMember => {
      if (index >= members.length || members[index] === undefined) {
        throw new Error(`インデックス ${index} のメンバーは存在しません`);
      }
      return members[index] as TeamMember;
    };

    return { team, members, getMember };
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // デフォルトの戻り値を設定
    mockTeamRepository.save.mockResolvedValue(ok(undefined));
  });

  test("チームからメンバーを削除できる", async () => {
    // 3人のメンバーがいるチームを作成
    const { team, getMember } = createTestTeamWithMembers(3);
    // 2番目のメンバーを削除対象とする
    const targetMember = getMember(1);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new RemoveTeamMemberUseCase(mockTeamRepository);

    // 実行
    const result = await useCase.invoke({
      teamId: team.getId(),
      memberId: targetMember.getId(),
    });

    // 検証
    expect(result.teamName).toBe("alpha");
    expect(result.members).toHaveLength(2); // 3人から1人削除して2人になる
    expect(result.members.some((m) => m.id === targetMember.getId())).toBe(
      false,
    ); // 削除対象のメンバーがいないことを確認
    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
  });

  test("存在しないチームIDを指定するとエラーになる", async () => {
    // チームが見つからない場合のモック設定
    mockTeamRepository.findById.mockResolvedValue(ok(null));

    // ユースケースの作成
    const useCase = new RemoveTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "non-existent-id",
        memberId: "member-id",
      }),
    ).rejects.toThrow(RemoveTeamMemberUseCaseTeamNotFoundError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("チームの取得に失敗するとエラーになる", async () => {
    // チーム取得失敗のモック設定
    mockTeamRepository.findById.mockResolvedValue(
      err(new Error("DB接続エラー")),
    );

    // ユースケースの作成
    const useCase = new RemoveTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "team-id",
        memberId: "member-id",
      }),
    ).rejects.toThrow(RemoveTeamMemberUseCaseError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("存在しないメンバーIDを指定するとエラーになる", async () => {
    // 3人のメンバーがいるチームを作成
    const { team } = createTestTeamWithMembers(3);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new RemoveTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: team.getId(),
        memberId: "non-existent-member-id",
      }),
    ).rejects.toThrow(RemoveTeamMemberUseCaseMemberNotFoundError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("チームサイズが2人の場合、メンバーを削除できる", async () => {
    // 2人のメンバーがいるチームを作成
    const { team, getMember } = createTestTeamWithMembers(2);
    // 1番目のメンバーを削除対象とする
    const targetMember = getMember(0);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new RemoveTeamMemberUseCase(mockTeamRepository);

    // 実行
    const result = await useCase.invoke({
      teamId: team.getId(),
      memberId: targetMember.getId(),
    });

    // 検証
    expect(result.members).toHaveLength(1); // 2人から1人削除して1人になる
    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
  });

  test("チームの保存に失敗するとエラーになる", async () => {
    // 3人のメンバーがいるチームを作成
    const { team, getMember } = createTestTeamWithMembers(3);
    // 1番目のメンバーを削除対象とする
    const targetMember = getMember(0);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));
    mockTeamRepository.save.mockResolvedValue(err(new Error("保存エラー")));

    // ユースケースの作成
    const useCase = new RemoveTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: team.getId(),
        memberId: targetMember.getId(),
      }),
    ).rejects.toThrow(RemoveTeamMemberUseCaseError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
  });
});
