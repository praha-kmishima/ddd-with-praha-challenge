import { ProgressStatus } from "../../domain/shared/progress-status";
import type { TaskRepositoryInterface } from "../../domain/task/task-repository";

export type UpdateTaskProgressUseCaseInput = {
  taskId: string;
  progressStatus: string; // "未着手", "取組中", "レビュー待ち", "完了"のいずれか
  requesterId: string; // リクエスト者のID（所有者チェック用）
};

export type UpdateTaskProgressUseCasePayload = {
  id: string;
  title: string;
  ownerId: string;
  progressStatus: ProgressStatus;
};

export class UpdateTaskProgressUseCaseNotFoundError extends Error {
  public override readonly name = "UpdateTaskProgressUseCaseNotFoundError";
  public constructor() {
    super("task not found");
  }
}

export class UpdateTaskProgressUseCaseInvalidStatusError extends Error {
  public override readonly name = "UpdateTaskProgressUseCaseInvalidStatusError";

  public static create(
    message: string,
  ): UpdateTaskProgressUseCaseInvalidStatusError {
    const error = new UpdateTaskProgressUseCaseInvalidStatusError();
    error.message = message;
    return error;
  }
}

export class UpdateTaskProgressUseCaseError extends Error {
  public override readonly name = "UpdateTaskProgressUseCaseError";
  public constructor() {
    super("タスクの進捗ステータスの更新に失敗しました");
  }
}

export class UpdateTaskProgressUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: UpdateTaskProgressUseCaseInput,
  ): Promise<UpdateTaskProgressUseCasePayload> {
    // タスクの取得
    const taskResult = await this.taskRepository.findById(input.taskId);
    if (!taskResult.ok) {
      throw new UpdateTaskProgressUseCaseNotFoundError();
    }

    const task = taskResult.value;
    if (!task) {
      throw new UpdateTaskProgressUseCaseNotFoundError();
    }

    // 進捗ステータスの生成
    const progressStatusResult = ProgressStatus.create(input.progressStatus);
    if (!progressStatusResult.ok) {
      throw UpdateTaskProgressUseCaseInvalidStatusError.create(
        progressStatusResult.error.message,
      );
    }

    // 進捗ステータスの変更
    const changeResult = task.changeProgressStatus(
      progressStatusResult.value,
      input.requesterId,
    );

    if (!changeResult.ok) {
      throw UpdateTaskProgressUseCaseInvalidStatusError.create(
        changeResult.error.message,
      );
    }

    // タスクの保存
    const savedTaskResult = await this.taskRepository.save(task);
    if (!savedTaskResult.ok) {
      throw new UpdateTaskProgressUseCaseError();
    }

    // 結果の返却
    return {
      id: savedTaskResult.value.id,
      title: savedTaskResult.value.title,
      ownerId: savedTaskResult.value.ownerId,
      progressStatus: savedTaskResult.value.progressStatus,
    };
  }
}
