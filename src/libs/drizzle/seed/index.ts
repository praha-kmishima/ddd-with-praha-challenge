import "dotenv/config";
import { ulid } from "../../../libs/ulid";
import { getDatabase } from "../get-database";
import { tasks, teamMembers, teams } from "../schema";

async function seedData() {
  console.log("初期データ登録を開始します...");
  const database = getDatabase();

  try {
    // 既存データの確認と削除（冪等性の確保）
    console.log("既存データの確認中...");
    const existingTeams = await database.select().from(teams);

    if (existingTeams.length > 0) {
      console.log("既存のデータを削除します...");

      // 外部キー制約を考慮した順序での削除
      await database.delete(tasks);
      await database.delete(teamMembers);
      await database.delete(teams);

      console.log("既存データの削除が完了しました");
    } else {
      console.log("既存データはありません");
    }

    // タスクのタイトル一覧
    const taskTitles = [
      "データベースモデリング1",
      "データベースモデリング2",
      "データベースモデリング3",
      "データベースモデリング4",
      "データベースモデリング5",
      "データベース設計のアンチパターンを学ぶ1",
      "データベース設計のアンチパターンを学ぶ2",
      "データベース設計のアンチパターンを学ぶ3",
      "データベース設計のアンチパターンを学ぶ4",
      "データベース設計のアンチパターンを学ぶ5",
      "データベース設計のアンチパターンを学ぶ6",
      "データベース設計のアンチパターンを学ぶ7",
      "データベース設計のアンチパターンを学ぶ8",
      "データベース設計のアンチパターンを学ぶ9",
      "アンチパターンを踏まえてDBモデリングを見直そう",
      "マルチテナントについて",
      "外部キー制約について考える",
      "データベースにおけるNULLの扱い",
      "jestで単体テストを書こう",
      "Storybookでコンポーネントの動作確認をしよう",
      "ビジュアルリグレッションテストを書こう",
      "E2Eテストを書こう",
      "TDD(テスト駆動開発)でコードを書いてみる",
      "基本的な設計原則",
      "オニオンアーキテクチャを学ぶ",
      "DDDを学ぶ（基礎）",
      "特大課題：プラハチャレンジをDDDで実装してみる",
      "DDDを学ぶ（応用）",
      "リファクタリング",
      "SQL10本ノック",
      "インデックスを理解する",
      "スロークエリを理解する",
      "ビューを使いこなす",
      "トランザクションについて理解する",
      "Reactの開発環境を立ち上げよう",
      "Webページを作ってみよう",
      "Webページをコンポーネントに分割してみよう",
      "汎用的なコンポーネントを作成しよう【props編】",
      "汎用的なコンポーネントを作成しよう【CSS編】",
      "Reactに入門しよう【レンダリング編】",
      "Reactに入門しよう【状態管理編】",
      "Reactに入門しよう【避難ハッチ編】",
      "フロントエンドのレンダリングパターンを学ぼう【CSR、SSR、SSG】",
      "ライブラリを使ってみよう",
    ];

    // 進捗状況マッピングの型定義
    type ProgressStatusType = "未着手" | "取組中" | "レビュー待ち" | "完了";
    type TaskProgressMap = Record<string, ProgressStatusType>;
    type MemberProgressMap = Record<string, TaskProgressMap>;

    // トランザクションを使用してデータ挿入
    await database.transaction(async (tx) => {
      // チームの登録
      console.log("チームを登録中...");
      const teamAId = ulid();

      await tx.insert(teams).values([{ id: teamAId, name: "a" }]);

      // チームメンバーの登録
      console.log("チームメンバーを登録中...");
      const mishimaId = ulid();
      const harukiId = ulid();
      const tsutomuId = ulid();

      await tx.insert(teamMembers).values([
        {
          id: mishimaId,
          teamId: teamAId,
          name: "Mishima Kensuke",
          email: "mishima@example.com",
          status: "在籍中",
        },
        {
          id: harukiId,
          teamId: teamAId,
          name: "Kawata Haruki",
          email: "haruki@example.com",
          status: "在籍中",
        },
        {
          id: tsutomuId,
          teamId: teamAId,
          name: "Kawata Tsutomu",
          email: "tsutomu@example.com",
          status: "在籍中",
        },
      ]);

      // 進捗状況マッピングの定義
      const progressStatusMap: MemberProgressMap = {
        "Kawata Haruki": {
          データベースモデリング1: "完了",
          データベースモデリング2: "完了",
          データベースモデリング3: "完了",
          データベースモデリング4: "完了",
          データベースモデリング5: "完了",
          データベース設計のアンチパターンを学ぶ1: "完了",
          データベース設計のアンチパターンを学ぶ2: "完了",
          データベース設計のアンチパターンを学ぶ3: "取組中",
          アンチパターンを踏まえてDBモデリングを見直そう: "完了",
          マルチテナントについて: "完了",
          外部キー制約について考える: "レビュー待ち",
          データベースにおけるNULLの扱い: "レビュー待ち",
          jestで単体テストを書こう: "レビュー待ち",
          Storybookでコンポーネントの動作確認をしよう: "取組中",
          ビジュアルリグレッションテストを書こう: "取組中",
          "TDD(テスト駆動開発)でコードを書いてみる": "取組中",
        },
        "Mishima Kensuke": {
          データベースモデリング1: "完了",
          データベースモデリング2: "完了",
          データベースモデリング3: "完了",
          データベースモデリング4: "完了",
          データベースモデリング5: "完了",
          データベース設計のアンチパターンを学ぶ1: "完了",
          データベース設計のアンチパターンを学ぶ2: "完了",
          データベース設計のアンチパターンを学ぶ3: "完了",
          データベース設計のアンチパターンを学ぶ4: "完了",
          データベース設計のアンチパターンを学ぶ5: "完了",
          データベース設計のアンチパターンを学ぶ6: "完了",
          データベース設計のアンチパターンを学ぶ7: "完了",
          データベース設計のアンチパターンを学ぶ8: "完了",
          データベース設計のアンチパターンを学ぶ9: "完了",
          アンチパターンを踏まえてDBモデリングを見直そう: "取組中",
          マルチテナントについて: "レビュー待ち",
          外部キー制約について考える: "完了",
          データベースにおけるNULLの扱い: "レビュー待ち",
          jestで単体テストを書こう: "完了",
          Storybookでコンポーネントの動作確認をしよう: "完了",
          ビジュアルリグレッションテストを書こう: "完了",
          E2Eテストを書こう: "完了",
          "TDD(テスト駆動開発)でコードを書いてみる": "完了",
          基本的な設計原則: "レビュー待ち",
          オニオンアーキテクチャを学ぶ: "レビュー待ち",
          "DDDを学ぶ（基礎）": "レビュー待ち",
          "特大課題：プラハチャレンジをDDDで実装してみる": "取組中",
        },
        "Kawata Tsutomu": {
          データベースモデリング1: "完了",
          データベースモデリング2: "完了",
          データベースモデリング3: "完了",
          データベースモデリング4: "完了",
          データベースモデリング5: "完了",
          データベース設計のアンチパターンを学ぶ1: "完了",
          データベース設計のアンチパターンを学ぶ2: "完了",
          データベース設計のアンチパターンを学ぶ3: "レビュー待ち",
          データベース設計のアンチパターンを学ぶ4: "レビュー待ち",
          データベース設計のアンチパターンを学ぶ5: "レビュー待ち",
          データベース設計のアンチパターンを学ぶ6: "レビュー待ち",
          データベース設計のアンチパターンを学ぶ7: "レビュー待ち",
          データベース設計のアンチパターンを学ぶ8: "レビュー待ち",
          データベース設計のアンチパターンを学ぶ9: "レビュー待ち",
          アンチパターンを踏まえてDBモデリングを見直そう: "取組中",
          マルチテナントについて: "レビュー待ち",
          外部キー制約について考える: "レビュー待ち",
          データベースにおけるNULLの扱い: "レビュー待ち",
          jestで単体テストを書こう: "完了",
          Storybookでコンポーネントの動作確認をしよう: "完了",
          ビジュアルリグレッションテストを書こう: "完了",
          E2Eテストを書こう: "完了",
          "TDD(テスト駆動開発)でコードを書いてみる": "完了",
          基本的な設計原則: "レビュー待ち",
          オニオンアーキテクチャを学ぶ: "取組中",
          "DDDを学ぶ（基礎）": "取組中",
          "特大課題：プラハチャレンジをDDDで実装してみる": "取組中",
        },
      };

      // メンバー名とIDのマッピング
      const memberNameToIdMap = {
        "Mishima Kensuke": mishimaId,
        "Kawata Haruki": harukiId,
        "Kawata Tsutomu": tsutomuId,
      };

      // 各メンバーに全てのタスクを割り当てる
      console.log("各メンバーにタスクを割り当て中...");

      // 各メンバーごとに全てのタスクを登録
      for (const [memberName, memberId] of Object.entries(memberNameToIdMap)) {
        for (const title of taskTitles) {
          // 進捗状況を取得（マップに存在しない場合は「未着手」）
          const progressStatus =
            progressStatusMap[memberName]?.[title] || "未着手";

          await tx.insert(tasks).values({
            id: ulid(),
            title,
            ownerId: memberId,
            progressStatus,
          });
        }
      }
    });

    // データが正しく適用されたか確認
    console.log("登録データを確認中...");

    const insertedTeams = await database.select().from(teams);
    console.log(`チーム数: ${insertedTeams.length}件`);
    if (insertedTeams.length !== 1) {
      throw new Error("チームデータが正しく登録されていません");
    }

    const insertedMembers = await database.select().from(teamMembers);
    console.log(`メンバー数: ${insertedMembers.length}件`);
    if (insertedMembers.length !== 3) {
      throw new Error("メンバーデータが正しく登録されていません");
    }

    const insertedTasks = await database.select().from(tasks);
    const expectedTaskCount = taskTitles.length * 3; // タスク数 × 3メンバー
    console.log(`タスク数: ${insertedTasks.length}件`);
    if (insertedTasks.length !== expectedTaskCount) {
      throw new Error(
        `タスクデータが正しく登録されていません（期待: ${expectedTaskCount}件, 実際: ${insertedTasks.length}件）`,
      );
    }

    console.log("データ確認完了: すべてのデータが正常に登録されました！");

    // 登録されたデータの詳細を表示
    console.log("\n--- 登録されたチーム ---");
    for (const team of insertedTeams) {
      console.log(`ID: ${team.id}, 名前: ${team.name}`);
    }

    console.log("\n--- 登録されたメンバー ---");
    for (const member of insertedMembers) {
      console.log(
        `ID: ${member.id}, 名前: ${member.name}, メール: ${member.email}, ステータス: ${member.status}`,
      );
    }

    console.log("\n初期データ登録が完了しました！");
    return true;
  } catch (error) {
    // 詳細なエラーハンドリング
    if (error && typeof error === "object") {
      if ("code" in error && error.code === "23505") {
        // PostgreSQLの一意制約違反エラーコード
        console.error(
          "一意制約違反が発生しました。同じIDまたは一意の値が既に存在します:",
          "detail" in error ? error.detail : "",
        );
      } else if ("code" in error && error.code === "23503") {
        // 外部キー制約違反
        console.error(
          "外部キー制約違反が発生しました:",
          "detail" in error ? error.detail : "",
        );
      } else {
        console.error("データ登録中に予期しないエラーが発生しました:", error);
      }
    } else {
      console.error("データ登録中に予期しないエラーが発生しました:", error);
    }
    return false;
  } finally {
    // データベース接続を閉じる処理があれば実行
    if (require.main === module) {
      process.exit(0);
    }
  }
}

// スクリプトとして実行された場合のみ実行
seedData();

export { seedData };
