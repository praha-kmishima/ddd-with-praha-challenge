import type { TeamRepository } from "../../domain/team/team-repository";

export type GetTeamByIdUseCaseInput = {
  teamId: string;
};

export type GetTeamByIdUseCasePayload = {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
};

export class GetTeamByIdUseCaseError extends Error {
  public override readonly name = "GetTeamByIdUseCaseError";
  public constructor() {
    super("チーム情報の取得に失敗しました");
  }
}

export class GetTeamByIdUseCaseTeamNotFoundError extends Error {
  public override readonly name = "GetTeamByIdUseCaseTeamNotFoundError";
  public constructor() {
    super("指定されたチームが見つかりません");
  }
}

export class GetTeamByIdUseCase {
  public constructor(private readonly teamRepository: TeamRepository) {}

  public async invoke(
    input: GetTeamByIdUseCaseInput,
  ): Promise<GetTeamByIdUseCasePayload> {
    // チームの取得
    const teamResult = await this.teamRepository.findById(input.teamId);
    if (!teamResult.ok) {
      throw new GetTeamByIdUseCaseError();
    }

    const team = teamResult.value;
    if (!team) {
      throw new GetTeamByIdUseCaseTeamNotFoundError();
    }

    // 結果の返却
    return {
      id: team.getId(),
      name: team.getName().getValue(),
      members: team.getMembers().map((member) => ({
        id: member.getId(),
        name: member.getName(),
        email: member.getEmail().getValue(),
        status: member.getStatus().getValue(),
      })),
    };
  }
}
