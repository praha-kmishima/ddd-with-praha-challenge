import { describe, expect, it } from "vitest";
import { DomainEvent } from "../domain-event";

// テスト用のドメインイベント実装クラス
class TestEvent extends DomainEvent {
  constructor(public readonly testData: string) {
    super();
  }
}

describe("DomainEvent", () => {
  it("イベントIDが生成されること", () => {
    const event = new TestEvent("test");
    expect(event.eventId).toBeDefined();
    expect(typeof event.eventId).toBe("string");
    expect(event.eventId.length).toBeGreaterThan(0);
  });

  it("発生日時が現在時刻に設定されること", () => {
    const now = new Date();
    const event = new TestEvent("test");

    // 数秒以内の誤差を許容
    const diff = Math.abs(event.occurredOn.getTime() - now.getTime());
    expect(diff).toBeLessThan(1000);
  });

  it("同じイベントは自分自身と等価と判定されること", () => {
    const event = new TestEvent("test");
    expect(event.equals(event)).toBe(true);
  });

  it("異なるイベントIDを持つイベントは等価でないと判定されること", () => {
    const event1 = new TestEvent("test1");
    const event2 = new TestEvent("test2");

    expect(event1.equals(event2)).toBe(false);
  });
});
