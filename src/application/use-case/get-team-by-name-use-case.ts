import { TeamName } from "../../domain/shared/team-name";
import type { TeamRepository } from "../../domain/team/team-repository";

export type GetTeamByNameUseCaseInput = {
  teamName: string;
};

export type GetTeamByNameUseCasePayload = {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
};

export class GetTeamByNameUseCaseError extends Error {
  public override readonly name = "GetTeamByNameUseCaseError";
  public constructor() {
    super("チーム情報の取得に失敗しました");
  }
}

export class GetTeamByNameUseCaseInvalidNameError extends Error {
  public override readonly name = "GetTeamByNameUseCaseInvalidNameError";

  public static create(message: string): GetTeamByNameUseCaseInvalidNameError {
    const error = new GetTeamByNameUseCaseInvalidNameError();
    error.message = message;
    return error;
  }
}

export class GetTeamByNameUseCaseTeamNotFoundError extends Error {
  public override readonly name = "GetTeamByNameUseCaseTeamNotFoundError";
  public constructor() {
    super("指定されたチーム名のチームが見つかりません");
  }
}

export class GetTeamByNameUseCase {
  public constructor(private readonly teamRepository: TeamRepository) {}

  public async invoke(
    input: GetTeamByNameUseCaseInput,
  ): Promise<GetTeamByNameUseCasePayload> {
    // チーム名の値オブジェクト作成
    const teamNameResult = TeamName.create(input.teamName);
    if (!teamNameResult.ok) {
      throw GetTeamByNameUseCaseInvalidNameError.create(
        teamNameResult.error.message,
      );
    }

    // チームの取得
    const teamResult = await this.teamRepository.findByName(
      teamNameResult.value,
    );
    if (!teamResult.ok) {
      throw new GetTeamByNameUseCaseError();
    }

    const team = teamResult.value;
    if (!team) {
      throw new GetTeamByNameUseCaseTeamNotFoundError();
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
