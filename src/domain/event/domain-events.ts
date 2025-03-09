import type { DomainEvent } from "./domain-event";
import { DomainEventBus, type EventHandler } from "./domain-event-bus";

/**
 * ドメインイベントの静的ファサード
 * アプリケーション全体でイベントを発行・購読するためのオブジェクト
 */
const eventBus = new DomainEventBus();

export const DomainEvents = {
  /**
   * イベントを購読する
   * @param eventType イベントの型名
   * @param handler イベントハンドラ
   */
  subscribe(eventType: string, handler: EventHandler): void {
    eventBus.subscribe(eventType, handler);
  },

  /**
   * イベントを発行する
   * @param event 発行するイベント
   */
  publish(event: DomainEvent): void {
    eventBus.publish(event);
  },

  /**
   * すべてのハンドラをクリアする
   * 主にテスト用途で使用
   */
  clearHandlers(): void {
    eventBus.clearHandlers();
  },
};
