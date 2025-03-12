# Team・TeamMemberのreconstructメソッドについて

## 質問

> team, team memberのreconstructについて質問です
> このメソッドはなぜ必要なのでしょうか
> ドメインモデルでも、このメソッドは書いていたのでしょうか？

> 永続化されたデータからドメインオブジェクトを再構築する　これはリポジトリの責務だと思っていたのですが、ドメインモデル側のメソッドが担当していてもよいのですか？

## reconstruct メソッドの必要性

`Team`と`TeamMember`クラスの`reconstruct`メソッドは、永続化されたデータからドメインオブジェクトを再構築する際に使用されます。これには以下の重要な役割があります：

### 1. ドメインモデルの整合性保護

```typescript
// Teamクラスのreconstruct内
const validateResult = team.validateTeamSize();
if (!validateResult.ok) {
  return err(validateResult.error);
}
```

データベースから取得したデータが、ドメインのルール（例：チームサイズの制約）に従っているかを確認します。これにより、データベース層でのエラーや不整合があっても、ドメインモデルの整合性が保たれます。

### 2. ファクトリーメソッドパターンの実装

`create`と`reconstruct`は、ファクトリーメソッドパターンの実装です：

- `create`: 新しいエンティティを作成（新規ID生成、初期状態設定、ドメインイベント発行）
- `reconstruct`: 既存エンティティの復元（既存IDの使用、保存された状態の復元、イベント発行なし）

```typescript
// 新規作成（IDを生成し、イベントを発行）
public static create(props: { name: TeamName; }): Result<Team, Error> {
  const team = new Team(ulid(), props.name, []);
  DomainEvents.publish(new TeamCreatedEvent(team.id, props.name));
  return ok(team);
}

// 復元（既存IDを使用、イベント発行なし）
public static reconstruct(props: {
  id: string;
  name: TeamName;
  members: TeamMember[];
}): Result<Team, Error> {
  const team = new Team(props.id, props.name, props.members);
  // バリデーションのみ実行
  const validateResult = team.validateTeamSize();
  if (!validateResult.ok) {
    return err(validateResult.error);
  }
  return ok(team);
}
```

### 3. イベント発行の制御

`create`メソッドではドメインイベントを発行しますが、`reconstruct`メソッドではイベントを発行しません。これは重要な違いです：

- 新規作成時：実際に新しいエンティティが作成されたことを示すイベントを発行
- 復元時：単にメモリ上に再構築しているだけなので、イベントは発行しない

## リポジトリとドメインモデルの責務分担

DDDにおける責務の分担は以下のようになります：

### リポジトリの責務
- データの永続化と取得（DBアクセス）
- クエリの実行
- トランザクション管理
- **データマッピング**（DBの行データ→ドメインオブジェクトの変換の調整）

### ドメインモデルの責務
- ドメインルールの適用
- ビジネスロジックの実装
- 整合性の保証
- **自身の生成と再構築のルール**（ファクトリーメソッド）

## なぜドメインモデル側にreconstructメソッドが必要か

実際には、**両方が協力して**再構築を行います：

1. **リポジトリ**: データの取得と基本的なマッピングを担当
   ```typescript
   // PostgresqlTeamRepositoryの実装から
   const teamRow = await this.database.select()...
   const memberRows = await this.database.select()...
   
   // 基本的なマッピングを行う
   const teamNameResult = TeamName.create(teamRow.name);
   ```

2. **ドメインモデル**: 自身の再構築ルールとバリデーションを担当
   ```typescript
   // 最終的な再構築とバリデーション
   const teamResult = Team.reconstruct({
     id: teamRow.id,
     name: teamNameResult.value,
     members,
   });
   ```

### カプセル化の原則

これは**カプセル化の原則**に基づいています：

- ドメインオブジェクトは自身の内部構造と生成ルールを知っている
- リポジトリはそれらの詳細を知るべきではない

例えば、`Team`クラスのコンストラクタが`private`であることに注目してください：
```typescript
private constructor(
  private readonly id: string,
  private readonly name: TeamName,
  private members: TeamMember[],
) {}
```

これにより、`Team`オブジェクトの生成は必ず`create`または`reconstruct`メソッドを通して行われることが保証されます。

## 実装パターンの利点

このパターンには以下の利点があります：

1. **ドメインロジックの集中**
   - エンティティの生成・再構築ルールはドメインロジックの一部
   - ドメインモデル内に集中させることで、ルールの散在を防ぐ

2. **変更に強い設計**
   - ドメインモデルの内部構造が変わっても、リポジトリの実装を変更する必要が少ない
   - `reconstruct`インターフェースが安定していれば、内部実装の変更は隠蔽される

3. **テスト容易性**
   - モックリポジトリの実装が簡単になる
   - ドメインモデルのテストでも同じファクトリーメソッドを使用できる

## 実際の実装例

PostgreSQLリポジトリの実装を見ると、責務の分担が明確です：

```typescript
// リポジトリの責務：データ取得とマッピングの調整
async findById(id: string): Promise<Result<Team | null, Error>> {
  try {
    // データ取得
    const teamRow = await this.database.select()...
    const memberRows = await this.database.select()...
    
    // 基本的なマッピング
    const teamNameResult = TeamName.create(teamRow.name);
    
    // メンバーの再構築
    const members: TeamMember[] = [];
    for (const memberRow of memberRows) {
      const memberResult = TeamMember.reconstruct({...});
      members.push(memberResult.value);
    }
    
    // チームの再構築（ドメインモデルの責務を呼び出し）
    const teamResult = Team.reconstruct({
      id: teamRow.id,
      name: teamNameResult.value,
      members,
    });
    
    return ok(teamResult.value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
```

## 代替アプローチ

もちろん、別のアプローチも可能です：

1. **リポジトリ内でのマッピング**: リポジトリがすべてのマッピングロジックを持つ
   - 利点: ドメインモデルがよりシンプルになる
   - 欠点: ドメインルールがリポジトリに漏れる可能性がある

2. **マッパークラス**: 専用のマッパークラスを作成
   - 利点: 責務の分離が明確
   - 欠点: 追加のクラスが必要になり、複雑さが増す

## 結論

「永続化されたデータからドメインオブジェクトを再構築する」責務は、実際には**リポジトリとドメインモデルの協力**によって実現されるものです。リポジトリがデータ取得とマッピングの調整を担当し、ドメインモデルが自身の再構築ルールとバリデーションを担当します。

このパターンは、カプセル化の原則に従い、ドメインロジックをドメインモデル内に集中させることで、より堅牢で変更に強い設計を実現します。
