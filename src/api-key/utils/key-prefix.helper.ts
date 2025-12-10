import * as crypto from 'crypto';

export enum KeyEnvironment {
  LIVE = 'live',
  TEST = 'test',
}

export enum KeyType {
  SECRET = 'sk',
  PUBLIC = 'pk',
}

interface KeyPrefixOptions {
  type?: KeyType;
  environment?: KeyEnvironment;
  length?: number;
}

/**
 * Generates a prefixed API key
 * @example
 * generatePrefixedKey() // "sk_live_a3f8d9c2b1e4..."
 * generatePrefixedKey({ environment: 'test' }) // "sk_test_a3f8d9c2b1e4..."
 */
export function generatePrefixedKey(options: KeyPrefixOptions = {}): string {
  const {
    type = KeyType.SECRET,
    environment = KeyEnvironment.LIVE,
    length = 32,
  } = options;

  const randomPart = crypto.randomBytes(length).toString('hex');
  return `${type}_${environment}_${randomPart}`;
}

/**
 * Extracts the prefix from an API key for lookup
 * @example
 * extractKeyPrefix("sk_live_abc123def456") // "sk_live_abc123d" (first 15 chars)
 */
export function extractKeyPrefix(
  key: string,
  prefixLength: number = 15,
): string {
  return key.substring(0, prefixLength);
}

/**
 * Masks an API key for display purposes
 * @example
 * maskApiKey("sk_live_a3f8d9c2b1e4f5a6") // "sk_live_...e4f5a6"
 */
export function maskApiKey(key: string, visibleChars: number = 6): string {
  if (key.length < 10) return '***';

  const parts = key.split('_');
  if (parts.length >= 3) {
    const prefix = `${parts[0]}_${parts[1]}`;
    const suffix = key.slice(-visibleChars);
    return `${prefix}_...${suffix}`;
  }

  return `${key.substring(0, 3)}...${key.slice(-visibleChars)}`;
}

/**
 * Validates the format of a prefixed API key
 */
export function isValidKeyFormat(key: string): boolean {
  const parts = key.split('_');

  if (parts.length < 3) return false;

  const validTypes = Object.values(KeyType);
  const validEnvironments = Object.values(KeyEnvironment);

  return (
    validTypes.includes(parts[0] as KeyType) &&
    validEnvironments.includes(parts[1] as KeyEnvironment) &&
    parts[2].length >= 32
  );
}
