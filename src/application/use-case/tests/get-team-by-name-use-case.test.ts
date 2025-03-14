import { beforeEach, describe, expect, test, vi } from "vitest";
import { err, ok } from "../../../domain/shared/result";
import { TeamName } from "../../../domain/shared/team-name";
import { Team } from "../../../domain/team/team";
import { TeamMember } from "../../../domain/team/team-member";
import {
  GetTeamByNameUseCase,
  GetTeamByNameUseCaseError,
  GetTeamByNameUseCaseInvalidNameError,
  GetTeamByNameUseCaseTeamNotFoundError,
} from "../get-team-by-name-use-case";

describe("GetTeamByNameUseCase", () => {
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

  test("有効なチーム名でチーム情報が取得できる", async () => {
    // テスト用のチームを作成
    const team = createTestTeam();
    const member = createTestMember("山田太郎", "yamada@example.com");
    team.addMember(member);

    // モックの設定
    mockTeamRepository.findByName.mockImplementation(async (name) => {
      if (name.getValue() === "alpha") {
        return ok(team);
      }
      return ok(null);
    });

    // ユースケースの作成
    const useCase = new GetTeamByNameUseCase(mockTeamRepository);

    // 実行
    const result = await useCase.invoke({
      teamName: "alpha",
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
    expect(mockTeamRepository.findByName).toHaveBeenCalledTimes(1);
  });

  test("無効なチーム名（空文字）でエラーになる", async () => {
    // ユースケースの作成
    const useCase = new GetTeamByNameUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamName: "",
      }),
    ).rejects.toThrow(GetTeamByNameUseCaseInvalidNameError);

    expect(mockTeamRepository.findByName).not.toHaveBeenCalled();
  });

  test("無効なチーム名（英文字以外）でエラーになる", async () => {
    // ユースケースの作成
    const useCase = new GetTeamByNameUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamName: "チーム1",
      }),
    ).rejects.toThrow(GetTeamByNameUseCaseInvalidNameError);

    expect(mockTeamRepository.findByName).not.toHaveBeenCalled();
  });

  test("存在しないチーム名でエラーになる", async () => {
    // チームが見つからない場合のモック設定
    mockTeamRepository.findByName.mockResolvedValue(ok(null));

    // ユースケースの作成
    const useCase = new GetTeamByNameUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamName: "nonexistent",
      }),
    ).rejects.toThrow(GetTeamByNameUseCaseTeamNotFoundError);

    expect(mockTeamRepository.findByName).toHaveBeenCalledTimes(1);
  });

  test("リポジトリでエラーが発生した場合、エラーになる", async () => {
    // リポジトリエラーのモック設定
    mockTeamRepository.findByName.mockResolvedValue(
      err(new Error("DB接続エラー")),
    );

    // ユースケースの作成
    const useCase = new GetTeamByNameUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        teamName: "alpha",
      }),
    ).rejects.toThrow(GetTeamByNameUseCaseError);

    expect(mockTeamRepository.findByName).toHaveBeenCalledTimes(1);
  });
});
