import { EnrollmentStatus } from "../../domain/shared/enrollment-status";
import type { TeamRepository } from "../../domain/team/team-repository";

export type ChangeTeamMemberStatusUseCaseInput = {
  teamId: string;
  memberId: string;
  newStatus: string; // 在籍中、休会中、退会済のいずれか
};

export type ChangeTeamMemberStatusUseCasePayload = {
  teamId: string;
  teamName: string;
  members: {
    id: string;
    name: string;
    email: string;
    status: string;
  }[];
};

export class ChangeTeamMemberStatusUseCaseError extends Error {
  public override readonly name = "ChangeTeamMemberStatusUseCaseError";
  public constructor() {
    super("チームメンバーの在籍状態変更に失敗しました");
  }
}

export class ChangeTeamMemberStatusUseCaseTeamNotFoundError extends Error {
  public override readonly name =
    "ChangeTeamMemberStatusUseCaseTeamNotFoundError";
  public constructor() {
    super("指定されたチームが見つかりません");
  }
}

export class ChangeTeamMemberStatusUseCaseMemberNotFoundError extends Error {
  public override readonly name =
    "ChangeTeamMemberStatusUseCaseMemberNotFoundError";
  public constructor() {
    super("指定されたメンバーはチームに所属していません");
  }
}

export class ChangeTeamMemberStatusUseCaseInvalidStatusError extends Error {
  public override readonly name =
    "ChangeTeamMemberStatusUseCaseInvalidStatusError";

  public static create(
    message: string,
  ): ChangeTeamMemberStatusUseCaseInvalidStatusError {
    const error = new ChangeTeamMemberStatusUseCaseInvalidStatusError();
    error.message = message;
    return error;
  }
}

export class ChangeTeamMemberStatusUseCaseInvalidTransitionError extends Error {
  public override readonly name =
    "ChangeTeamMemberStatusUseCaseInvalidTransitionError";

  public static create(
    message: string,
  ): ChangeTeamMemberStatusUseCaseInvalidTransitionError {
    const error = new ChangeTeamMemberStatusUseCaseInvalidTransitionError();
    error.message = message;
    return error;
  }
}

export class ChangeTeamMemberStatusUseCase {
  public constructor(private readonly teamRepository: TeamRepository) {}

  public async invoke(
    input: ChangeTeamMemberStatusUseCaseInput,
  ): Promise<ChangeTeamMemberStatusUseCasePayload> {
    // 新しい在籍状態の値オブジェクト作成
    const newStatusResult = EnrollmentStatus.create(input.newStatus);
    if (!newStatusResult.ok) {
      throw ChangeTeamMemberStatusUseCaseInvalidStatusError.create(
        newStatusResult.error.message,
      );
    }

    // チームの取得
    const teamResult = await this.teamRepository.findById(input.teamId);
    if (!teamResult.ok) {
      throw new ChangeTeamMemberStatusUseCaseError();
    }

    const team = teamResult.value;
    if (!team) {
      throw new ChangeTeamMemberStatusUseCaseTeamNotFoundError();
    }

    // チームメンバーの在籍状態を変更
    const changeResult = team.changeMemberStatus(
      input.memberId,
      newStatusResult.value,
    );
    if (!changeResult.ok) {
      // エラーメッセージに基づいて適切なエラーを投げる
      const errorMessage = changeResult.error.message;

      if (
        errorMessage.includes("指定されたメンバーはチームに所属していません")
      ) {
        throw new ChangeTeamMemberStatusUseCaseMemberNotFoundError();
      }

      if (
        errorMessage.includes("在籍状態を") &&
        errorMessage.includes("に変更することはできません")
      ) {
        throw ChangeTeamMemberStatusUseCaseInvalidTransitionError.create(
          errorMessage,
        );
      }

      throw new ChangeTeamMemberStatusUseCaseError();
    }

    // チームの保存
    const saveResult = await this.teamRepository.save(team);
    if (!saveResult.ok) {
      throw new ChangeTeamMemberStatusUseCaseError();
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
