import { beforeEach, describe, expect, test, vi } from "vitest";
import { err, ok } from "../../../domain/shared/result";
import { TeamName } from "../../../domain/shared/team-name";
import { Team } from "../../../domain/team/team";
import { TeamMember } from "../../../domain/team/team-member";
import {
  GetTeamByIdUseCase,
  GetTeamByIdUseCaseError,
  GetTeamByIdUseCaseTeamNotFoundError,
} from "../get-team-by-id-use-case";

describe("GetTeamByIdUseCase", () => {
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
  });

  test("存在するチームIDを指定した場合、チーム情報が取得できる", async () => {
    // テスト用のチームを作成
    const team = createTestTeam();
    const member = createTestMember("山田太郎", "yamada@example.com");
    team.addMember(member);

    // モックの設定
    mockTeamRepository.findById.mockResolvedValue(ok(team));

    // ユースケースの作成
    const useCase = new GetTeamByIdUseCase(mockTeamRepository);

    // 実行
    const result = await useCase.invoke({
      teamId: "team-1",
    });

    // 検証
    expect(result.id).toBe(team.getId());
    expect(result.name).toBe("alpha");
    expect(result.members).toHaveLength(1);

    const retrievedMember = result.members[0];
    expect(retrievedMember).toBeDefined();
    if (retrievedMember) {
      expect(retrievedMember.name).toBe("山田太郎");
      expect(retrievedMember.email).toBe("yamada@example.com");
      expect(retrievedMember.status).toBe("在籍中");
    }
    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.findById).toHaveBeenCalledWith("team-1");
  });

  test("存在しないチームIDを指定した場合、エラーになる", async () => {
    // チームが見つからない場合のモック設定
    mockTeamRepository.findById.mockResolvedValue(ok(null));

    // ユースケースの作成
    const useCase = new GetTeamByIdUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "non-existent-id",
      }),
    ).rejects.toThrow(GetTeamByIdUseCaseTeamNotFoundError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.findById).toHaveBeenCalledWith("non-existent-id");
  });

  test("リポジトリでエラーが発生した場合、エラーになる", async () => {
    // リポジトリエラーのモック設定
    mockTeamRepository.findById.mockResolvedValue(
      err(new Error("DB接続エラー")),
    );

    // ユースケースの作成
    const useCase = new GetTeamByIdUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamId: "team-1",
      }),
    ).rejects.toThrow(GetTeamByIdUseCaseError);

    expect(mockTeamRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.findById).toHaveBeenCalledWith("team-1");
  });
});
