import { TeamName } from "../../domain/shared/team-name";
import { Team } from "../../domain/team/team";
import type { TeamRepository } from "../../domain/team/team-repository";

export type CreateTeamUseCaseInput = {
  name: string; // チーム名（英文字のみ）
};

export type CreateTeamUseCasePayload = {
  id: string;
  name: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
};

export class CreateTeamUseCaseError extends Error {
  public override readonly name = "CreateTeamUseCaseError";
  public constructor() {
    super("チームの作成に失敗しました");
  }
}

export class CreateTeamUseCaseNameExistsError extends Error {
  public override readonly name = "CreateTeamUseCaseNameExistsError";
  public constructor() {
    super("指定されたチーム名は既に使用されています");
  }
}

export class CreateTeamUseCaseInvalidNameError extends Error {
  public override readonly name = "CreateTeamUseCaseInvalidNameError";

  public static create(message: string): CreateTeamUseCaseInvalidNameError {
    const error = new CreateTeamUseCaseInvalidNameError();
    error.message = message;
    return error;
  }
}

export class CreateTeamUseCase {
  public constructor(private readonly teamRepository: TeamRepository) {}

  public async invoke(
    input: CreateTeamUseCaseInput,
  ): Promise<CreateTeamUseCasePayload> {
    // チーム名の値オブジェクト作成
    const teamNameResult = TeamName.create(input.name);
    if (!teamNameResult.ok) {
      throw CreateTeamUseCaseInvalidNameError.create(
        teamNameResult.error.message,
      );
    }

    // チーム名の一意性確認
    const existsResult = await this.teamRepository.exists(teamNameResult.value);
    if (!existsResult.ok) {
      throw new CreateTeamUseCaseError();
    }

    if (existsResult.value) {
      throw new CreateTeamUseCaseNameExistsError();
    }

    // チームエンティティの作成
    const teamResult = Team.create({
      name: teamNameResult.value,
    });

    if (!teamResult.ok) {
      throw new CreateTeamUseCaseError();
    }

    // チームの永続化
    const saveResult = await this.teamRepository.save(teamResult.value);
    if (!saveResult.ok) {
      throw new CreateTeamUseCaseError();
    }

    // 結果の返却
    return {
      id: teamResult.value.getId(),
      name: teamResult.value.getName().getValue(),
      members: teamResult.value.getMembers().map((member) => ({
        id: member.getId(),
        name: member.getName(),
        email: member.getEmail().getValue(),
        status: member.getStatus().getValue(),
      })),
    };
  }
}
