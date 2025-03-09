/**
 * 処理の結果を表す型
 * 成功の場合はokがtrueでvalueに値が入り、失敗の場合はokがfalseでerrorにエラーが入る
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * 成功の結果を作成する
 */
export const ok = <T>(value: T): { ok: true; value: T } => ({
  ok: true,
  value,
});

/**
 * 失敗の結果を作成する
 */
export const err = <E>(error: E): { ok: false; error: E } => ({
  ok: false,
  error,
});
