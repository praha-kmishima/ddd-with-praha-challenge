import { describe, expect, test, vi } from "vitest";
import type { GetTasksByOwnerIdQueryServiceInterface } from "../get-tasks-by-owner-id-query-service";

describe("GetTasksByOwnerIdQueryService", () => {
  test("所有者IDに紐づくタスク一覧を取得できる", async () => {
    // モックデータ
    const mockTasks = [
      {
        id: "task-1",
        title: "タスク1",
        ownerId: "owner-1",
        progressStatus: "未着手",
      },
      {
        id: "task-2",
        title: "タスク2",
        ownerId: "owner-1",
        progressStatus: "取組中",
      },
    ];

    // モックサービス
    const mockService: GetTasksByOwnerIdQueryServiceInterface = {
      invoke: vi.fn().mockResolvedValue(mockTasks),
    };

    const result = await mockService.invoke({ ownerId: "owner-1" });

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("task-1");
    expect(result[1]?.id).toBe("task-2");
    expect(mockService.invoke).toHaveBeenCalledWith({ ownerId: "owner-1" });
  });

  test("所有者IDに紐づくタスクが存在しない場合、空配列を返す", async () => {
    // モックサービス
    const mockService: GetTasksByOwnerIdQueryServiceInterface = {
      invoke: vi.fn().mockResolvedValue([]),
    };

    const result = await mockService.invoke({ ownerId: "non-existent-owner" });

    expect(result).toHaveLength(0);
    expect(mockService.invoke).toHaveBeenCalledWith({
      ownerId: "non-existent-owner",
    });
  });
});
