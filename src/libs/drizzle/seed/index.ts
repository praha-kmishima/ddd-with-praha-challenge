import "dotenv/config";
import { ulid } from "../../../libs/ulid";
import { getDatabase } from "../get-database";
import { tasks, teamMembers, teams } from "../schema";

async function seedData() {
  console.log("初期データ登録を開始します...");
  const database = getDatabase();

  try {
    // チームの直接登録
    console.log("チームを登録中...");
    const teamAId = ulid();
    const teamBId = ulid();

    await database.insert(teams).values([
      { id: teamAId, name: "a" },
      { id: teamBId, name: "b" },
    ]);

    // チームメンバーの直接登録
    console.log("チームメンバーを登録中...");
    const member1Id = ulid();
    const member2Id = ulid();
    const member3Id = ulid();

    await database.insert(teamMembers).values([
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

    // タスクの直接登録
    console.log("タスクを登録中...");
    await database.insert(tasks).values([
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

    console.log("初期データ登録が完了しました！");
  } catch (error) {
    console.error("データ登録中にエラーが発生しました:", error);
  } finally {
    // データベース接続を閉じる処理があれば実行
    process.exit(0);
  }
}

// スクリプトとして実行された場合のみ実行
if (require.main === module) {
  seedData();
}

export { seedData };
