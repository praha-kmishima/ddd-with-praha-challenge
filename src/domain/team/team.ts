import { ulid } from "../../libs/ulid";
import type { EnrollmentStatus } from "../shared/enrollment-status";
import { type Result, err, ok } from "../shared/result";
import type { TeamName } from "../shared/team-name";
import type { TeamMember } from "./team-member";

/**
 * チームを表すエンティティ
 * チーム集約のルートエンティティとして位置づけられる
 */
export class Team {
  /**
   * プライベートコンストラクタ
   * インスタンス生成はcreateメソッドを使用する
   */
  private constructor(
    private readonly id: string,
    private readonly name: TeamName,
    private members: TeamMember[],
  ) {}

  /**
   * チームを作成する
   * @param props チーム名
   * @returns 生成結果
   */
  public static create(props: {
    name: TeamName;
  }): Result<Team, Error> {
    return ok(
      new Team(
        ulid(),
        props.name,
        [], // 初期状態ではメンバーは空
      ),
    );
  }

  /**
   * 永続化されたデータからチームを復元する
   * @param props ID、チーム名、メンバー
   * @returns 生成結果
   */
  public static reconstruct(props: {
    id: string;
    name: TeamName;
    members: TeamMember[];
  }): Result<Team, Error> {
    const team = new Team(props.id, props.name, props.members);

    // チームサイズのバリデーション
    const validateResult = team.validateTeamSize();
    if (!validateResult.ok) {
      return err(validateResult.error);
    }

    return ok(team);
  }

  /**
   * IDを取得する
   */
  public getId(): string {
    return this.id;
  }

  /**
   * チーム名を取得する
   */
  public getName(): TeamName {
    return this.name;
  }

  /**
   * メンバー一覧を取得する
   */
  public getMembers(): TeamMember[] {
    return [...this.members]; // 配列のコピーを返して不変性を保つ
  }

  /**
   * メンバーを追加する
   * @param member 追加するメンバー
   * @returns 追加結果
   */
  public addMember(member: TeamMember): Result<void, Error> {
    // メンバーがチームに所属可能かチェック
    if (!member.canJoinTeam()) {
      return err(
        new Error(
          `在籍状態が${member.getStatus().getValue()}のメンバーはチームに所属できません`,
        ),
      );
    }

    // 既に同じメンバーが存在するかチェック
    const existingMemberIndex = this.members.findIndex((m) => m.equals(member));
    if (existingMemberIndex !== -1) {
      return err(new Error("既にチームに所属しているメンバーです"));
    }

    // メンバーを追加
    this.members.push(member);

    // チームサイズのバリデーション
    const validateResult = this.validateTeamSize();
    if (!validateResult.ok) {
      // 追加したメンバーを削除して元の状態に戻す
      this.members.pop();
      return err(validateResult.error);
    }

    return ok(undefined);
  }

  /**
   * メンバーを削除する
   * @param memberId 削除するメンバーのID
   * @returns 削除結果
   */
  public removeMember(memberId: string): Result<void, Error> {
    // 削除対象のメンバーが存在するかチェック
    const memberIndex = this.members.findIndex((m) => m.getId() === memberId);
    if (memberIndex === -1) {
      return err(new Error("指定されたメンバーはチームに所属していません"));
    }

    // メンバーを削除
    const removedMember = this.members[memberIndex];
    if (!removedMember) {
      return err(new Error("メンバーの取得に失敗しました"));
    }

    this.members.splice(memberIndex, 1);

    // チームサイズのバリデーション
    const validateResult = this.validateTeamSize();
    if (!validateResult.ok) {
      // 削除したメンバーを元に戻す
      this.members.splice(memberIndex, 0, removedMember);
      return err(validateResult.error);
    }

    return ok(undefined);
  }

  /**
   * メンバーの在籍状態を変更する
   * @param memberId 変更するメンバーのID
   * @param newStatus 新しい在籍状態
   * @returns 変更結果
   */
  public changeMemberStatus(
    memberId: string,
    newStatus: EnrollmentStatus,
  ): Result<void, Error> {
    // 変更対象のメンバーが存在するかチェック
    const memberIndex = this.members.findIndex((m) => m.getId() === memberId);
    if (memberIndex === -1) {
      return err(new Error("指定されたメンバーはチームに所属していません"));
    }

    // TypeScriptのエラーを回避するために、存在確認後に配列から取得
    const member = this.members[memberIndex];
    if (!member) {
      return err(new Error("メンバーの取得に失敗しました"));
    }

    // メンバーの在籍状態を変更
    const changeResult = member.changeStatus(newStatus);
    if (!changeResult.ok) {
      return err(changeResult.error);
    }

    // 在籍状態が「在籍中」でなくなった場合、チームから削除
    if (!member.canJoinTeam()) {
      return this.removeMember(memberId);
    }

    return ok(undefined);
  }

  /**
   * チームサイズが制約を満たしているかを検証する
   * @returns 検証結果
   */
  public validateTeamSize(): Result<void, Error> {
    const size = this.members.length;

    // チームサイズが0の場合は許容（新規作成時など）
    if (size === 0) {
      return ok(undefined);
    }

    // チームサイズが1の場合は許容（メンバー追加時など）
    if (size === 1) {
      return ok(undefined);
    }

    // チームサイズが4名を超える場合はエラー
    if (size > 4) {
      return err(new Error("チームのサイズは4名以下である必要があります"));
    }

    return ok(undefined);
  }

  /**
   * 等価性を比較する
   * @param other 比較対象のTeam
   * @returns 等しい場合はtrue、そうでない場合はfalse
   */
  public equals(other: Team): boolean {
    return this.id === other.id;
  }
}
