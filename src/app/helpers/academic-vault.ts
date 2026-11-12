import { ChapterItemModel as ChapterItem } from '../domain/models';

/**
 * Encrypts plaintext using XOR-based cipher with Base64 encoding.
 */
export function encryptText(plainText: string, key: string): string {
  if (!plainText || !key) return plainText;
  let result = '';
  for (let i = 0; i < plainText.length; i++) {
    const charCode = plainText.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    const encrypted = charCode ^ keyChar;
    result += String.fromCharCode(encrypted);
  }
  try {
    return btoa(unescape(encodeURIComponent(result)));
  } catch {
    return btoa(result);
  }
}

/**
 * Decrypts cipherText encoded with XOR cipher.
 */
export function decryptText(cipherText: string, key: string): string {
  if (!cipherText || !key) return cipherText;
  let decoded = '';
  try {
    decoded = decodeURIComponent(escape(atob(cipherText)));
  } catch {
    try {
      decoded = atob(cipherText);
    } catch {
      return cipherText;
    }
  }
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    const decrypted = charCode ^ keyChar;
    result += String.fromCharCode(decrypted);
  }
  return result;
}

/**
 * Calculates a numerical integrity hash string for manuscript verification.
 */
export function calculateIntegrityHash(content: string): string {
  if (!content) return 'MAM-HASH-EMPTY';
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `MAM-HASH-${hex}`;
}

/**
 * Verifies a chapter's content against its last recorded snapshot integrity hash.
 */
export function verifyChapterIntegrity(chapter: ChapterItem): { isValid: boolean; currentHash: string; expectedHash: string } {
  const currentHash = calculateIntegrityHash(chapter.content || '');
  if (!chapter.snapshots || chapter.snapshots.length === 0) {
    return { isValid: true, currentHash, expectedHash: currentHash };
  }
  const lastSnapshot = chapter.snapshots[chapter.snapshots.length - 1];
  const expectedHash = calculateIntegrityHash(lastSnapshot.content || '');
  return {
    isValid: currentHash === expectedHash,
    currentHash,
    expectedHash
  };
}
