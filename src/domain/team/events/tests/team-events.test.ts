import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MemberAddedEvent,
  MemberRemovedEvent,
  MemberStatusChangedEvent,
  TeamCreatedEvent,
} from "..";
import { DomainEvents } from "../../../event";
import { EnrollmentStatus } from "../../../shared/enrollment-status";
import { TeamName } from "../../../shared/team-name";
import { Team } from "../../team";
import { TeamMember } from "../../team-member";

describe("Team Events", () => {
  beforeEach(() => {
    // テスト前にイベントハンドラをクリア
    DomainEvents.clearHandlers();
  });

  describe("TeamCreatedEvent", () => {
    it("チーム作成時にTeamCreatedEventが発行されること", () => {
      // モックハンドラを設定
      const handler = vi.fn();
      DomainEvents.subscribe("TeamCreatedEvent", handler);

      // テスト用のチーム名を作成
      const teamNameResult = TeamName.create("TestTeam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // チームを作成
      const teamResult = Team.create({
        name: teamNameResult.value,
      });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;

      // イベントハンドラが呼び出されたことを確認
      expect(handler).toHaveBeenCalledTimes(1);

      // 発行されたイベントを検証
      const event = handler.mock.calls[0][0];
      expect(event).toBeInstanceOf(TeamCreatedEvent);
      expect(event.teamId).toBe(teamResult.value.getId());
      expect(event.teamName).toBe(teamNameResult.value);
    });
  });

  describe("MemberRemovedEvent", () => {
    it("メンバー削除時にMemberRemovedEventが発行されること", () => {
      // モックハンドラを設定
      const handler = vi.fn();
      DomainEvents.subscribe("MemberRemovedEvent", handler);

      // テスト用のチームを作成
      const teamNameResult = TeamName.create("TestTeam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      const teamResult = Team.create({
        name: teamNameResult.value,
      });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;

      // テスト用のメンバーを作成
      const memberResult = TeamMember.create({
        name: "テストメンバー",
        email: "test@example.com",
      });
      expect(memberResult.ok).toBe(true);
      if (!memberResult.ok) return;

      // メンバーを追加
      const addResult = teamResult.value.addMember(memberResult.value);
      expect(addResult.ok).toBe(true);

      // ハンドラをリセット（TeamCreatedEventとMemberAddedEventの呼び出しをクリア）
      handler.mockClear();

      // メンバーを削除
      const removeResult = teamResult.value.removeMember(
        memberResult.value.getId(),
      );
      expect(removeResult.ok).toBe(true);

      // イベントハンドラが呼び出されたことを確認
      expect(handler).toHaveBeenCalledTimes(1);

      // 発行されたイベントを検証
      const event = handler.mock.calls[0][0];
      expect(event).toBeInstanceOf(MemberRemovedEvent);
      expect(event.teamId).toBe(teamResult.value.getId());
      expect(event.memberId).toBe(memberResult.value.getId());
      expect(event.memberName).toBe(memberResult.value.getName());
    });
  });

  describe("MemberStatusChangedEvent", () => {
    it("メンバーの在籍状態変更時にMemberStatusChangedEventが発行されること", async () => {
      // モックハンドラを設定
      const handler = vi.fn();
      DomainEvents.subscribe("MemberStatusChangedEvent", handler);

      // テスト用のチームを作成
      const teamNameResult = TeamName.create("TestTeam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      const teamResult = Team.create({
        name: teamNameResult.value,
      });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;

      // テスト用のメンバーを作成
      const memberResult = TeamMember.create({
        name: "テストメンバー",
        email: "test@example.com",
      });
      expect(memberResult.ok).toBe(true);
      if (!memberResult.ok) return;

      // メンバーを追加
      const addResult = teamResult.value.addMember(memberResult.value);
      expect(addResult.ok).toBe(true);

      // ハンドラをリセット（TeamCreatedEventとMemberAddedEventの呼び出しをクリア）
      handler.mockClear();

      // メンバーの在籍状態を変更するためのモックハンドラを設定
      const removedHandler = vi.fn();
      DomainEvents.subscribe("MemberRemovedEvent", removedHandler);

      // 在籍状態を「休会中」に変更
      const previousStatus = memberResult.value.getStatus();
      const newStatus = EnrollmentStatus.INACTIVE;
      const changeResult = teamResult.value.changeMemberStatus(
        memberResult.value.getId(),
        newStatus,
      );
      expect(changeResult.ok).toBe(true);

      // イベントハンドラが呼び出されたことを確認
      expect(handler).toHaveBeenCalledTimes(1);

      // 発行されたイベントを検証
      const event = handler.mock.calls[0][0];
      expect(event).toBeInstanceOf(MemberStatusChangedEvent);
      expect(event.teamId).toBe(teamResult.value.getId());
      expect(event.memberId).toBe(memberResult.value.getId());
      expect(event.memberName).toBe(memberResult.value.getName());
      expect(event.previousStatus).toBe(previousStatus);
      expect(event.newStatus).toBe(newStatus);

      // 在籍状態が「在籍中」でなくなったので、MemberRemovedEventも発行されているはず
      expect(removedHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("MemberAddedEvent", () => {
    it("メンバー追加時にMemberAddedEventが発行されること", () => {
      // モックハンドラを設定
      const handler = vi.fn();
      DomainEvents.subscribe("MemberAddedEvent", handler);

      // テスト用のチームを作成
      const teamNameResult = TeamName.create("TestTeam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      const teamResult = Team.create({
        name: teamNameResult.value,
      });
      expect(teamResult.ok).toBe(true);
      if (!teamResult.ok) return;

      // ハンドラをリセット（TeamCreatedEventの呼び出しをクリア）
      handler.mockClear();

      // テスト用のメンバーを作成
      const memberResult = TeamMember.create({
        name: "テストメンバー",
        email: "test@example.com",
      });
      expect(memberResult.ok).toBe(true);
      if (!memberResult.ok) return;

      // メンバーを追加
      const addResult = teamResult.value.addMember(memberResult.value);
      expect(addResult.ok).toBe(true);

      // イベントハンドラが呼び出されたことを確認
      expect(handler).toHaveBeenCalledTimes(1);

      // 発行されたイベントを検証
      const event = handler.mock.calls[0][0];
      expect(event).toBeInstanceOf(MemberAddedEvent);
      expect(event.teamId).toBe(teamResult.value.getId());
      expect(event.memberId).toBe(memberResult.value.getId());
      expect(event.memberName).toBe(memberResult.value.getName());
      expect(event.memberEmail).toBe(memberResult.value.getEmail());
      expect(event.memberStatus).toBe(memberResult.value.getStatus());
    });
  });
});
