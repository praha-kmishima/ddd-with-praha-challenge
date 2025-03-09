export type TodoListQueryServicePayload = Array<{
  id: string;
  title: string;
}>;

export interface TodoListQueryServiceInterface {
  invoke: () => Promise<TodoListQueryServicePayload>;
}
