import type { ProgressStatus } from "../../domain/shared/progress-status";
import type { TaskRepositoryInterface } from "../../domain/task/task-repository";

export type EditTaskTitleUseCaseInput = {
  taskId: string;
  title: string;
};

export type EditTaskTitleUseCasePayload = {
  id: string;
  title: string;
  ownerId: string;
  progressStatus: ProgressStatus;
};

export class EditTaskTitleUseCaseNotFoundError extends Error {
  public override readonly name = "EditTaskTitleUseCaseNotFoundError";

  public constructor() {
    super("task not found");
  }
}

export class EditTaskTitleUseCaseError extends Error {
  public override readonly name = "EditTaskTitleUseCaseError";

  public constructor() {
    super("タスクのタイトルの編集に失敗しました");
  }
}
export class EditTaskTitleUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: EditTaskTitleUseCaseInput,
  ): Promise<EditTaskTitleUseCasePayload> {
    const task = await this.taskRepository.findById(input.taskId);
    if (!task.ok) {
      throw new EditTaskTitleUseCaseNotFoundError();
    }

    if (!task.value) {
      throw new EditTaskTitleUseCaseNotFoundError();
    }

    task.value.edit(input.title);

    const savedTask = await this.taskRepository.save(task.value);
    if (!savedTask.ok) {
      throw new EditTaskTitleUseCaseError();
    }

    return {
      id: savedTask.value.id,
      title: savedTask.value.title,
      ownerId: savedTask.value.ownerId,
      progressStatus: savedTask.value.progressStatus,
    };
  }
}
