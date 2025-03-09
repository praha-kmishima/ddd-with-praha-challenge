import { beforeEach, describe, expect, test } from "vitest";
import { ProgressStatus } from "../../domain/shared/progress-status";
import { type Result, err, ok } from "../../domain/shared/result";
import { Task } from "../../domain/task/task";
import type { TaskRepositoryInterface } from "../../domain/task/task-repository";
import { ulid } from "../../libs/ulid";

/**
 * TaskRepositoryインターフェースのモック実装
 * テスト用に最小限の機能を提供する
 */
class MockTaskRepository implements TaskRepositoryInterface {
  private tasks = new Map<string, Task>();
  private tasksByOwnerId = new Map<string, Task[]>();

  /**
   * リポジトリの状態をリセットする
   */
  reset(): void {
    this.tasks.clear();
    this.tasksByOwnerId.clear();
  }

  /**
   * タスクを保存する
   */
  async save(task: Task): Promise<Result<Task, Error>> {
    try {
      this.tasks.set(task.id, task);

      // 所有者IDとタスクの関連付けを更新
      const ownerTasks = this.tasksByOwnerId.get(task.ownerId) || [];
      const existingTaskIndex = ownerTasks.findIndex((t) => t.id === task.id);

      if (existingTaskIndex >= 0) {
        // 既存のタスクを更新
        ownerTasks[existingTaskIndex] = task;
      } else {
        // 新しいタスクを追加
        ownerTasks.push(task);
      }

      this.tasksByOwnerId.set(task.ownerId, ownerTasks);

      return ok(task);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error("Unknown error occurred while saving task"),
      );
    }
  }

  /**
   * IDによりタスクを検索する
   */
  async findById(id: string): Promise<Result<Task | null, Error>> {
    try {
      const task = this.tasks.get(id) || null;
      return ok(task);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error("Unknown error occurred while finding task"),
      );
    }
  }

  /**
   * 所有者IDによりタスクを検索する
   */
  async findByOwnerId(ownerId: string): Promise<Result<Task[], Error>> {
    try {
      const tasks = this.tasksByOwnerId.get(ownerId) || [];
      return ok([...tasks]); // 配列のコピーを返す
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error("Unknown error occurred while finding tasks by owner"),
      );
    }
  }
}

