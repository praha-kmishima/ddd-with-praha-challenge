import { beforeEach, describe, expect, test, vi } from "vitest";
import { EnrollmentStatus } from "../../../domain/shared/enrollment-status";
import { err, ok } from "../../../domain/shared/result";
import { TeamName } from "../../../domain/shared/team-name";
import { Team } from "../../../domain/team/team";
import { TeamMember } from "../../../domain/team/team-member";
import {
  ChangeTeamMemberStatusUseCase,
  ChangeTeamMemberStatusUseCaseError,
  ChangeTeamMemberStatusUseCaseInvalidStatusError,
  ChangeTeamMemberStatusUseCaseInvalidTransitionError,
  ChangeTeamMemberStatusUseCaseMemberNotFoundError,
  ChangeTeamMemberStatusUseCaseTeamNotFoundError,
} from "../change-team-member-status-use-case";

describe("ChangeTeamMemberStatusUseCase", () => {
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

  test("メンバーの在籍状態を「在籍中」から「休会中」に変更できる", async () => {
    // 3人のメンバーがいるチームを作成
    const { team, getMember } = createTestTeamWithMembers(3);
    // 2番目のメンバーを対象とする
    const targetMember = getMember(1);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new ChangeTeamMemberStatusUseCase(mockTeamRepository);

    // 実行
    const result = await useCase.invoke({
      teamId: team.getId(),
      memberId: targetMember.getId(),
      newStatus: "休会中",
    });

    // 検証
    expect(result.teamName).toBe("alpha");
    // 休会中になったメンバーはチームから削除されるため、メンバー数は2になる
    expect(result.members).toHaveLength(2);
    // 削除されたメンバーがいないことを確認
    expect(result.members.some((m) => m.id === targetMember.getId())).toBe(
      false,
    );
    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
  });

  test("メンバーの在籍状態を「在籍中」から「退会済」に変更できる", async () => {
    // 3人のメンバーがいるチームを作成
    const { team, getMember } = createTestTeamWithMembers(3);
    // 2番目のメンバーを対象とする
    const targetMember = getMember(1);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new ChangeTeamMemberStatusUseCase(mockTeamRepository);

    // 実行
    const result = await useCase.invoke({
      teamId: team.getId(),
      memberId: targetMember.getId(),
      newStatus: "退会済",
    });

    // 検証
    expect(result.teamName).toBe("alpha");
    // 退会済になったメンバーはチームから削除されるため、メンバー数は2になる
    expect(result.members).toHaveLength(2);
    // 削除されたメンバーがいないことを確認
    expect(result.members.some((m) => m.id === targetMember.getId())).toBe(
      false,
    );
    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
  });

  test("存在しないチームIDを指定するとエラーになる", async () => {
    // チームが見つからない場合のモック設定
    mockTeamRepository.findById.mockResolvedValue(ok(null));

    // ユースケースの作成
    const useCase = new ChangeTeamMemberStatusUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "non-existent-id",
        memberId: "member-id",
        newStatus: "休会中",
      }),
    ).rejects.toThrow(ChangeTeamMemberStatusUseCaseTeamNotFoundError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("チームの取得に失敗するとエラーになる", async () => {
    // チーム取得失敗のモック設定
    mockTeamRepository.findById.mockResolvedValue(
      err(new Error("DB接続エラー")),
    );

    // ユースケースの作成
    const useCase = new ChangeTeamMemberStatusUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "team-id",
        memberId: "member-id",
        newStatus: "休会中",
      }),
    ).rejects.toThrow(ChangeTeamMemberStatusUseCaseError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("存在しないメンバーIDを指定するとエラーになる", async () => {
    // 3人のメンバーがいるチームを作成
    const { team } = createTestTeamWithMembers(3);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new ChangeTeamMemberStatusUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: team.getId(),
        memberId: "non-existent-member-id",
        newStatus: "休会中",
      }),
    ).rejects.toThrow(ChangeTeamMemberStatusUseCaseMemberNotFoundError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("無効な在籍状態を指定するとエラーになる", async () => {
    // 3人のメンバーがいるチームを作成
    const { team, getMember } = createTestTeamWithMembers(3);
    // 2番目のメンバーを対象とする
    const targetMember = getMember(1);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new ChangeTeamMemberStatusUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: team.getId(),
        memberId: targetMember.getId(),
        newStatus: "無効な状態",
      }),
    ).rejects.toThrow(ChangeTeamMemberStatusUseCaseInvalidStatusError);

    expect(mockTeamRepository.findById).not.toHaveBeenCalled();
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("無効な状態遷移を指定するとエラーになる", async () => {
    // 3人のメンバーがいるチームを作成
    const { team, getMember } = createTestTeamWithMembers(3);
    // 2番目のメンバーを対象とする
    const targetMember = getMember(1);

    // メンバーの状態を「退会済」に変更
    const statusResult = EnrollmentStatus.create("退会済");
    if (!statusResult.ok) {
      throw new Error("在籍状態の作成に失敗しました");
    }
    targetMember.changeStatus(statusResult.value);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new ChangeTeamMemberStatusUseCase(mockTeamRepository);

    // 実行と検証（退会済から休会中への遷移は無効）
    await expect(
      useCase.invoke({
        teamId: team.getId(),
        memberId: targetMember.getId(),
        newStatus: "休会中",
      }),
    ).rejects.toThrow(ChangeTeamMemberStatusUseCaseInvalidTransitionError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("チームの保存に失敗するとエラーになる", async () => {
    // 3人のメンバーがいるチームを作成
    const { team, getMember } = createTestTeamWithMembers(3);
    // 2番目のメンバーを対象とする
    const targetMember = getMember(1);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));
    mockTeamRepository.save.mockResolvedValue(err(new Error("保存エラー")));

    // ユースケースの作成
    const useCase = new ChangeTeamMemberStatusUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: team.getId(),
        memberId: targetMember.getId(),
        newStatus: "休会中",
      }),
    ).rejects.toThrow(ChangeTeamMemberStatusUseCaseError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
  });
});
