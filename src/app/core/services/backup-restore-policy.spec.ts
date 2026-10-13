import { describe, expect, it } from 'vitest';
import {
  filterBackupEntries,
  isAllowedBackupKey,
  validateBackupPayload
} from './backup-restore-policy';

describe('backup restore policy', () => {
  it('allows app-owned persistence keys only', () => {
    expect(isAllowedBackupKey('academic_kurd_app_workspace-1')).toBe(true);
    expect(isAllowedBackupKey('local_manuscripts_backup')).toBe(true);
    expect(isAllowedBackupKey('firebase:authUser:project')).toBe(false);
    expect(isAllowedBackupKey('session_token')).toBe(false);
    expect(isAllowedBackupKey('__proto__')).toBe(false);
    expect(isAllowedBackupKey('unrelated-site-key')).toBe(false);
  });

  it('filters secrets and unsupported keys from a backup map', () => {
    const result = filterBackupEntries({
      academic_kurd_app_notes: '[{"title":"Draft"}]',
      local_sources_backup: '[]',
      'firebase:authUser:project': '{"refreshToken":"secret"}',
      API_KEY: 'secret',
      constructor: '{"polluted":true}',
      unrelated: 'not app data',
      badValue: 42
    });

    expect(result).toEqual({
      academic_kurd_app_notes: '[{"title":"Draft"}]',
      local_sources_backup: '[]'
    });
  });

  it('rejects malformed and oversized backup payloads', () => {
    expect(validateBackupPayload([]).ok).toBe(false);
    expect(validateBackupPayload({ version: '2.5.0' }).ok).toBe(false);

    const tooMany = Object.fromEntries(
      Array.from({ length: 5001 }, (_, i) => [`academic_kurd_app_${i}`, 'x'])
    );
    expect(validateBackupPayload({
      version: '2.5.0',
      createdAt: new Date().toISOString(),
      localStorageDump: tooMany
    }).ok).toBe(false);
  });

  it('retains safe app data when importing an older backup and drops sensitive keys', () => {
    const validated = validateBackupPayload({
      version: '2.5.0',
      createdAt: '2026-01-01T00:00:00.000Z',
      localStorageDump: {
        local_manuscripts_backup: '[]',
        'firebase:authUser:project': '{"refreshToken":"do-not-restore"}'
      }
    });

    expect(validated.ok).toBe(true);
    if (validated.ok) {
      expect(validated.data.version).toBe('3.0.0');
      expect(validated.data.localStorageDump).toEqual({ local_manuscripts_backup: '[]' });
    }
  });
});
