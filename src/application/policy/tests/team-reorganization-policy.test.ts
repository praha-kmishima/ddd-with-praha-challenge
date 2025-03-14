import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainEvents } from "../../../domain/event";
import { TeamName } from "../../../domain/shared/team-name";
import {
  TeamOversizedEvent,
  TeamUndersizedEvent,
} from "../../../domain/team/events";
import { TeamReorganizationPolicy } from "../team-reorganization-policy";

describe("TeamReorganizationPolicy", () => {
  beforeEach(() => {
    // テスト前にイベントハンドラをクリア
    DomainEvents.clearHandlers();
  });

  describe("handleTeamUndersized", () => {
    it("チームサイズが1名の場合、他のチームに統合する処理が実行されること", async () => {
      // モックの作成
      const mockTeamRepository = {
        findById: vi.fn().mockResolvedValue({
          ok: true,
          value: {
            getId: () => "team-1",
            getMembers: () => [{ getId: () => "member-1" }],
          },
        }),
        findAll: vi.fn().mockResolvedValue({
          ok: true,
          value: [
            {
              getId: () => "team-1",
              getMembers: () => [{ getId: () => "member-1" }],
            },
            {
              getId: () => "team-2",
              getMembers: () => [
                { getId: () => "member-2" },
                { getId: () => "member-3" },
              ],
            },
          ],
        }),
        save: vi.fn(),
        // 追加のメソッド
        findByName: vi.fn(),
        findByMemberId: vi.fn(),
        exists: vi.fn(),
        findSmallestTeam: vi.fn(),
      };

      const mockTeamReorganizationService = {
        mergeTeams: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
        splitTeam: vi.fn(),
      };

      // ポリシーのインスタンス化
      new TeamReorganizationPolicy(
        mockTeamRepository,
        mockTeamReorganizationService,
      );

      // テスト用のチーム名を作成
      const teamNameResult = TeamName.create("TestTeam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // イベント発行
      const event = new TeamUndersizedEvent("team-1", teamNameResult.value, 1);
      DomainEvents.publish(event);

      // 非同期処理の完了を待つ
      await new Promise((resolve) => setTimeout(resolve, 0));

      // チームリポジトリのfindByIdが呼ばれたことを確認
      expect(mockTeamRepository.findById).toHaveBeenCalledWith("team-1");

      // チームリポジトリのfindAllが呼ばれたことを確認
      expect(mockTeamRepository.findAll).toHaveBeenCalled();

      // チーム再編サービスのmergeTeamsが呼ばれたことを確認
      expect(mockTeamReorganizationService.mergeTeams).toHaveBeenCalled();
    });

    it("統合先のチームが4人の場合、チーム分割後に統合する処理が実行されること", async () => {
      // モックの作成
      const mockTeamRepository = {
        findById: vi.fn().mockResolvedValue({
          ok: true,
          value: {
            getId: () => "team-1",
            getMembers: () => [{ getId: () => "member-1" }],
          },
        }),
        findAll: vi.fn().mockResolvedValue({
          ok: true,
          value: [
            {
              getId: () => "team-1",
              getMembers: () => [{ getId: () => "member-1" }],
            },
            {
              getId: () => "team-2",
              getMembers: () => [
                { getId: () => "member-2" },
                { getId: () => "member-3" },
                { getId: () => "member-4" },
                { getId: () => "member-5" },
              ],
            },
          ],
        }),
        save: vi.fn(),
        // 追加のメソッド
        findByName: vi.fn(),
        findByMemberId: vi.fn(),
        exists: vi.fn(),
        findSmallestTeam: vi.fn(),
      };

      const mockTeamReorganizationService = {
        mergeTeams: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
        splitTeam: vi.fn().mockResolvedValue({
          ok: true,
          value: [
            {
              getId: () => "team-2-1",
              getMembers: () => [
                { getId: () => "member-2" },
                { getId: () => "member-3" },
              ],
            },
            {
              getId: () => "team-2-2",
              getMembers: () => [
                { getId: () => "member-4" },
                { getId: () => "member-5" },
              ],
            },
          ],
        }),
      };

      // ポリシーのインスタンス化
      new TeamReorganizationPolicy(
        mockTeamRepository,
        mockTeamReorganizationService,
      );

      // テスト用のチーム名を作成
      const teamNameResult = TeamName.create("TestTeam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // イベント発行
      const event = new TeamUndersizedEvent("team-1", teamNameResult.value, 1);
      DomainEvents.publish(event);

      // 非同期処理の完了を待つ
      await new Promise((resolve) => setTimeout(resolve, 0));

      // チームリポジトリのfindByIdが呼ばれたことを確認
      expect(mockTeamRepository.findById).toHaveBeenCalledWith("team-1");

      // チームリポジトリのfindAllが呼ばれたことを確認
      expect(mockTeamRepository.findAll).toHaveBeenCalled();

      // チーム再編サービスのsplitTeamが呼ばれたことを確認
      expect(mockTeamReorganizationService.splitTeam).toHaveBeenCalled();

      // チーム再編サービスのmergeTeamsが呼ばれたことを確認
      expect(mockTeamReorganizationService.mergeTeams).toHaveBeenCalled();
    });

    it("チームサイズが0の場合、何も処理が実行されないこと", async () => {
      // モックの作成
      const mockTeamRepository = {
        findById: vi.fn().mockResolvedValue({
          ok: true,
          value: {
            getId: () => "team-1",
            getMembers: () => [],
          },
        }),
        findAll: vi.fn(),
        save: vi.fn(),
        // 追加のメソッド
        findByName: vi.fn(),
        findByMemberId: vi.fn(),
        exists: vi.fn(),
        findSmallestTeam: vi.fn(),
      };

      const mockTeamReorganizationService = {
        mergeTeams: vi.fn(),
        splitTeam: vi.fn(),
      };

      // ポリシーのインスタンス化
      new TeamReorganizationPolicy(
        mockTeamRepository,
        mockTeamReorganizationService,
      );

      // テスト用のチーム名を作成
      const teamNameResult = TeamName.create("TestTeam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // イベント発行
      const event = new TeamUndersizedEvent("team-1", teamNameResult.value, 0);
      DomainEvents.publish(event);

      // 非同期処理の完了を待つ
      await new Promise((resolve) => setTimeout(resolve, 0));

      // チームリポジトリのfindByIdが呼ばれたことを確認
      expect(mockTeamRepository.findById).toHaveBeenCalledWith("team-1");

      // チームリポジトリのfindAllが呼ばれていないことを確認
      expect(mockTeamRepository.findAll).not.toHaveBeenCalled();

      // チーム再編サービスのmergeTeamsが呼ばれていないことを確認
      expect(mockTeamReorganizationService.mergeTeams).not.toHaveBeenCalled();
    });
  });

  describe("handleTeamOversized", () => {
    it("チームサイズが5名の場合、チーム分割処理が実行されること", async () => {
      // モックの作成
      const mockTeamRepository = {
        findById: vi.fn().mockResolvedValue({
          ok: true,
          value: {
            getId: () => "team-1",
            getMembers: () => [
              { getId: () => "member-1" },
              { getId: () => "member-2" },
              { getId: () => "member-3" },
              { getId: () => "member-4" },
              { getId: () => "member-5" },
            ],
          },
        }),
        findAll: vi.fn(),
        save: vi.fn(),
        // 追加のメソッド
        findByName: vi.fn(),
        findByMemberId: vi.fn(),
        exists: vi.fn(),
        findSmallestTeam: vi.fn(),
      };

      const mockTeamReorganizationService = {
        mergeTeams: vi.fn(),
        splitTeam: vi.fn().mockResolvedValue({
          ok: true,
          value: [
            {
              getId: () => "team-1",
              getMembers: () => [
                { getId: () => "member-1" },
                { getId: () => "member-2" },
              ],
            },
            {
              getId: () => "team-3",
              getMembers: () => [
                { getId: () => "member-3" },
                { getId: () => "member-4" },
                { getId: () => "member-5" },
              ],
            },
          ],
        }),
      };

      // ポリシーのインスタンス化
      new TeamReorganizationPolicy(
        mockTeamRepository,
        mockTeamReorganizationService,
      );

      // テスト用のチーム名を作成
      const teamNameResult = TeamName.create("TestTeam");
      expect(teamNameResult.ok).toBe(true);
      if (!teamNameResult.ok) return;

      // イベント発行
      const event = new TeamOversizedEvent("team-1", teamNameResult.value, 5);
      DomainEvents.publish(event);

      // 非同期処理の完了を待つ
      await new Promise((resolve) => setTimeout(resolve, 0));

      // チームリポジトリのfindByIdが呼ばれたことを確認
      expect(mockTeamRepository.findById).toHaveBeenCalledWith("team-1");

      // チーム再編サービスのsplitTeamが呼ばれたことを確認
      expect(mockTeamReorganizationService.splitTeam).toHaveBeenCalled();
    });
  });
});
