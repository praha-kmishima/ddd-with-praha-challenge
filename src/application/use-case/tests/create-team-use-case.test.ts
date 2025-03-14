import { beforeEach, describe, expect, test, vi } from "vitest";
import { err, ok } from "../../../domain/shared/result";
import {
  CreateTeamUseCase,
  CreateTeamUseCaseError,
  CreateTeamUseCaseInvalidNameError,
  CreateTeamUseCaseNameExistsError,
} from "../create-team-use-case";

describe("CreateTeamUseCase", () => {
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

  beforeEach(() => {
    vi.resetAllMocks();
    // デフォルトの戻り値を設定
    mockTeamRepository.exists.mockResolvedValue(ok(false));
    mockTeamRepository.save.mockResolvedValue(ok(undefined));
  });

  test("有効なチーム名でチームを作成できる", async () => {
    // ユースケースの作成
    const useCase = new CreateTeamUseCase(mockTeamRepository);

    // 実行
    const result = await useCase.invoke({
      name: "TeamA",
    });

    // 検証
    expect(result.name).toBe("TeamA");
    expect(result.members).toHaveLength(0);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.exists).toHaveBeenCalledTimes(1);
  });

  test("無効なチーム名（空文字）でエラーになる", async () => {
    // ユースケースの作成
    const useCase = new CreateTeamUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        name: "",
      }),
    ).rejects.toThrow(CreateTeamUseCaseInvalidNameError);

    expect(mockTeamRepository.exists).not.toHaveBeenCalled();
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("無効なチーム名（英文字以外）でエラーになる", async () => {
    // ユースケースの作成
    const useCase = new CreateTeamUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        name: "チーム1",
      }),
    ).rejects.toThrow(CreateTeamUseCaseInvalidNameError);

    expect(mockTeamRepository.exists).not.toHaveBeenCalled();
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("既に存在するチーム名でエラーになる", async () => {
    // 既存チーム名のモック設定
    mockTeamRepository.exists.mockResolvedValue(ok(true));

    // ユースケースの作成
    const useCase = new CreateTeamUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        name: "TeamA",
      }),
    ).rejects.toThrow(CreateTeamUseCaseNameExistsError);

    expect(mockTeamRepository.exists).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("チーム名の一意性確認に失敗するとエラーになる", async () => {
    // 一意性確認失敗のモック設定
    mockTeamRepository.exists.mockResolvedValue(err(new Error("DB接続エラー")));

    // ユースケースの作成
    const useCase = new CreateTeamUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        name: "TeamA",
      }),
    ).rejects.toThrow(CreateTeamUseCaseError);

    expect(mockTeamRepository.exists).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).not.toHaveBeenCalled();
  });

  test("チームの保存に失敗するとエラーになる", async () => {
    // 保存失敗のモック設定
    mockTeamRepository.save.mockResolvedValue(err(new Error("保存エラー")));

    // ユースケースの作成
    const useCase = new CreateTeamUseCase(mockTeamRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        name: "TeamA",
      }),
    ).rejects.toThrow(CreateTeamUseCaseError);

    expect(mockTeamRepository.exists).toHaveBeenCalledTimes(1);
    expect(mockTeamRepository.save).toHaveBeenCalledTimes(1);
  });
});
