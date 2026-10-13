import { describe, expect, it } from 'vitest';
import { sha256Fingerprint } from './sha256-fingerprint';

describe('camera-ready SHA-256 fingerprint', () => {
  it('returns a deterministic 256-bit digest for the same manuscript snapshot', async () => {
    const snapshot = {
      metadata: { title: 'Test thesis', author: 'Test Author' },
      chapters: [{ title: 'Introduction', content: 'A complete chapter.' }]
    };
    const first = await sha256Fingerprint(snapshot);
    const second = await sha256Fingerprint(snapshot);

    expect(first).toMatch(/^SHA256:[A-F0-9]{64}$/);
    expect(second).toBe(first);
  });

  it('changes when manuscript content changes', async () => {
    const original = await sha256Fingerprint({ title: 'Test', content: 'A' });
    const changed = await sha256Fingerprint({ title: 'Test', content: 'B' });
    expect(changed).not.toBe(original);
  });
});
