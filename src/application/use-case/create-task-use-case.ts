import type { ProgressStatus } from "../../domain/shared/progress-status";
import { Task } from "../../domain/task/task";
import type { TaskRepositoryInterface } from "../../domain/task/task-repository";

export type CreateTaskUseCaseInput = {
  title: string;
  ownerId: string;
};

export type CreateTaskUseCasePayload = {
  id: string;
  title: string;
  ownerId: string;
  progressStatus: ProgressStatus;
};

export class CreateTaskUseCaseError extends Error {
  public override readonly name = "CreateTaskUseCaseError";

  public constructor() {
    super("タスクの作成に失敗しました");
  }
}
export class CreateTaskUseCase {
  public constructor(
    private readonly taskRepository: TaskRepositoryInterface,
  ) {}

  public async invoke(
    input: CreateTaskUseCaseInput,
  ): Promise<CreateTaskUseCasePayload> {
    const task = new Task({
      title: input.title,
      ownerId: input.ownerId,
    });

    const savedTask = await this.taskRepository.save(task);
    if (!savedTask.ok) {
      throw new CreateTaskUseCaseError();
    }

    return {
      id: savedTask.value.id,
      title: savedTask.value.title,
      ownerId: savedTask.value.ownerId,
      progressStatus: savedTask.value.progressStatus,
    };
  }
}
