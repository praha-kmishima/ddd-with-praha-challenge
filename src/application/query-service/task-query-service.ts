export type TaskQueryServiceInput = {
  id: string;
};

export type TaskQueryServicePayload = {
  id: string;
  title: string;
  ownerId: string;
  progressStatus: string;
};

export interface TaskQueryServiceInterface {
  invoke: (
    input: TaskQueryServiceInput,
  ) => Promise<TaskQueryServicePayload | undefined>;
}
