import { ulid } from "../../libs/ulid";

/**
 * ドメインイベントの基底クラス
 * すべてのドメインイベントはこのクラスを継承する
 */
export abstract class DomainEvent {
  readonly #eventId: string;
  readonly #occurredOn: Date;

  constructor() {
    this.#eventId = ulid();
    this.#occurredOn = new Date();
  }

  /**
   * イベントIDを取得する
   */
  public get eventId(): string {
    return this.#eventId;
  }

  /**
   * イベント発生日時を取得する
   */
  public get occurredOn(): Date {
    return new Date(this.#occurredOn.getTime());
  }

  /**
   * 等価性を比較する
   * @param other 比較対象のDomainEvent
   * @returns 等しい場合はtrue、そうでない場合はfalse
   */
  public equals(other: DomainEvent): boolean {
    return this.#eventId === other.#eventId;
  }
}
