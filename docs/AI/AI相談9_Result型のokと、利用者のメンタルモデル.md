# Result型のokと、利用者のメンタルモデル

## Result型の基本

```typescript
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
```

## `ok(undefined)`の意味

`ok(undefined)`は「何も返さないメソッドであることを表現している」ということです。

### 技術的な説明

`save`メソッドのような操作では、戻り値の型が`Promise<Result<void, Error>>`となっています。これは：

1. 操作が成功した場合：値を返す必要はないが、成功したことを示す必要がある
2. 操作が失敗した場合：エラーを返す必要がある

TypeScriptでは、値を返さない関数は`void`型を使用します。しかし、Result型のパターンを使用する場合、成功を示すために`ok()`関数を呼び出す必要があります。

### 実装例

PostgreSQLリポジトリの実装例：

```typescript
async save(team: Team): Promise<Result<void, Error>> {
  try {
    // データベース操作...
    
    return ok(undefined);  // 成功を示すが値は返さない
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
```

### なぜ`ok(undefined)`なのか

1. **一貫性のため**: すべての操作がResult型を返すパターンを維持する
2. **型安全性**: `void`型の代わりに`Result<void, Error>`を使用することで、エラーハンドリングを強制する
3. **明示的な成功表現**: 単に`undefined`を返すのではなく、明示的に操作が成功したことを示す

### 代替アプローチ

他の言語やライブラリでは、これを表現するために異なるアプローチを取ることもあります：

- Rustでは`Result<(), Error>`（`()`はユニット型）
- 一部のライブラリでは`Success`や`Unit`のような専用の型

確かに直感的でないと感じるかもしれませんが、TypeScriptの型システムの制約内でこのパターンを実現するための実用的な解決策です。

## エラー時の戻り値

エラーが発生した場合、`err`関数を使用してエラーオブジェクトをラップして返します：

```typescript
// エラー発生時
return err(
  error instanceof Error
    ? error  // Errorインスタンスならそのまま使用
    : new Error("Unknown error occurred")  // それ以外は新しいErrorを作成
);
```

この戻り値は以下のような形になります：

```typescript
{
  ok: false,
  error: Error  // エラーオブジェクト
}
```

## 受け取り側の処理方法

Result型を受け取る側は、以下のようなパターンで処理することが求められます：

### 1. 成功/失敗の判定

まず`ok`プロパティを確認して、操作が成功したか失敗したかを判断します：

```typescript
const result = await repository.someOperation();
if (!result.ok) {
  // エラー処理
}
```

### 2. 値の取得とエラーハンドリング

#### 成功時（ok === true）
`value`プロパティから値を取得します：

```typescript
// 成功時
const data = result.value;  // 型Tの値
```

#### 失敗時（ok === false）
`error`プロパティからエラーを取得し、適切に処理します：

```typescript
// 失敗時
if (!result.ok) {
  // アプリケーション層では通常、独自のエラーに変換
  throw new CustomError();
  
  // または詳細なエラー情報を使用
  // console.error(result.error.message);
}
```

### 3. 実際の使用例

実際のユースケースでの使用例：

```typescript
public async invoke(input: EditTaskTitleUseCaseInput): Promise<EditTaskTitleUseCasePayload> {
  // 1. リポジトリからデータを取得
  const task = await this.taskRepository.findById(input.taskId);
  
  // 2. 結果の確認
  if (!task.ok) {
    // エラーの場合はカスタムエラーをスロー
    throw new EditTaskTitleUseCaseNotFoundError();
  }
  
  // 3. 値の存在確認（nullの可能性がある場合）
  if (!task.value) {
    throw new EditTaskTitleUseCaseNotFoundError();
  }
  
  // 4. 値を使用した処理
  task.value.edit(input.title);
  
  // 5. 別の操作の結果も同様に処理
  const savedTask = await this.taskRepository.save(task.value);
  if (!savedTask.ok) {
    throw new EditTaskTitleUseCaseError();
  }
  
  // 6. 成功時の値を使用
  return {
    id: savedTask.value.id,
    title: savedTask.value.title,
    // ...
  };
}
```

### 4. パターンのメリット

このパターンには以下のメリットがあります：

- **型安全性**: コンパイル時にエラーハンドリングを強制
- **明示的**: 成功/失敗が明確に区別される
- **一貫性**: すべての操作で同じパターンを使用
- **堅牢性**: エラーを見落とすリスクを低減

このように、Result型を使用することで、エラーハンドリングを明示的かつ型安全に行うことができます。
