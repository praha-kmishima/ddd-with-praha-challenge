import { z } from "zod";
import { type Result, err, ok } from "./result";

/**
 * メールアドレスを表す値オブジェクト
 * 不変性を持ち、値に基づく同一性を持つ
 */
export class EmailAddress {
  /**
   * プライベートコンストラクタ
   * インスタンス生成はcreateメソッドを使用する
   */
  private constructor(private readonly value: string) {}

  /**
   * メールアドレスの値オブジェクトを生成する
   * @param value メールアドレス文字列
   * @returns 生成結果
   */
  public static create(value: string): Result<EmailAddress, Error> {
    try {
      // Zodを使用したバリデーション
      const validatedEmail = z.string().email().parse(value);
      return ok(new EmailAddress(validatedEmail));
    } catch (error) {
      return err(new Error("無効なメールアドレス形式です"));
    }
  }

  /**
   * メールアドレスの値を取得する
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * 等価性を比較する
   * @param other 比較対象のEmailAddress
   * @returns 等しい場合はtrue、そうでない場合はfalse
   */
  public equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}
