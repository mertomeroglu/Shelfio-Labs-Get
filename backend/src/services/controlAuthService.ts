import { createHash, timingSafeEqual } from "node:crypto";

const sensitiveMetadataKeys = [
  "authorization",
  "card",
  "code",
  "cookie",
  "cvc",
  "database",
  "licensekey",
  "password",
  "secret",
  "session",
  "smtp",
  "token",
];

export function isControlSecretConfigured() {
  return Boolean(process.env.CONTROL_API_INTERNAL_SECRET);
}

export function verifyControlSecret(value?: string | null) {
  const expected = process.env.CONTROL_API_INTERNAL_SECRET;
  if (!expected || !value) return false;
  const expectedHash = createHash("sha256").update(expected).digest();
  const actualHash = createHash("sha256").update(value).digest();
  return timingSafeEqual(expectedHash, actualHash);
}

export function sanitizeAuditMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  return sanitizeRecord(metadata as Record<string, unknown>);
}

function sanitizeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (sensitiveMetadataKeys.some((sensitiveKey) => normalizedKey.includes(sensitiveKey))) {
      sanitized[key] = "[redacted]";
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitizeRecord(value as Record<string, unknown>);
      continue;
    }
    if (Array.isArray(value)) {
      sanitized[key] = value.slice(0, 20).map((item) => (
        item && typeof item === "object" && !Array.isArray(item)
          ? sanitizeRecord(item as Record<string, unknown>)
          : item
      ));
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}
