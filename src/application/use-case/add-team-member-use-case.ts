import { TeamMember } from "../../domain/team/team-member";
import type { TeamRepository } from "../../domain/team/team-repository";

export type AddTeamMemberUseCaseInput = {
  teamId: string;
  memberName: string;
  memberEmail: string;
};

export type AddTeamMemberUseCasePayload = {
  teamId: string;
  teamName: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
};

export class AddTeamMemberUseCaseError extends Error {
  public override readonly name = "AddTeamMemberUseCaseError";
  public constructor() {
    super("チームメンバーの追加に失敗しました");
  }
}

export class AddTeamMemberUseCaseTeamNotFoundError extends Error {
  public override readonly name = "AddTeamMemberUseCaseTeamNotFoundError";
  public constructor() {
    super("指定されたチームが見つかりません");
  }
}

export class AddTeamMemberUseCaseInvalidMemberError extends Error {
  public override readonly name = "AddTeamMemberUseCaseInvalidMemberError";

  public static create(
    message: string,
  ): AddTeamMemberUseCaseInvalidMemberError {
    const error = new AddTeamMemberUseCaseInvalidMemberError();
    error.message = message;
    return error;
  }
}

export class AddTeamMemberUseCaseTeamSizeError extends Error {
  public override readonly name = "AddTeamMemberUseCaseTeamSizeError";
  public constructor() {
    super("チームのサイズ制約により、メンバーを追加できません");
  }
}

export class AddTeamMemberUseCaseMemberAlreadyExistsError extends Error {
  public override readonly name =
    "AddTeamMemberUseCaseMemberAlreadyExistsError";
  public constructor() {
    super("指定されたメンバーは既にチームに所属しています");
  }
}

export class AddTeamMemberUseCase {
  public constructor(private readonly teamRepository: TeamRepository) {}

  public async invoke(
    input: AddTeamMemberUseCaseInput,
  ): Promise<AddTeamMemberUseCasePayload> {
    // チームの取得
    const teamResult = await this.teamRepository.findById(input.teamId);
    if (!teamResult.ok) {
      throw new AddTeamMemberUseCaseError();
    }

    const team = teamResult.value;
    if (!team) {
      throw new AddTeamMemberUseCaseTeamNotFoundError();
    }

    // チームメンバーの作成
    const memberResult = TeamMember.create({
      name: input.memberName,
      email: input.memberEmail,
    });

    if (!memberResult.ok) {
      throw AddTeamMemberUseCaseInvalidMemberError.create(
        memberResult.error.message,
      );
    }

    // チームにメンバーを追加
    const addResult = team.addMember(memberResult.value);
    if (!addResult.ok) {
      // エラーメッセージに基づいて適切なエラーを投げる
      const errorMessage = addResult.error.message;

      if (errorMessage.includes("既にチームに所属している")) {
        throw new AddTeamMemberUseCaseMemberAlreadyExistsError();
      }

      if (errorMessage.includes("チームのサイズ")) {
        throw new AddTeamMemberUseCaseTeamSizeError();
      }

      throw AddTeamMemberUseCaseInvalidMemberError.create(errorMessage);
    }

    // チームの保存
    const saveResult = await this.teamRepository.save(team);
    if (!saveResult.ok) {
      throw new AddTeamMemberUseCaseError();
    }

    // 結果の返却
    return {
      teamId: team.getId(),
      teamName: team.getName().getValue(),
      members: team.getMembers().map((member) => ({
        id: member.getId(),
        name: member.getName(),
        email: member.getEmail().getValue(),
        status: member.getStatus().getValue(),
      })),
    };
  }
}
