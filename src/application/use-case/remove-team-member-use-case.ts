import type { TeamRepository } from "../../domain/team/team-repository";

export type RemoveTeamMemberUseCaseInput = {
  teamId: string;
  memberId: string;
};

export type RemoveTeamMemberUseCasePayload = {
  teamId: string;
  teamName: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
};

export class RemoveTeamMemberUseCaseError extends Error {
  public override readonly name = "RemoveTeamMemberUseCaseError";
  public constructor() {
    super("チームメンバーの削除に失敗しました");
  }
}

export class RemoveTeamMemberUseCaseTeamNotFoundError extends Error {
  public override readonly name = "RemoveTeamMemberUseCaseTeamNotFoundError";
  public constructor() {
    super("指定されたチームが見つかりません");
  }
}

export class RemoveTeamMemberUseCaseMemberNotFoundError extends Error {
  public override readonly name = "RemoveTeamMemberUseCaseMemberNotFoundError";
  public constructor() {
    super("指定されたメンバーはチームに所属していません");
  }
}

export class RemoveTeamMemberUseCaseTeamSizeError extends Error {
  public override readonly name = "RemoveTeamMemberUseCaseTeamSizeError";
  public constructor() {
    super("チームのサイズ制約により、メンバーを削除できません");
  }
}

export class RemoveTeamMemberUseCase {
  public constructor(private readonly teamRepository: TeamRepository) {}

  public async invoke(
    input: RemoveTeamMemberUseCaseInput,
  ): Promise<RemoveTeamMemberUseCasePayload> {
    // チームの取得
    const teamResult = await this.teamRepository.findById(input.teamId);
    if (!teamResult.ok) {
      throw new RemoveTeamMemberUseCaseError();
    }

    const team = teamResult.value;
    if (!team) {
      throw new RemoveTeamMemberUseCaseTeamNotFoundError();
    }

    // チームからメンバーを削除
    const removeResult = team.removeMember(input.memberId);
    if (!removeResult.ok) {
      // エラーメッセージに基づいて適切なエラーを投げる
      const errorMessage = removeResult.error.message;

      if (
        errorMessage.includes("指定されたメンバーはチームに所属していません")
      ) {
        throw new RemoveTeamMemberUseCaseMemberNotFoundError();
      }

      if (errorMessage.includes("チームのサイズ")) {
        throw new RemoveTeamMemberUseCaseTeamSizeError();
      }

      throw new RemoveTeamMemberUseCaseError();
    }

    // チームの保存
    const saveResult = await this.teamRepository.save(team);
    if (!saveResult.ok) {
      throw new RemoveTeamMemberUseCaseError();
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
