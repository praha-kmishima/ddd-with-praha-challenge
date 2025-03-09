import { ProgressStatus } from "../../domain/shared/progress-status";
import type { TaskRepositoryInterface } from "../../domain/task/task-repository";

export type SetTaskDoneUseCaseInput = {
  taskId: string;
};

export type SetTaskDoneUseCasePayload = {
  id: string;
  title: string;
  ownerId: string;
  progressStatus: ProgressStatus;
};

export class SetTaskDoneUseCaseNotFoundError extends Error {
  public override readonly name = "SetTaskDoneUseCaseNotFoundError";

  public constructor() {
    super("task not found");
  }
}

export class SetTaskDoneUseCaseError extends Error {
  public override readonly name = "SetTaskDoneUseCaseError";

  public constructor() {
    super("タスクの完了に失敗しました");
  }
}
export class SetTaskDoneUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: SetTaskDoneUseCaseInput,
  ): Promise<SetTaskDoneUseCasePayload> {
    const task = await this.taskRepository.findById(input.taskId);
    if (!task.ok) {
      throw new SetTaskDoneUseCaseNotFoundError();
    }

    if (!task.value) {
      throw new SetTaskDoneUseCaseNotFoundError();
    }

    task.value.changeProgressStatus(
      ProgressStatus.COMPLETED,
      task.value.ownerId,
    );

    const savedTask = await this.taskRepository.save(task.value);
    if (!savedTask.ok) {
      throw new SetTaskDoneUseCaseError();
    }

    return {
      id: savedTask.value.id,
      title: savedTask.value.title,
      ownerId: savedTask.value.ownerId,
      progressStatus: savedTask.value.progressStatus,
    };
  }
}
