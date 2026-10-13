export const APP_BACKUP_VERSION = '3.0.0';
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024;
export const MAX_BACKUP_ENTRIES = 5_000;
export const MAX_BACKUP_KEY_CHARS = 256;
export const MAX_BACKUP_VALUE_CHARS = 2 * 1024 * 1024;

export interface AppBackupData {
  version: string;
  createdAt: string;
  localStorageDump: Record<string, string>;
}

const ALLOWED_EXACT_KEYS = new Set([
  'local_manuscripts_backup',
  'local_sources_backup',
  'kurdish_academic_thesis_draft',
  'catalog_40_books_archive'
]);

const ALLOWED_PREFIXES = [
  'academic_kurd_app_',
  'local_fallback_'
];

const SENSITIVE_KEY_PATTERN =
  /(?:firebase|auth(?:entication)?|token|secret|password|credential|session|oauth|jwt|api[_.-]?key|access[_.-]?token|refresh[_.-]?token|id[_.-]?token|private[_.-]?key|client[_.-]?secret)/i;

export function isAllowedBackupKey(key: string): boolean {
  if (
    typeof key !== 'string' ||
    key.length === 0 ||
    key.length > MAX_BACKUP_KEY_CHARS ||
    !/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(key) ||
    key === '__proto__' ||
    key === 'prototype' ||
    key === 'constructor' ||
    SENSITIVE_KEY_PATTERN.test(key)
  ) {
    return false;
  }

  return ALLOWED_EXACT_KEYS.has(key) ||
    ALLOWED_PREFIXES.some(prefix => key.startsWith(prefix));
}

export function filterBackupEntries(entries: Record<string, unknown>): Record<string, string> {
  const safe: Record<string, string> = Object.create(null) as Record<string, string>;
  let totalChars = 0;

  for (const [key, value] of Object.entries(entries)) {
    if (!isAllowedBackupKey(key) || typeof value !== 'string') continue;
    if (value.length > MAX_BACKUP_VALUE_CHARS) continue;
    const safeValue = sanitizeStoredValue(value);
    if (safeValue.length > MAX_BACKUP_VALUE_CHARS) continue;
    if (Object.keys(safe).length >= MAX_BACKUP_ENTRIES) break;
    if (totalChars + safeValue.length > MAX_BACKUP_BYTES) break;

    safe[key] = safeValue;
    totalChars += safeValue.length;
  }

  return safe;
}

function stripSensitiveJsonFields(value: unknown, depth = 0): unknown {
  if (depth > 40) return undefined;
  if (Array.isArray(value)) {
    return value.map(item => stripSensitiveJsonFields(item, depth + 1));
  }
  if (!value || typeof value !== 'object') return value;

  const safe: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const [key, nested] of Object.entries(value)) {
    if (
      key === '__proto__' ||
      key === 'prototype' ||
      key === 'constructor' ||
      SENSITIVE_KEY_PATTERN.test(key)
    ) continue;
    const sanitized = stripSensitiveJsonFields(nested, depth + 1);
    if (sanitized !== undefined) safe[key] = sanitized;
  }
  return safe;
}

function sanitizeStoredValue(value: string): string {
  try {
    const parsed = JSON.parse(value) as unknown;
    const sanitized = stripSensitiveJsonFields(parsed);
    return JSON.stringify(sanitized) ?? value;
  } catch {
    return value;
  }
}

export type BackupValidation =
  | { ok: true; data: AppBackupData }
  | { ok: false; error: string };

export function validateBackupPayload(value: unknown): BackupValidation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'فایلی پاشەکەوتسازیی دروست نییە.' };
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record['version'] !== 'string' ||
    !/^\d+\.\d+\.\d+$/.test(record['version']) ||
    typeof record['createdAt'] !== 'string' ||
    !Number.isFinite(Date.parse(record['createdAt'])) ||
    !record['localStorageDump'] ||
    typeof record['localStorageDump'] !== 'object' ||
    Array.isArray(record['localStorageDump'])
  ) {
    return { ok: false, error: 'پێکهاتەی فایلی پاشەکەوتسازی نادروستە.' };
  }

  const raw = record['localStorageDump'] as Record<string, unknown>;
  if (Object.keys(raw).length > MAX_BACKUP_ENTRIES) {
    return { ok: false, error: 'ژمارەی زۆری تۆمار لە فایلی پاشەکەوتسازییەکەدا هەیە.' };
  }

  const safeEntries = filterBackupEntries(raw);
  if (Object.keys(safeEntries).length === 0) {
    return { ok: false, error: 'هیچ داتایەکی ناسەلامەت‌نەبووی ئەپ لە فایلی پاشەکەوتسازییەکەدا نەدۆزرایەوە.' };
  }

  return {
    ok: true,
    data: {
      version: APP_BACKUP_VERSION,
      createdAt: record['createdAt'],
      localStorageDump: safeEntries
    }
  };
}
