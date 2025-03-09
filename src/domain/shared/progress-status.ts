import { type Result, err, ok } from "./result";

/**
 * 課題の進捗状態を表す値オブジェクト
 * 不変性を持ち、値に基づく同一性を持つ
 */
export class ProgressStatus {
  /**
   * 未着手の状態
   */
  public static readonly NOT_STARTED = new ProgressStatus("未着手");

  /**
   * 取組中の状態
   */
  public static readonly IN_PROGRESS = new ProgressStatus("取組中");

  /**
   * レビュー待ちの状態
   */
  public static readonly WAITING_FOR_REVIEW = new ProgressStatus(
    "レビュー待ち",
  );

  /**
   * 完了の状態
   */
  public static readonly COMPLETED = new ProgressStatus("完了");

  /**
   * プライベートコンストラクタ
   * インスタンス生成はcreateメソッドまたは定数を使用する
   */
  private constructor(
    private readonly value: "未着手" | "取組中" | "レビュー待ち" | "完了",
  ) {}

  /**
   * 進捗状態の値オブジェクトを生成する
   * @param value 進捗状態の文字列
   * @returns 生成結果
   */
  public static create(value: string): Result<ProgressStatus, Error> {
    switch (value) {
      case "未着手":
        return ok(ProgressStatus.NOT_STARTED);
      case "取組中":
        return ok(ProgressStatus.IN_PROGRESS);
      case "レビュー待ち":
        return ok(ProgressStatus.WAITING_FOR_REVIEW);
      case "完了":
        return ok(ProgressStatus.COMPLETED);
      default:
        return err(
          new Error(
            "無効な進捗状態です。「未着手」「取組中」「レビュー待ち」「完了」のいずれかを指定してください。",
          ),
        );
    }
  }

  /**
   * 進捗状態の値を取得する
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * 等価性を比較する
   * @param other 比較対象のProgressStatus
   * @returns 等しい場合はtrue、そうでない場合はfalse
   */
  public equals(other: ProgressStatus): boolean {
    return this.value === other.value;
  }

  /**
   * 指定された状態に遷移可能かどうかを判定する
   * @param newStatus 遷移先の状態
   * @returns 遷移可能な場合はtrue、そうでない場合はfalse
   */
  public canTransitionTo(newStatus: ProgressStatus): boolean {
    // 同じ状態への遷移は常に可能
    if (this.equals(newStatus)) {
      return true;
    }

    // 未着手 → 取組中のみ可能
    if (this.equals(ProgressStatus.NOT_STARTED)) {
      return newStatus.equals(ProgressStatus.IN_PROGRESS);
    }

    // 取組中 → レビュー待ちのみ可能
    if (this.equals(ProgressStatus.IN_PROGRESS)) {
      return newStatus.equals(ProgressStatus.WAITING_FOR_REVIEW);
    }

    // レビュー待ち → 取組中または完了が可能
    if (this.equals(ProgressStatus.WAITING_FOR_REVIEW)) {
      return (
        newStatus.equals(ProgressStatus.IN_PROGRESS) ||
        newStatus.equals(ProgressStatus.COMPLETED)
      );
    }

    // 完了 → 変更不可
    if (this.equals(ProgressStatus.COMPLETED)) {
      return false;
    }

    return false;
  }
}
