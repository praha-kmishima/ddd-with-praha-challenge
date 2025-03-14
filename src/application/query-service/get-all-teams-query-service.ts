export type GetAllTeamsQueryServicePayload = {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
}[];

export interface GetAllTeamsQueryServiceInterface {
  invoke: () => Promise<GetAllTeamsQueryServicePayload>;
}
