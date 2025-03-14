export type GetTasksByOwnerIdQueryServiceInput = {
  ownerId: string;
};

export type GetTasksByOwnerIdQueryServicePayload = Array<{
  id: string;
  title: string;
  ownerId: string;
  progressStatus: string;
}>;

export interface GetTasksByOwnerIdQueryServiceInterface {
  invoke: (
    input: GetTasksByOwnerIdQueryServiceInput,
  ) => Promise<GetTasksByOwnerIdQueryServicePayload>;
}
