import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainEvent } from "../domain-event";
import { DomainEventBus } from "../domain-event-bus";
import { DomainEvents } from "../domain-events";

// テスト用のドメインイベント実装クラス
class TestEvent extends DomainEvent {
  constructor(public readonly testData: string) {
    super();
  }
}

describe("DomainEventBus", () => {
  let eventBus: DomainEventBus;

  beforeEach(() => {
    eventBus = new DomainEventBus();
  });

  it("イベントを発行すると購読しているハンドラが呼び出されること", () => {
    const handler = vi.fn();

    eventBus.subscribe("TestEvent", handler);

    const event = new TestEvent("test data");
    eventBus.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("複数のハンドラが登録されている場合、すべてのハンドラが呼び出されること", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    eventBus.subscribe("TestEvent", handler1);
    eventBus.subscribe("TestEvent", handler2);

    const event = new TestEvent("test data");
    eventBus.publish(event);

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it("異なるイベントタイプのハンドラは呼び出されないこと", () => {
    const testEventHandler = vi.fn();
    const anotherEventHandler = vi.fn();

    eventBus.subscribe("TestEvent", testEventHandler);
    eventBus.subscribe("AnotherTestEvent", anotherEventHandler);

    const event = new TestEvent("test data");
    eventBus.publish(event);

    expect(testEventHandler).toHaveBeenCalledTimes(1);
    expect(anotherEventHandler).toHaveBeenCalledTimes(0);
  });

  it("clearHandlersを呼び出すとすべてのハンドラが削除されること", () => {
    const handler = vi.fn();

    eventBus.subscribe("TestEvent", handler);
    eventBus.clearHandlers();

    const event = new TestEvent("test data");
    eventBus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });
});

describe("DomainEvents", () => {
  beforeEach(() => {
    DomainEvents.clearHandlers();
  });

  it("静的ファサードを通じてイベントを発行・購読できること", () => {
    const handler = vi.fn();

    DomainEvents.subscribe("TestEvent", handler);

    const event = new TestEvent("test data");
    DomainEvents.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });
});