describe("TaskRepository", () => {
  // モックリポジトリのインスタンスを作成
  const repository = new MockTaskRepository();

  // 各テスト前にリポジトリをリセット
  beforeEach(() => {
    repository.reset();
  });

  describe("save", () => {
    test("タスクを保存できること", async () => {
      // タスクの作成
      const ownerId = ulid();
      const task = new Task({ title: "テストタスク", ownerId });

      // タスクの保存
      const saveResult = await repository.save(task);
      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      // 保存されたタスクの取得
      const findResult = await repository.findById(task.id);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したタスクの検証
      const savedTask = findResult.value;
      expect(savedTask).not.toBeNull();
      if (!savedTask) return;
      expect(savedTask.title).toBe("テストタスク");
      expect(savedTask.ownerId).toBe(ownerId);
      expect(savedTask.progressStatus.equals(ProgressStatus.NOT_STARTED)).toBe(
        true,
      );
    });

    test("タスクを更新できること", async () => {
      // タスクの作成と保存
      const ownerId = ulid();
      const task = new Task({ title: "元のタスク", ownerId });
      const saveResult = await repository.save(task);
      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      // 進捗ステータスの変更
      const changeResult = task.changeProgressStatus(
        ProgressStatus.IN_PROGRESS,
        ownerId,
      );
      expect(changeResult.ok).toBe(true);
      if (!changeResult.ok) return;

      // 更新されたタスクの保存
      const updateResult = await repository.save(task);
      expect(updateResult.ok).toBe(true);
      if (!updateResult.ok) return;

      // 更新されたタスクの取得
      const findResult = await repository.findById(task.id);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したタスクの検証
      const updatedTask = findResult.value;
      expect(updatedTask).not.toBeNull();
      if (!updatedTask) return;
      expect(
        updatedTask.progressStatus.equals(ProgressStatus.IN_PROGRESS),
      ).toBe(true);
    });
  });

  describe("findById", () => {
    test("IDによりタスクを検索できること", async () => {
      // タスクの作成と保存
      const ownerId = ulid();
      const task = new Task({ title: "検索用タスク", ownerId });
      const saveResult = await repository.save(task);
      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      // IDによる検索
      const findResult = await repository.findById(task.id);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したタスクの検証
      const foundTask = findResult.value;
      expect(foundTask).not.toBeNull();
      if (!foundTask) return;
      expect(foundTask.id).toBe(task.id);
      expect(foundTask.title).toBe("検索用タスク");
    });

    test("存在しないIDの場合はnullを返すこと", async () => {
      // 存在しないIDによる検索
      const findResult = await repository.findById("non-existent-id");
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 結果の検証
      expect(findResult.value).toBeNull();
    });
  });

  describe("findByOwnerId", () => {
    test("所有者IDによりタスクを検索できること", async () => {
      // 所有者IDの作成
      const ownerId = ulid();

      // タスク1の作成と保存
      const task1 = new Task({ title: "所有者タスク1", ownerId });
      const saveResult1 = await repository.save(task1);
      expect(saveResult1.ok).toBe(true);
      if (!saveResult1.ok) return;

      // タスク2の作成と保存
      const task2 = new Task({ title: "所有者タスク2", ownerId });
      const saveResult2 = await repository.save(task2);
      expect(saveResult2.ok).toBe(true);
      if (!saveResult2.ok) return;

      // 別の所有者のタスクの作成と保存
      const otherOwnerId = ulid();
      const otherTask = new Task({
        title: "別の所有者のタスク",
        ownerId: otherOwnerId,
      });
      const saveResult3 = await repository.save(otherTask);
      expect(saveResult3.ok).toBe(true);
      if (!saveResult3.ok) return;

      // 所有者IDによる検索
      const findResult = await repository.findByOwnerId(ownerId);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 結果の検証
      const tasks = findResult.value;
      expect(tasks.length).toBe(2);
      const taskTitles = tasks.map((t) => t.title).sort();
      expect(taskTitles).toEqual(["所有者タスク1", "所有者タスク2"]);
    });

    test("存在しない所有者IDの場合は空配列を返すこと", async () => {
      // 存在しない所有者IDによる検索
      const findResult = await repository.findByOwnerId(
        "non-existent-owner-id",
      );
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 結果の検証
      const tasks = findResult.value;
      expect(tasks.length).toBe(0);
    });
  });

  describe("進捗ステータスの変更", () => {
    test("タスクの進捗ステータスを変更して保存できること", async () => {
      // タスクの作成と保存
      const ownerId = ulid();
      const task = new Task({ title: "進捗変更タスク", ownerId });
      const saveResult = await repository.save(task);
      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      // 進捗ステータスの変更
      const changeResult = task.changeProgressStatus(
        ProgressStatus.IN_PROGRESS,
        ownerId,
      );
      expect(changeResult.ok).toBe(true);
      if (!changeResult.ok) return;

      // 変更後のタスクの保存
      const updateResult = await repository.save(task);
      expect(updateResult.ok).toBe(true);
      if (!updateResult.ok) return;

      // 保存されたタスクの取得
      const findResult = await repository.findById(task.id);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したタスクの検証
      const updatedTask = findResult.value;
      expect(updatedTask).not.toBeNull();
      if (!updatedTask) return;
      expect(
        updatedTask.progressStatus.equals(ProgressStatus.IN_PROGRESS),
      ).toBe(true);
    });

    test("複数回の進捗ステータス変更を保存できること", async () => {
      // タスクの作成と保存
      const ownerId = ulid();
      const task = new Task({ title: "複数回進捗変更タスク", ownerId });
      const saveResult = await repository.save(task);
      expect(saveResult.ok).toBe(true);
      if (!saveResult.ok) return;

      // 進捗ステータスの変更1: 未着手→取組中
      const changeResult1 = task.changeProgressStatus(
        ProgressStatus.IN_PROGRESS,
        ownerId,
      );
      expect(changeResult1.ok).toBe(true);
      if (!changeResult1.ok) return;

      // 変更後のタスクの保存1
      const updateResult1 = await repository.save(task);
      expect(updateResult1.ok).toBe(true);
      if (!updateResult1.ok) return;

      // 進捗ステータスの変更2: 取組中→レビュー待ち
      const changeResult2 = task.changeProgressStatus(
        ProgressStatus.WAITING_FOR_REVIEW,
        ownerId,
      );
      expect(changeResult2.ok).toBe(true);
      if (!changeResult2.ok) return;

      // 変更後のタスクの保存2
      const updateResult2 = await repository.save(task);
      expect(updateResult2.ok).toBe(true);
      if (!updateResult2.ok) return;

      // 保存されたタスクの取得
      const findResult = await repository.findById(task.id);
      expect(findResult.ok).toBe(true);
      if (!findResult.ok) return;

      // 取得したタスクの検証
      const updatedTask = findResult.value;
      expect(updatedTask).not.toBeNull();
      if (!updatedTask) return;
      expect(
        updatedTask.progressStatus.equals(ProgressStatus.WAITING_FOR_REVIEW),
      ).toBe(true);
    });
  });
});
