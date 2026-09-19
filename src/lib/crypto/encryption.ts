import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

let cachedKey: Buffer | null = null;

/**
 * ENCRYPTION_KEY must be independent of NEXTAUTH_SECRET — a compromised
 * auth secret must not also unlock stored API keys, and the two need to
 * be rotatable on separate schedules.
 */
function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY is not configured. Generate one with: openssl rand -hex 32"
    );
  }

  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 32-byte key encoded as 64 hex characters.");
  }

  cachedKey = key;
  return key;
}

/**
 * Encrypts `plaintext` with AES-256-GCM and a fresh random IV per call.
 * Output: base64(iv).base64(authTag).base64(ciphertext) — one opaque
 * string safe to store in a single text column.
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(".");
}

/**
 * Reverses encrypt(). Throws if the ciphertext was tampered with or
 * corrupted, or if ENCRYPTION_KEY was rotated without re-encrypting
 * existing rows.
 */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed ciphertext: expected iv.authTag.ciphertext.");
  }

  const [ivB64, authTagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
}
