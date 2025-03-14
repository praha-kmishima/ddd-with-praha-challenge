import { beforeEach, describe, expect, test, vi } from "vitest";
import { err, ok } from "../../../domain/shared/result";
import { TeamName } from "../../../domain/shared/team-name";
import { Team } from "../../../domain/team/team";
import { TeamMember } from "../../../domain/team/team-member";
import {
  AddTeamMemberUseCase,
  AddTeamMemberUseCaseError,
  AddTeamMemberUseCaseInvalidMemberError,
  AddTeamMemberUseCaseTeamNotFoundError,
  AddTeamMemberUseCaseTeamSizeError,
} from "../add-team-member-use-case";

describe("AddTeamMemberUseCase", () => {
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

  // テスト用のチーム作成
  const createTestTeam = () => {
    const teamNameResult = TeamName.create("alpha");
    if (!teamNameResult.ok) {
      throw new Error("チーム名の作成に失敗しました");
    }

    const teamResult = Team.create({
      name: teamNameResult.value,
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

  beforeEach(() => {
    vi.resetAllMocks();
    // デフォルトの戻り値を設定
    mockTeamRepository.findById.mockResolvedValue(ok(createTestTeam()));
    mockTeamRepository.save.mockResolvedValue(ok(undefined));
  });

  test("チームにメンバーを追加できる", async () => {
    // ユースケースの作成
    const useCase = new AddTeamMemberUseCase(mockTeamRepository);

    // 実行
    const result = await useCase.invoke({
      teamId: "team-1",
      memberName: "山田太郎",
      memberEmail: "yamada@example.com",
    });

    // 検証
    expect(result.teamName).toBe("alpha");
    expect(result.members).toHaveLength(1);

    const addedMember = result.members[0];
    expect(addedMember).toBeDefined();
    if (addedMember) {
      expect(addedMember.name).toBe("山田太郎");
      expect(addedMember.email).toBe("yamada@example.com");
      expect(addedMember.status).toBe("在籍中");
    }
    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
  });

  test("存在しないチームIDを指定するとエラーになる", async () => {
    // チームが見つからない場合のモック設定
    mockTeamRepository.findById.mockResolvedValue(ok(null));

    // ユースケースの作成
    const useCase = new AddTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "non-existent-id",
        memberName: "山田太郎",
        memberEmail: "yamada@example.com",
      }),
    ).rejects.toThrow(AddTeamMemberUseCaseTeamNotFoundError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("チームの取得に失敗するとエラーになる", async () => {
    // チーム取得失敗のモック設定
    mockTeamRepository.findById.mockResolvedValue(
      err(new Error("DB接続エラー")),
    );

    // ユースケースの作成
    const useCase = new AddTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "team-1",
        memberName: "山田太郎",
        memberEmail: "yamada@example.com",
      }),
    ).rejects.toThrow(AddTeamMemberUseCaseError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("無効なメールアドレスを指定するとエラーになる", async () => {
    // ユースケースの作成
    const useCase = new AddTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "team-1",
        memberName: "山田太郎",
        memberEmail: "invalid-email",
      }),
    ).rejects.toThrow(AddTeamMemberUseCaseInvalidMemberError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("空の名前を指定するとエラーになる", async () => {
    // ユースケースの作成
    const useCase = new AddTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "team-1",
        memberName: "",
        memberEmail: "yamada@example.com",
      }),
    ).rejects.toThrow(AddTeamMemberUseCaseInvalidMemberError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("チームサイズの上限を超えるとエラーになる", async () => {
    // 4人のメンバーがいるチームを作成
    const team = createTestTeam();
    for (let i = 1; i <= 4; i++) {
      const member = createTestMember(`メンバー${i}`, `member${i}@example.com`);
      team.addMember(member);
    }

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new AddTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "team-1",
        memberName: "新メンバー",
        memberEmail: "new@example.com",
      }),
    ).rejects.toThrow(AddTeamMemberUseCaseTeamSizeError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("チームの保存に失敗するとエラーになる", async () => {
    // 保存失敗のモック設定
    mockTeamRepository.save.mockResolvedValue(err(new Error("保存エラー")));

    // ユースケースの作成
    const useCase = new AddTeamMemberUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "team-1",
        memberName: "山田太郎",
        memberEmail: "yamada@example.com",
      }),
    ).rejects.toThrow(AddTeamMemberUseCaseError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
  });
});
