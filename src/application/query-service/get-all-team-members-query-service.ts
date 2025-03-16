export type GetAllTeamMembersQueryServicePayload = Array<{
  id: string;
  name: string;
  email: string;
  status: string;
  teamId: string;
}>;

export interface GetAllTeamMembersQueryServiceInterface {
  invoke: () => Promise<GetAllTeamMembersQueryServicePayload>;
}
