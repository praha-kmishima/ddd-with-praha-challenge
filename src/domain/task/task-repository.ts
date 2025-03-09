import type { Result } from "../shared/result";
import type { Task } from "./task";

export interface TaskRepositoryInterface {
  /**
   * タスクを保存する
   * @param task 保存するタスク
   * @returns 保存結果
   */
  save: (task: Task) => Promise<Result<Task, Error>>;

  /**
   * IDによりタスクを検索する
   * @param id タスクID
   * @returns 検索結果
   */
  findById(id: string): Promise<Result<Task | null, Error>>;

  /**
   * 所有者IDによりタスクを検索する
   * @param ownerId 所有者ID
   * @returns 検索結果
   */
  findByOwnerId(ownerId: string): Promise<Result<Task[], Error>>;
}
