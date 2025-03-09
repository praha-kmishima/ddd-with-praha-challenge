import { type Result, err, ok } from "./result";

/**
 * 参加者の在籍状態を表す値オブジェクト
 * 不変性を持ち、値に基づく同一性を持つ
 */
export class EnrollmentStatus {
  /**
   * 在籍中の状態
   */
  public static readonly ACTIVE = new EnrollmentStatus("在籍中");

  /**
   * 休会中の状態
   */
  public static readonly INACTIVE = new EnrollmentStatus("休会中");

  /**
   * 退会済の状態
   */
  public static readonly WITHDRAWN = new EnrollmentStatus("退会済");

  /**
   * プライベートコンストラクタ
   * インスタンス生成はcreateメソッドまたは定数を使用する
   */
  private constructor(private readonly value: "在籍中" | "休会中" | "退会済") {}

  /**
   * 在籍状態の値オブジェクトを生成する
   * @param value 在籍状態の文字列
   * @returns 生成結果
   */
  public static create(value: string): Result<EnrollmentStatus, Error> {
    switch (value) {
      case "在籍中":
        return ok(EnrollmentStatus.ACTIVE);
      case "休会中":
        return ok(EnrollmentStatus.INACTIVE);
      case "退会済":
        return ok(EnrollmentStatus.WITHDRAWN);
      default:
        return err(
          new Error(
            "無効な在籍状態です。「在籍中」「休会中」「退会済」のいずれかを指定してください。",
          ),
        );
    }
  }

  /**
   * 在籍状態の値を取得する
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * 等価性を比較する
   * @param other 比較対象のEnrollmentStatus
   * @returns 等しい場合はtrue、そうでない場合はfalse
   */
  public equals(other: EnrollmentStatus): boolean {
    return this.value === other.value;
  }

  /**
   * 指定された状態に遷移可能かどうかを判定する
   * @param newStatus 遷移先の状態
   * @returns 遷移可能な場合はtrue、そうでない場合はfalse
   */
  public canTransitionTo(newStatus: EnrollmentStatus): boolean {
    // 同じ状態への遷移は常に可能
    if (this.equals(newStatus)) {
      return true;
    }

    // 在籍中 → 休会中、退会済
    if (this.equals(EnrollmentStatus.ACTIVE)) {
      return (
        newStatus.equals(EnrollmentStatus.INACTIVE) ||
        newStatus.equals(EnrollmentStatus.WITHDRAWN)
      );
    }

    // 休会中 → 在籍中、退会済
    if (this.equals(EnrollmentStatus.INACTIVE)) {
      return (
        newStatus.equals(EnrollmentStatus.ACTIVE) ||
        newStatus.equals(EnrollmentStatus.WITHDRAWN)
      );
    }

    // 退会済 → 在籍中
    if (this.equals(EnrollmentStatus.WITHDRAWN)) {
      return newStatus.equals(EnrollmentStatus.ACTIVE);
    }

    return false;
  }

  /**
   * チームに所属可能かどうかを判定する
   * @returns 所属可能な場合はtrue、そうでない場合はfalse
   */
  public canJoinTeam(): boolean {
    return this.equals(EnrollmentStatus.ACTIVE);
  }
}
