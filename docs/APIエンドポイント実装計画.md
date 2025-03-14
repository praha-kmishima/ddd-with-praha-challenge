# APIエンドポイント実装計画

## 概要

このドキュメントでは、プラハチャレンジDDDテンプレートプロジェクトにおける未実装のAPIエンドポイントの実装計画を記載します。各APIエンドポイントの実装に必要な要素、参照すべきコンテキストファイル、実装の優先順位などを明確にします。

## 現在の実装状況

### 実装済みのコンポーネント

#### ユースケース層（アプリケーション層）
- ✅ タスク関連ユースケース
  - CreateTaskUseCase
  - EditTaskTitleUseCase
  - SetTaskDoneUseCase
  - UpdateTaskProgressUseCase
- ✅ チーム関連ユースケース
  - CreateTeamUseCase
  - AddTeamMemberUseCase
  - RemoveTeamMemberUseCase
  - ChangeTeamMemberStatusUseCase

#### クエリサービス層（アプリケーション層）
- ✅ タスク関連クエリサービス
  - TaskQueryService
  - TaskListQueryService
  - GetTasksByOwnerIdQueryService
- ✅ チーム関連クエリサービス
  - TeamQueryService
  - TeamByNameQueryService
  - GetAllTeamsQueryService

#### インフラストラクチャ層
- ✅ PostgreSQLリポジトリ実装
- ✅ PostgreSQLクエリサービス実装

#### プレゼンテーション層（コントローラー）
- ⚠️ タスク関連コントローラー
  - ✅ CreateTaskController
  - ✅ EditTaskTitleController
  - ✅ GetTaskController
  - ✅ GetTaskListController
  - ✅ GetTasksByOwnerIdController
  - ✅ SetTaskDoneController
  - ❌ UpdateTaskProgressController（未実装）
- ⚠️ チーム関連コントローラー
  - ✅ GetTeamController
  - ✅ GetTeamByNameController
  - ❌ CreateTeamController（未実装）
  - ❌ AddTeamMemberController（未実装）
  - ❌ RemoveTeamMemberController（未実装）
  - ❌ ChangeTeamMemberStatusController（未実装）

## 未実装のAPIエンドポイント

以下のAPIエンドポイント（コントローラー）が未実装です。各エンドポイントの実装に必要な要素と参照すべきコンテキストファイルを記載します。

### 1. UpdateTaskProgressController

**優先度**: 高（既存のSetTaskDoneControllerを置き換える重要な機能）

**機能概要**:
- タスクの進捗ステータスを更新する
- 進捗ステータスの遷移ルールに従って更新を行う
- 所有者のみが更新可能

**エンドポイント**:
- `PUT /tasks/:id/progress`
- または進捗ステータスごとに個別のエンドポイント（例：`PUT /tasks/:id/in-progress`）

**必要な実装要素**:
1. コントローラーの定義
2. リクエストバリデーション（taskId, progressStatus, requesterId）
3. ミドルウェアでのユースケース注入
4. エンドポイントハンドラーの実装
5. エラーハンドリング

**参照すべきコンテキストファイル**:
- `src/application/use-case/update-task-progress-use-case.ts` - 対応するユースケース
- `src/presentation/task/set-task-done-controller.ts` - 類似の既存コントローラー
- `src/domain/shared/progress-status.ts` - 進捗ステータスの定義
- `src/application/use-case/tests/update-task-progress-use-case.test.ts` - ユースケースのテスト

**テスト要件**:
- 正常系: 有効なリクエストで進捗ステータスが更新される
- 異常系: 無効なタスクID、無効な進捗ステータス、不正な状態遷移、権限エラー

### 2. CreateTeamController

**優先度**: 高（チーム関連の基本操作の起点）

**機能概要**:
- 新しいチームを作成する
- チーム名のバリデーション（英文字のみ）
- チーム名の一意性確認

**エンドポイント**:
- `POST /teams`

**必要な実装要素**:
1. コントローラーの定義
2. リクエストバリデーション（teamName）
3. ミドルウェアでのユースケース注入
4. エンドポイントハンドラーの実装
5. エラーハンドリング

**参照すべきコンテキストファイル**:
- `src/application/use-case/create-team-use-case.ts` - 対応するユースケース
- `src/domain/shared/team-name.ts` - チーム名の値オブジェクト
- `src/application/use-case/tests/create-team-use-case.test.ts` - ユースケースのテスト
- `src/presentation/task/create-task-controller.ts` - 類似の既存コントローラー

**テスト要件**:
- 正常系: 有効なチーム名でチームが作成される
- 異常系: 無効なチーム名、既存のチーム名

### 3. AddTeamMemberController

**優先度**: 高（チーム作成後の基本操作）

**機能概要**:
- チームにメンバーを追加する
- メンバー情報のバリデーション
- チームサイズの制約チェック（2〜4名）
- メンバーの在籍状態チェック

**エンドポイント**:
- `POST /teams/:id/members`

