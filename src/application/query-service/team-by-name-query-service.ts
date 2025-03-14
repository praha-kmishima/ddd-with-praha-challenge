export type TeamByNameQueryServiceInput = {
  name: string;
};

export type TeamByNameQueryServicePayload = {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
};

export interface TeamByNameQueryServiceInterface {
  invoke: (
    input: TeamByNameQueryServiceInput,
  ) => Promise<TeamByNameQueryServicePayload | undefined>;
}
