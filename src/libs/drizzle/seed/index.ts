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

    // トランザクションを使用してデータ挿入
    await database.transaction(async (tx) => {
      // チームの登録
      console.log("チームを登録中...");
      const teamAId = ulid();
      const teamBId = ulid();

      await tx.insert(teams).values([
        { id: teamAId, name: "a" },
        { id: teamBId, name: "b" },
      ]);

      // チームメンバーの登録
      console.log("チームメンバーを登録中...");
      const member1Id = ulid();
      const member2Id = ulid();
      const member3Id = ulid();

      await tx.insert(teamMembers).values([
        {
          id: member1Id,
          teamId: teamAId,
          name: "山田太郎",
          email: "yamada@example.com",
          status: "在籍中",
        },
        {
          id: member2Id,
          teamId: teamAId,
          name: "鈴木花子",
          email: "suzuki@example.com",
          status: "在籍中",
        },
        {
          id: member3Id,
          teamId: teamBId,
          name: "佐藤次郎",
          email: "sato@example.com",
          status: "在籍中",
        },
      ]);

      // タスクの登録
      console.log("タスクを登録中...");
      await tx.insert(tasks).values([
        {
          id: ulid(),
          title: "DDDの基礎を学ぶ",
          ownerId: member1Id,
          progressStatus: "未着手",
        },
        {
          id: ulid(),
          title: "集約の設計を理解する",
          ownerId: member1Id,
          progressStatus: "未着手",
        },
        {
          id: ulid(),
          title: "リポジトリパターンを実装する",
          ownerId: member2Id,
          progressStatus: "取組中",
        },
        {
          id: ulid(),
          title: "ドメインイベントを理解する",
          ownerId: member3Id,
          progressStatus: "レビュー待ち",
        },
      ]);
    });

    // データが正しく適用されたか確認
    console.log("登録データを確認中...");

    const insertedTeams = await database.select().from(teams);
    console.log(`チーム数: ${insertedTeams.length}件`);
    if (insertedTeams.length !== 2) {
      throw new Error("チームデータが正しく登録されていません");
    }

    const insertedMembers = await database.select().from(teamMembers);
    console.log(`メンバー数: ${insertedMembers.length}件`);
    if (insertedMembers.length !== 3) {
      throw new Error("メンバーデータが正しく登録されていません");
    }

    const insertedTasks = await database.select().from(tasks);
    console.log(`タスク数: ${insertedTasks.length}件`);
    if (insertedTasks.length !== 4) {
      throw new Error("タスクデータが正しく登録されていません");
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
