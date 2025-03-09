import type { DomainEvent } from "./domain-event";

/**
 * イベントハンドラの型定義（同期のみ）
 */
export type EventHandler = (event: DomainEvent) => void;

/**
 * ドメインイベントバス
 * イベントの発行と購読を管理する
 */
export class DomainEventBus {
  #handlers: Map<string, Array<EventHandler>> = new Map();

  /**
   * イベントを購読する
   * @param eventType イベントの型名
   * @param handler イベントハンドラ
   */
  public subscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.#handlers.get(eventType) || [];
    handlers.push(handler);
    this.#handlers.set(eventType, handlers);
  }

  /**
   * イベントを発行する
   * @param event 発行するイベント
   */
  public publish(event: DomainEvent): void {
    const eventType = event.constructor.name;
    const handlers = this.#handlers.get(eventType) || [];

    // 同期的に実行
    for (const handler of handlers) {
      handler(event);
    }
  }

  /**
   * すべてのハンドラをクリアする
   * 主にテスト用途で使用
   */
  public clearHandlers(): void {
    this.#handlers.clear();
  }
}
