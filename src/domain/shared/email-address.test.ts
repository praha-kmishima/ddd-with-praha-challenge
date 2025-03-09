import { describe, expect, test } from "vitest";
import { EmailAddress } from "./email-address";

describe("EmailAddress", () => {
  describe("有効なメールアドレスの場合", () => {
    const validEmail = "test@example.com";
    const result = EmailAddress.create(validEmail);

    test("成功する", () => {
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.getValue()).toBe(validEmail);
      }
    });
  });

  describe("無効なメールアドレスの場合", () => {
    const invalidEmail = "invalid-email";
    const result = EmailAddress.create(invalidEmail);

    test("エラーが発生する", () => {
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("無効なメールアドレス形式です");
      }
    });
  });

  describe("等価性の確認", () => {
    const email1Result = EmailAddress.create("same@example.com");
    const email2Result = EmailAddress.create("same@example.com");
    const email3Result = EmailAddress.create("different@example.com");

    test("同じ値のEmailAddressは等価", () => {
      expect(email1Result.ok && email2Result.ok).toBe(true);
      if (email1Result.ok && email2Result.ok) {
        expect(email1Result.value.equals(email2Result.value)).toBe(true);
      }
    });

    test("異なる値のEmailAddressは非等価", () => {
      expect(email1Result.ok && email3Result.ok).toBe(true);
      if (email1Result.ok && email3Result.ok) {
        expect(email1Result.value.equals(email3Result.value)).toBe(false);
      }
    });
  });
});
