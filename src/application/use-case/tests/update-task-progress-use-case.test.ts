import { describe, expect, test, vi } from "vitest";
import { ProgressStatus } from "../../../domain/shared/progress-status";
import { type Result, err, ok } from "../../../domain/shared/result";
import { Task } from "../../../domain/task/task";
import {
  UpdateTaskProgressUseCase,
  UpdateTaskProgressUseCaseError,
  UpdateTaskProgressUseCaseInvalidStatusError,
  UpdateTaskProgressUseCaseNotFoundError,
} from "../update-task-progress-use-case";

describe("UpdateTaskProgressUseCase", () => {
  // モックリポジトリの作成
  const createMockTaskRepository = () => {
    const tasks = new Map<string, Task>();

    return {
      save: vi.fn(async (task: Task): Promise<Result<Task, Error>> => {
        tasks.set(task.id, task);
        return ok(task);
      }),
      findById: vi.fn(
        async (id: string): Promise<Result<Task | null, Error>> => {
          const task = tasks.get(id) || null;
          return ok(task);
        },
      ),
      findByOwnerId: vi.fn(
        async (ownerId: string): Promise<Result<Task[], Error>> => {
          const result = Array.from(tasks.values()).filter(
            (task) => task.ownerId === ownerId,
          );
          return ok(result);
        },
      ),
      // テスト用のヘルパーメソッド
      addTask: (task: Task) => {
        tasks.set(task.id, task);
      },
      clear: () => {
        tasks.clear();
      },
    };
  };

  // テスト用のタスク作成
  const createTestTask = () => {
    const ownerId = "owner-1";
    return new Task({
      title: "テストタスク",
      ownerId,
    });
  };

  test("タスクの進捗ステータスを未着手から取組中に更新できる", async () => {
    // モックリポジトリの準備
    const mockTaskRepository = createMockTaskRepository();
    const task = createTestTask();
    mockTaskRepository.addTask(task);

    // ユースケースの作成
    const useCase = new UpdateTaskProgressUseCase(mockTaskRepository);

    // 実行
    const result = await useCase.invoke({
      taskId: task.id,
      progressStatus: "取組中",
      requesterId: task.ownerId,
    });

    // 検証
    expect(result.progressStatus.getValue()).toBe("取組中");
    expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);
  });

  test("タスクの進捗ステータスを取組中からレビュー待ちに更新できる", async () => {
    // モックリポジトリの準備
    const mockTaskRepository = createMockTaskRepository();
    const task = createTestTask();

    // 初期状態を取組中に設定
    task.changeProgressStatus(ProgressStatus.IN_PROGRESS, task.ownerId);
    mockTaskRepository.addTask(task);

    // ユースケースの作成
    const useCase = new UpdateTaskProgressUseCase(mockTaskRepository);

    // 実行
    const result = await useCase.invoke({
      taskId: task.id,
      progressStatus: "レビュー待ち",
      requesterId: task.ownerId,
    });

    // 検証
    expect(result.progressStatus.getValue()).toBe("レビュー待ち");
    expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);
  });

  test("タスクの進捗ステータスをレビュー待ちから完了に更新できる", async () => {
    // モックリポジトリの準備
    const mockTaskRepository = createMockTaskRepository();
    const task = createTestTask();

    // 初期状態をレビュー待ちに設定
    task.changeProgressStatus(ProgressStatus.IN_PROGRESS, task.ownerId);
    task.changeProgressStatus(ProgressStatus.WAITING_FOR_REVIEW, task.ownerId);
    mockTaskRepository.addTask(task);

    // ユースケースの作成
    const useCase = new UpdateTaskProgressUseCase(mockTaskRepository);

    // 実行
    const result = await useCase.invoke({
      taskId: task.id,
      progressStatus: "完了",
      requesterId: task.ownerId,
    });

    // 検証
    expect(result.progressStatus.getValue()).toBe("完了");
    expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);
  });

  test("タスクの進捗ステータスをレビュー待ちから取組中に戻せる", async () => {
    // モックリポジトリの準備
    const mockTaskRepository = createMockTaskRepository();
    const task = createTestTask();

    // 初期状態をレビュー待ちに設定
    task.changeProgressStatus(ProgressStatus.IN_PROGRESS, task.ownerId);
    task.changeProgressStatus(ProgressStatus.WAITING_FOR_REVIEW, task.ownerId);
    mockTaskRepository.addTask(task);

    // ユースケースの作成
    const useCase = new UpdateTaskProgressUseCase(mockTaskRepository);

    // 実行
    const result = await useCase.invoke({
      taskId: task.id,
      progressStatus: "取組中",
      requesterId: task.ownerId,
    });

    // 検証
    expect(result.progressStatus.getValue()).toBe("取組中");
    expect(mockTaskRepository.save).toHaveBeenCalledTimes(1);
  });

  test("存在しないタスクIDを指定するとエラーになる", async () => {
    // モックリポジトリの準備
    const mockTaskRepository = createMockTaskRepository();

    // ユースケースの作成
    const useCase = new UpdateTaskProgressUseCase(mockTaskRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        taskId: "non-existent-id",
        progressStatus: "取組中",
        requesterId: "owner-1",
      }),
    ).rejects.toThrow(UpdateTaskProgressUseCaseNotFoundError);
  });

  test("無効な進捗ステータスを指定するとエラーになる", async () => {
    // モックリポジトリの準備
    const mockTaskRepository = createMockTaskRepository();
    const task = createTestTask();
    mockTaskRepository.addTask(task);

    // ユースケースの作成
    const useCase = new UpdateTaskProgressUseCase(mockTaskRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        taskId: task.id,
        progressStatus: "無効なステータス",
        requesterId: task.ownerId,
      }),
    ).rejects.toThrow(UpdateTaskProgressUseCaseInvalidStatusError);
  });

  test("タスクの所有者でない場合はエラーになる", async () => {
    // モックリポジトリの準備
    const mockTaskRepository = createMockTaskRepository();
    const task = createTestTask();
    mockTaskRepository.addTask(task);

    // ユースケースの作成
    const useCase = new UpdateTaskProgressUseCase(mockTaskRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        taskId: task.id,
        progressStatus: "取組中",
        requesterId: "different-owner",
      }),
    ).rejects.toThrow(UpdateTaskProgressUseCaseInvalidStatusError);
  });

  test("不正な状態遷移を試みるとエラーになる", async () => {
    // モックリポジトリの準備
    const mockTaskRepository = createMockTaskRepository();
    const task = createTestTask();
    mockTaskRepository.addTask(task);

    // ユースケースの作成
    const useCase = new UpdateTaskProgressUseCase(mockTaskRepository);

    // 実行と検証（未着手から完了への直接遷移は不可）
    await expect(
      useCase.invoke({
        taskId: task.id,
        progressStatus: "完了",
        requesterId: task.ownerId,
      }),
    ).rejects.toThrow(UpdateTaskProgressUseCaseInvalidStatusError);
  });

  test("タスクの保存に失敗するとエラーになる", async () => {
    // モックリポジトリの準備
    const mockTaskRepository = createMockTaskRepository();
    const task = createTestTask();
    mockTaskRepository.addTask(task);

    // 保存時にエラーを返すようにモックを設定
    mockTaskRepository.save.mockImplementationOnce(async () => {
      return err(new Error("保存エラー"));
    });

    // ユースケースの作成
    const useCase = new UpdateTaskProgressUseCase(mockTaskRepository);

    // 実行と検証
    await expect(
      useCase.invoke({
        taskId: task.id,
        progressStatus: "取組中",
        requesterId: task.ownerId,
      }),
    ).rejects.toThrow(UpdateTaskProgressUseCaseError);
  });
});
