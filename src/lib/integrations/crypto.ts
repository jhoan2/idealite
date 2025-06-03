import {
  randomBytes,
  createHash,
  createCipheriv,
  createDecipheriv,
} from "crypto";

const ENC_KEY = Buffer.from(process.env.INTEGRATION_SECRET_KEY!, "hex"); // 32-byte hex key
const IV_LEN = 12; // AES-256-GCM nonce length

/* ---------- Machine-key helpers ---------- */

export function generateMachineKey(): { plaintext: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(raw).digest("hex");
  return { plaintext: `idealite_sk_${raw}`, hash };
}

export function hashMachineKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

/* ---------- AES-GCM encryption for OAuth / PAT ---------- */

export function encrypt(text: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(blob: string): string {
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + 16);
  const data = buf.subarray(IV_LEN + 16);

  const decipher = createDecipheriv("aes-256-gcm", ENC_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data, undefined, "utf8") + decipher.final("utf8");
}
