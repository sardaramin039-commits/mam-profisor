import { ChapterItemModel as ChapterItem } from '../domain/models';

const VAULT_VERSION = 'v1';
const PBKDF2_SALT_BYTES = 16;
const AES_IV_BYTES = 12;
const PBKDF2_ITERATIONS = 250_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveVaultKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  if (!password) throw new Error('Vault password is required.');
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto API is unavailable in this environment.');

  const encoder = new TextEncoder();
  const material = await subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    material,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts manuscript content with AES-256-GCM and a password-derived key.
 * Format: v1.<salt>.<iv>.<ciphertext>
 */
export async function encryptText(plainText: string, key: string): Promise<string> {
  if (!plainText) return plainText;
  if (!key) throw new Error('Vault password is required.');

  const subtle = globalThis.crypto?.subtle;
  const random = globalThis.crypto?.getRandomValues;
  if (!subtle || !random) {
    throw new Error('Web Crypto API is unavailable in this environment.');
  }

  const salt = random(new Uint8Array(PBKDF2_SALT_BYTES));
  const iv = random(new Uint8Array(AES_IV_BYTES));
  const cryptoKey = await deriveVaultKey(key, salt);
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded
  );

  return [
    VAULT_VERSION,
    bytesToBase64(salt),
    bytesToBase64(iv),
    bytesToBase64(new Uint8Array(cipherBuffer))
  ].join('.');
}

/**
 * Decrypts content produced by encryptText(). Throws on a wrong password or tampering.
 */
export async function decryptText(cipherText: string, key: string): Promise<string> {
  if (!cipherText) return cipherText;
  if (!key) throw new Error('Vault password is required.');

  const parts = cipherText.split('.');
  if (parts.length !== 4 || parts[0] !== VAULT_VERSION) {
    throw new Error('Unsupported or invalid Vault payload.');
  }

  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto API is unavailable in this environment.');

  const salt = base64ToBytes(parts[1]);
  const iv = base64ToBytes(parts[2]);
  const cipher = base64ToBytes(parts[3]);

  if (salt.length !== PBKDF2_SALT_BYTES || iv.length !== AES_IV_BYTES || cipher.length < 16) {
    throw new Error('Invalid Vault payload.');
  }

  const cryptoKey = await deriveVaultKey(key, salt);
  const plainBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    cipher
  );

  return new TextDecoder().decode(plainBuffer);
}

/**
 * Calculates a lightweight manuscript fingerprint for change detection.
 * This is not a cryptographic digest and must not be used as a security primitive.
 */
export function calculateIntegrityHash(content: string): string {
  if (!content) return 'MAM-HASH-EMPTY';
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash | 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `MAM-HASH-${hex}`;
}

/**
 * Verifies a chapter's current content against its newest recorded snapshot.
 */
export function verifyChapterIntegrity(
  chapter: ChapterItem
): { isValid: boolean; currentHash: string; expectedHash: string } {
  const currentHash = calculateIntegrityHash(chapter.content || '');
  if (!chapter.snapshots || chapter.snapshots.length === 0) {
    return { isValid: true, currentHash, expectedHash: currentHash };
  }

  const newestSnapshot = chapter.snapshots[0];
  const expectedHash = calculateIntegrityHash(newestSnapshot.content || '');

  return {
    isValid: currentHash === expectedHash,
    currentHash,
    expectedHash
  };
}
