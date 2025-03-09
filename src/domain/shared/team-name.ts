import { type Result, err, ok } from "./result";

/**
 * チーム名を表す値オブジェクト
 * 不変性を持ち、値に基づく同一性を持つ
 */
export class TeamName {
  /**
   * プライベートコンストラクタ
   * インスタンス生成はcreateメソッドを使用する
   */
  private constructor(private readonly value: string) {}

  /**
   * チーム名の値オブジェクトを生成する
   * @param value チーム名文字列
   * @returns 生成結果
   */
  public static create(value: string): Result<TeamName, Error> {
    // 空文字チェック
    if (!value || value.trim() === "") {
      return err(new Error("チーム名は空にできません"));
    }

    // 英文字のみかチェック
    if (!/^[a-zA-Z]+$/.test(value)) {
      return err(new Error("チーム名は英文字のみ使用できます"));
    }

    return ok(new TeamName(value));
  }

  /**
   * チーム名の値を取得する
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * 等価性を比較する
   * @param other 比較対象のTeamName
   * @returns 等しい場合はtrue、そうでない場合はfalse
   */
  public equals(other: TeamName): boolean {
    return this.value === other.value;
  }
}
