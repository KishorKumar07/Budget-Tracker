import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "node:crypto";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = randomBytes(32).toString("hex");
});

describe("encrypt/decrypt", () => {
  it("round-trips plaintext", async () => {
    const { encrypt, decrypt } = await import("./encryption");
    const ciphertext = encrypt("sk-my-secret-api-key");
    expect(decrypt(ciphertext)).toBe("sk-my-secret-api-key");
  });

  it("produces different ciphertext for the same plaintext (IV uniqueness)", async () => {
    const { encrypt } = await import("./encryption");
    const a = encrypt("same-plaintext");
    const b = encrypt("same-plaintext");
    expect(a).not.toBe(b);
  });

  it("throws if the auth tag segment is tampered with", async () => {
    const { encrypt, decrypt } = await import("./encryption");
    const ciphertext = encrypt("sk-my-secret-api-key");
    const [iv, authTag, data] = ciphertext.split(".");
    const tamperedTag = Buffer.from(authTag, "base64");
    tamperedTag[0] ^= 0xff;
    const tampered = [iv, tamperedTag.toString("base64"), data].join(".");
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws if the ciphertext segment is tampered with", async () => {
    const { encrypt, decrypt } = await import("./encryption");
    const ciphertext = encrypt("sk-my-secret-api-key");
    const [iv, authTag, data] = ciphertext.split(".");
    const tamperedData = Buffer.from(data, "base64");
    tamperedData[0] ^= 0xff;
    const tampered = [iv, authTag, tamperedData.toString("base64")].join(".");
    expect(() => decrypt(tampered)).toThrow();
  });

  it("throws on malformed ciphertext", async () => {
    const { decrypt } = await import("./encryption");
    expect(() => decrypt("not-a-valid-ciphertext")).toThrow();
  });
});