**必要な実装要素**:
1. コントローラーの定義
2. リクエストバリデーション（teamId, memberName, memberEmail）
3. ミドルウェアでのユースケース注入
4. エンドポイントハンドラーの実装
5. エラーハンドリング

**参照すべきコンテキストファイル**:
- `src/application/use-case/add-team-member-use-case.ts` - 対応するユースケース
- `src/domain/shared/email-address.ts` - メールアドレスの値オブジェクト
- `src/domain/shared/enrollment-status.ts` - 在籍状態の値オブジェクト
- `src/application/use-case/tests/add-team-member-use-case.test.ts` - ユースケースのテスト
- `src/presentation/task/create-task-controller.ts` - 類似の既存コントローラー

**テスト要件**:
- 正常系: 有効なメンバー情報でメンバーが追加される
- 異常系: 無効なチームID、無効なメンバー情報、チームサイズ制約違反

### 4. RemoveTeamMemberController

**優先度**: 中（チームの基本操作の一部）

**機能概要**:
- チームからメンバーを削除する
- チームサイズの制約チェック（削除後も2名以上）

**エンドポイント**:
- `DELETE /teams/:id/members/:memberId`

**必要な実装要素**:
1. コントローラーの定義
2. リクエストバリデーション（teamId, memberId）
3. ミドルウェアでのユースケース注入
4. エンドポイントハンドラーの実装
5. エラーハンドリング

**参照すべきコンテキストファイル**:
- `src/application/use-case/remove-team-member-use-case.ts` - 対応するユースケース
- `src/application/use-case/tests/remove-team-member-use-case.test.ts` - ユースケースのテスト
- `src/presentation/task/set-task-done-controller.ts` - 類似の既存コントローラー

**テスト要件**:
- 正常系: メンバーが削除される
- 異常系: 無効なチームID、無効なメンバーID、チームサイズ制約違反

### 5. ChangeTeamMemberStatusController

**優先度**: 中（チームの高度な操作）

**機能概要**:
- チームメンバーの在籍状態を変更する
- 在籍状態の遷移ルールを適切に処理
- チームサイズへの影響を考慮

**エンドポイント**:
- `PATCH /teams/:id/members/:memberId/status`

**必要な実装要素**:
1. コントローラーの定義
2. リクエストバリデーション（teamId, memberId, status）
3. ミドルウェアでのユースケース注入
4. エンドポイントハンドラーの実装
5. エラーハンドリング

**参照すべきコンテキストファイル**:
- `src/application/use-case/change-team-member-status-use-case.ts` - 対応するユースケース
- `src/domain/shared/enrollment-status.ts` - 在籍状態の値オブジェクト
- `src/application/use-case/tests/change-team-member-status-use-case.test.ts` - ユースケースのテスト
- `src/presentation/task/edit-task-title-controller.ts` - 類似の既存コントローラー

**テスト要件**:
- 正常系: メンバーの在籍状態が変更される
- 異常系: 無効なチームID、無効なメンバーID、無効な在籍状態、不正な状態遷移

## 実装の進め方

各APIエンドポイントの実装には、以下のステップを踏むことをお勧めします：

1. **テストの作成**
   - コントローラーの振る舞いを定義するテストを先に作成
   - 正常系と異常系の両方をカバー

2. **コントローラーの実装**
   - リクエストバリデーション
   - ミドルウェアでの依存性注入
   - エンドポイントハンドラーの実装
   - エラーハンドリング

3. **手動テスト**
   - 実際にAPIを呼び出してテスト
   - エラーケースも含めて検証

## コントローラー実装のテンプレート

以下に、コントローラー実装のテンプレートを示します。これを参考にして各コントローラーを実装してください。

```typescript
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { z } from "zod";
import type { UseCase } from "../../application/use-case/use-case";
import { Repository } from "../../infrastructure/repository/repository";
import { getDatabase } from "../../libs/drizzle/get-database";

type Env = {
  Variables: {
    useCase: UseCase;
  };
};

export const controller = new Hono<Env>();

controller.post(
  "/endpoint",
  zValidator("json", z.object({
    // バリデーションルール
    param1: z.string(),
    param2: z.number(),
  })),
  createMiddleware<Env>(async (context, next) => {
    const database = getDatabase();
    const repository = new Repository(database);
    const useCase = new UseCase(repository);
    context.set("useCase", useCase);

    await next();
  }),
  async (context) => {
    const body = context.req.valid("json");

    const result = await context.var.useCase.execute(body);
    if (!result.ok) {
      return context.json({ error: result.error.message }, 400);
    }

    return context.json(result.value, 201);
  }
);
```

## 実装の優先順位

以下の優先順位で実装を進めることをお勧めします：

1. **UpdateTaskProgressController**
   - 既存のSetTaskDoneControllerを置き換える重要な機能
   - 進捗ステータスの変更は基本的な機能であり、早期に実装すべき

2. **チームの基本操作**
   - CreateTeamController
   - AddTeamMemberController

3. **チームの高度な操作**
   - RemoveTeamMemberController
   - ChangeTeamMemberStatusController
