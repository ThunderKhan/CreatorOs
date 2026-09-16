const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;
const VERSION = "v1";

function parseKey(value, name) {
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  const trimmed = value.trim();
  let key;

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    key = Buffer.from(trimmed, "hex");
  } else {
    key = Buffer.from(trimmed, "base64");
  }

  if (key.length !== KEY_LENGTH) {
    throw new Error(`${name} must decode to exactly 32 bytes.`);
  }

  return key;
}

function getKeyRing() {
  const current = parseKey(
    process.env.CREATOR_TOKEN_ENCRYPTION_KEY,
    "CREATOR_TOKEN_ENCRYPTION_KEY",
  );
  const previous = process.env.CREATOR_TOKEN_ENCRYPTION_KEY_PREVIOUS
    ? parseKey(
        process.env.CREATOR_TOKEN_ENCRYPTION_KEY_PREVIOUS,
        "CREATOR_TOKEN_ENCRYPTION_KEY_PREVIOUS",
      )
    : null;

  return previous ? [current, previous] : [current];
}

function encryptSecret(value) {
  if (!value) return value;

  const key = getKeyRing()[0];
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(String(value), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

function decryptWithKey(payload, key) {
  const [, encodedIv, encodedTag, encodedCiphertext] = payload.split(":");
  const iv = Buffer.from(encodedIv, "base64url");
  const authTag = Buffer.from(encodedTag, "base64url");
  const ciphertext = Buffer.from(encodedCiphertext, "base64url");

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== 16 ||
    ciphertext.length === 0
  ) {
    throw new Error("Invalid encrypted creator access token format.");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

function decryptSecret(value) {
  if (!value) return value;
  if (!value.startsWith(`${VERSION}:`)) return value;

  const keys = getKeyRing();
  let lastError;

  for (const key of keys) {
    try {
      return decryptWithKey(value, key);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Unable to decrypt creator access token with the configured encryption keys: ${lastError?.message || "unknown error"}`,
  );
}

function isEncryptedSecret(value) {
  return typeof value === "string" && value.startsWith(`${VERSION}:`);
}

module.exports = {
  encryptSecret,
  decryptSecret,
  isEncryptedSecret,
};
