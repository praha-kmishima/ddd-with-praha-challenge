export type TeamQueryServiceInput = {
  id: string;
};

export type TeamQueryServicePayload = {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
};

export interface TeamQueryServiceInterface {
  invoke: (
    input: TeamQueryServiceInput,
  ) => Promise<TeamQueryServicePayload | undefined>;
}
