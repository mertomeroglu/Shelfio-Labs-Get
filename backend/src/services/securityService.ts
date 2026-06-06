import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

const fallbackSecret = "development-only-change-me";

function getSessionSecret() {
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production");
  }
  return process.env.SESSION_SECRET || fallbackSecret;
}

function getLicensePepper() {
  return process.env.LICENSE_KEY_PEPPER || getSessionSecret();
}

function getEncryptionKey() {
  return createHash("sha256").update(process.env.LICENSE_KEY_ENCRYPTION_SECRET || getLicensePepper()).digest();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeLicenseKey(key: string) {
  return key.trim().toUpperCase();
}

export function hashLicenseKey(key: string) {
  return createHmac("sha256", getLicensePepper()).update(normalizeLicenseKey(key)).digest("hex");
}

export function maskLicenseKey(key: string) {
  const normalized = normalizeLicenseKey(key);
  if (normalized.length <= 10) return `${normalized.slice(0, 3)}-****`;
  const first = normalized.slice(0, Math.min(7, normalized.length));
  const last = normalized.slice(-4);
  return `${first}-****-${last}`;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${authTag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(value?: string | null) {
  if (!value) return null;
  const [version, iv, authTag, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !authTag || !encrypted) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(authTag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function createReference(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
}

export function createRawToken() {
  return randomBytes(32).toString("base64url");
}

export function generateSecureToken() {
  return createRawToken();
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function verifySignature(value: string, signature: string) {
  const expected = signValue(value);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}
