import { describe, expect, test } from "vitest";
import { z } from "zod";
import { EnrollmentStatus } from "../shared/enrollment-status";
import { TeamName } from "../shared/team-name";
import { Team } from "./team";
import { TeamMember } from "./team-member";

describe("Team", () => {
  // テスト用のチーム名を作成
  const createTeamName = (): TeamName => {
    const result = TeamName.create("testTeam");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("チーム名の作成に失敗しました");
    }
    return result.value;
  };

  // テスト用のチームメンバーを作成
  const createTeamMember = (name: string, email: string): TeamMember => {
    const result = TeamMember.create({
      name,
      email,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("チームメンバーの作成に失敗しました");
    }
    return result.value;
  };

  describe("create", () => {
    test("有効なチーム名でチームを作成できる", () => {
      const teamName = createTeamName();

      const result = Team.create({
        name: teamName,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const team = result.value;
        expect(team.getName()).toBe(teamName);
        expect(team.getMembers()).toHaveLength(0);

        // IDがULIDフォーマットであることを確認
        const isUlid = z.string().ulid().safeParse(team.getId());
        expect(isUlid.success).toBe(true);
      }
    });
  });

  describe("reconstruct", () => {
    test("有効なデータからチームを復元できる", () => {
      const teamName = createTeamName();

      const result = Team.reconstruct({
        id: "01ABCDEF",
        name: teamName,
        members: [],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const team = result.value;
        expect(team.getId()).toBe("01ABCDEF");
        expect(team.getName()).toBe(teamName);
        expect(team.getMembers()).toHaveLength(0);
      }
    });

    test("メンバーを含むチームを復元できる", () => {
      const teamName = createTeamName();
      const member1 = createTeamMember("山田太郎", "taro@example.com");
      const member2 = createTeamMember("鈴木次郎", "jiro@example.com");

      const result = Team.reconstruct({
        id: "01ABCDEF",
        name: teamName,
        members: [member1, member2],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const team = result.value;
        expect(team.getMembers()).toHaveLength(2);
        expect(team.getMembers()[0]?.getName()).toBe("山田太郎");
        expect(team.getMembers()[1]?.getName()).toBe("鈴木次郎");
      }
    });

    test("チームサイズが制約を超える場合はエラーになる", () => {
      const teamName = createTeamName();
      const member1 = createTeamMember("山田太郎", "taro@example.com");
      const member2 = createTeamMember("鈴木次郎", "jiro@example.com");
      const member3 = createTeamMember("佐藤三郎", "saburo@example.com");
      const member4 = createTeamMember("田中四郎", "shiro@example.com");
      const member5 = createTeamMember("高橋五郎", "goro@example.com");

      const result = Team.reconstruct({
        id: "01ABCDEF",
        name: teamName,
        members: [member1, member2, member3, member4, member5],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe(
          "チームのサイズは4名以下である必要があります",
        );
      }
    });
  });

  describe("addMember", () => {
    test("メンバーをチームに追加できる", () => {
      const teamName = createTeamName();
      const member = createTeamMember("山田太郎", "taro@example.com");

      const createResult = Team.create({
        name: teamName,
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const team = createResult.value;
        const addResult = team.addMember(member);
        expect(addResult.ok).toBe(true);
        expect(team.getMembers()).toHaveLength(1);
        expect(team.getMembers()[0]?.getName()).toBe("山田太郎");
      }
    });

    test("同じメンバーを重複して追加できない", () => {
      const teamName = createTeamName();
      const member = createTeamMember("山田太郎", "taro@example.com");

      const createResult = Team.create({
        name: teamName,
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const team = createResult.value;
        const addResult1 = team.addMember(member);
        expect(addResult1.ok).toBe(true);

        const addResult2 = team.addMember(member);
        expect(addResult2.ok).toBe(false);
        if (!addResult2.ok) {
          expect(addResult2.error.message).toBe(
            "既にチームに所属しているメンバーです",
          );
        }
      }
    });

    test("在籍中でないメンバーはチームに追加できない", () => {
      const teamName = createTeamName();
      const member = createTeamMember("山田太郎", "taro@example.com");

      // メンバーを休会中に変更
      const statusChangeResult = member.changeStatus(EnrollmentStatus.INACTIVE);
      expect(statusChangeResult.ok).toBe(true);

      const createResult = Team.create({
        name: teamName,
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const team = createResult.value;
        const addResult = team.addMember(member);
        expect(addResult.ok).toBe(false);
        if (!addResult.ok) {
          expect(addResult.error.message).toContain(
            "在籍状態が休会中のメンバーはチームに所属できません",
          );
        }
      }
    });

    test("チームサイズが制約を超える場合はエラーになる", () => {
      const teamName = createTeamName();
      const member1 = createTeamMember("山田太郎", "taro@example.com");
      const member2 = createTeamMember("鈴木次郎", "jiro@example.com");
      const member3 = createTeamMember("佐藤三郎", "saburo@example.com");
      const member4 = createTeamMember("田中四郎", "shiro@example.com");
      const member5 = createTeamMember("高橋五郎", "goro@example.com");

      const createResult = Team.create({
        name: teamName,
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const team = createResult.value;

        // 4人まで追加
        expect(team.addMember(member1).ok).toBe(true);
        expect(team.addMember(member2).ok).toBe(true);
        expect(team.addMember(member3).ok).toBe(true);
        expect(team.addMember(member4).ok).toBe(true);

        // 5人目を追加するとエラー
        const addResult = team.addMember(member5);
        expect(addResult.ok).toBe(false);
        if (!addResult.ok) {
          expect(addResult.error.message).toBe(
            "チームのサイズは4名以下である必要があります",
          );
        }

        // メンバー数は4人のまま
        expect(team.getMembers()).toHaveLength(4);
      }
    });
  });

  describe("removeMember", () => {
    test("メンバーをチームから削除できる", () => {
      const teamName = createTeamName();
      const member1 = createTeamMember("山田太郎", "taro@example.com");
      const member2 = createTeamMember("鈴木次郎", "jiro@example.com");

      const createResult = Team.create({
        name: teamName,
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const team = createResult.value;
        expect(team.addMember(member1).ok).toBe(true);
        expect(team.addMember(member2).ok).toBe(true);
        expect(team.getMembers()).toHaveLength(2);

        const removeResult = team.removeMember(member1.getId());
        expect(removeResult.ok).toBe(true);
        expect(team.getMembers()).toHaveLength(1);
        expect(team.getMembers()[0]?.getName()).toBe("鈴木次郎");
      }
    });

    test("存在しないメンバーを削除しようとするとエラーになる", () => {
      const teamName = createTeamName();
      const member = createTeamMember("山田太郎", "taro@example.com");

      const createResult = Team.create({
        name: teamName,
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const team = createResult.value;
        expect(team.addMember(member).ok).toBe(true);

        const removeResult = team.removeMember("non-existent-id");
        expect(removeResult.ok).toBe(false);
        if (!removeResult.ok) {
          expect(removeResult.error.message).toBe(
            "指定されたメンバーはチームに所属していません",
          );
        }
      }
    });

    // TODO: チームサイズが2名になった場合の処理は、ドメインサービスで実装される予定
  });

  describe("changeMemberStatus", () => {
    test("メンバーの在籍状態を変更できる", () => {
      const teamName = createTeamName();
      const member = createTeamMember("山田太郎", "taro@example.com");

      const createResult = Team.create({
        name: teamName,
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const team = createResult.value;
        expect(team.addMember(member).ok).toBe(true);

        const changeResult = team.changeMemberStatus(
          member.getId(),
          EnrollmentStatus.INACTIVE,
        );
        expect(changeResult.ok).toBe(true);

        // 在籍状態が「在籍中」でなくなったため、チームから削除される
        expect(team.getMembers()).toHaveLength(0);
      }
    });

    test("存在しないメンバーの在籍状態を変更しようとするとエラーになる", () => {
      const teamName = createTeamName();

      const createResult = Team.create({
        name: teamName,
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const team = createResult.value;
        const changeResult = team.changeMemberStatus(
          "non-existent-id",
          EnrollmentStatus.INACTIVE,
        );
        expect(changeResult.ok).toBe(false);
        if (!changeResult.ok) {
          expect(changeResult.error.message).toBe(
            "指定されたメンバーはチームに所属していません",
          );
        }
      }
    });

    test("無効な状態遷移はエラーになる", () => {
      const teamName = createTeamName();
      const member = createTeamMember("山田太郎", "taro@example.com");

      const createResult = Team.create({
        name: teamName,
      });
      expect(createResult.ok).toBe(true);

      if (createResult.ok) {
        const team = createResult.value;
        expect(team.addMember(member).ok).toBe(true);

        // 在籍中から退会済に変更
        const changeResult1 = team.changeMemberStatus(
          member.getId(),
          EnrollmentStatus.WITHDRAWN,
        );
        expect(changeResult1.ok).toBe(true);

        // 退会済のメンバーは既にチームから削除されているため、再度変更しようとするとエラー
        const changeResult2 = team.changeMemberStatus(
          member.getId(),
          EnrollmentStatus.INACTIVE,
        );
        expect(changeResult2.ok).toBe(false);
        if (!changeResult2.ok) {
          expect(changeResult2.error.message).toBe(
            "指定されたメンバーはチームに所属していません",
          );
        }
      }
    });
  });

  describe("equals", () => {
    test("同じIDを持つチームは等価", () => {
      const teamName = createTeamName();
      const id = "01ABCDEF";

      const result1 = Team.reconstruct({
        id,
        name: teamName,
        members: [],
      });

      const result2 = Team.reconstruct({
        id,
        name: teamName,
        members: [],
      });

      expect(result1.ok && result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(true);
      }
    });

    test("異なるIDを持つチームは等価でない", () => {
      const teamName = createTeamName();

      const result1 = Team.reconstruct({
        id: "01ABCDEF",
        name: teamName,
        members: [],
      });

      const result2 = Team.reconstruct({
        id: "01GHIJKL",
        name: teamName,
        members: [],
      });

      expect(result1.ok && result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.value.equals(result2.value)).toBe(false);
      }
    });
  });
});
