export type TaskListQueryServicePayload = Array<{
  id: string;
  title: string;
  ownerId: string;
  progressStatus: string;
}>;

export interface TaskListQueryServiceInterface {
  invoke: () => Promise<TaskListQueryServicePayload>;
}
