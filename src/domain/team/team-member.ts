import { ulid } from "../../libs/ulid";
import { EmailAddress } from "../shared/email-address";
import { EnrollmentStatus } from "../shared/enrollment-status";
import { type Result, err, ok } from "../shared/result";

/**
 * チームメンバー（参加者）を表すエンティティ
 * チーム集約内の子エンティティとして位置づけられる
 */
export class TeamMember {
  /**
   * プライベートコンストラクタ
   * インスタンス生成はcreateメソッドを使用する
   */
  private constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly email: EmailAddress,
    private status: EnrollmentStatus,
  ) {}

  /**
   * チームメンバーを作成する
   * @param props 名前とメールアドレス
   * @returns 生成結果
   */
  public static create(props: {
    name: string;
    email: string;
  }): Result<TeamMember, Error> {
    // 名前のバリデーション
    if (!props.name || props.name.trim() === "") {
      return err(new Error("名前は必須です"));
    }

    // メールアドレスのバリデーション
    const emailResult = EmailAddress.create(props.email);
    if (!emailResult.ok) {
      return err(emailResult.error);
    }

    // 新規作成時は在籍中状態で作成
    return ok(
      new TeamMember(
        ulid(),
        props.name,
        emailResult.value,
        EnrollmentStatus.ACTIVE,
      ),
    );
  }

  /**
   * 永続化されたデータからチームメンバーを復元する
   * @param props ID、名前、メールアドレス、在籍状態
   * @returns 生成結果
   */
  public static reconstruct(props: {
    id: string;
    name: string;
    email: string;
    status: string;
  }): Result<TeamMember, Error> {
    // メールアドレスのバリデーション
    const emailResult = EmailAddress.create(props.email);
    if (!emailResult.ok) {
      return err(emailResult.error);
    }

    // 在籍状態のバリデーション
    const statusResult = EnrollmentStatus.create(props.status);
    if (!statusResult.ok) {
      return err(statusResult.error);
    }

    return ok(
      new TeamMember(
        props.id,
        props.name,
        emailResult.value,
        statusResult.value,
      ),
    );
  }

  /**
   * IDを取得する
   */
  public getId(): string {
    return this.id;
  }

  /**
   * 名前を取得する
   */
  public getName(): string {
    return this.name;
  }

  /**
   * メールアドレスを取得する
   */
  public getEmail(): EmailAddress {
    return this.email;
  }

  /**
   * 在籍状態を取得する
   */
  public getStatus(): EnrollmentStatus {
    return this.status;
  }

  /**
   * 在籍状態を変更する
   * @param newStatus 新しい在籍状態
   * @returns 変更結果
   */
  public changeStatus(newStatus: EnrollmentStatus): Result<void, Error> {
    // 現在の状態から遷移可能かチェック
    if (!this.status.canTransitionTo(newStatus)) {
      return err(
        new Error(
          `在籍状態を${this.status.getValue()}から${newStatus.getValue()}に変更することはできません`,
        ),
      );
    }

    this.status = newStatus;
    return ok(undefined);
  }

  /**
   * チームに所属可能かどうかを判定する
   * @returns 所属可能な場合はtrue、そうでない場合はfalse
   */
  public canJoinTeam(): boolean {
    return this.status.canJoinTeam();
  }

  /**
   * 等価性を比較する
   * @param other 比較対象のTeamMember
   * @returns 等しい場合はtrue、そうでない場合はfalse
   */
  public equals(other: TeamMember): boolean {
    return this.id === other.id;
  }
}
