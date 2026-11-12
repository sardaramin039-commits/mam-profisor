import { describe, expect, it } from 'vitest';
import { sha256 } from './text-sha256.service';

describe('text SHA-256', () => {
  it('matches the standard empty-input digest', () => {
    expect(sha256('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('matches the standard abc digest', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('supports Kurdish UTF-8 text deterministically', () => {
    expect(sha256('مام پڕۆفیسۆر')).toHaveLength(64);
    expect(sha256('مام پڕۆفیسۆر')).toBe(sha256('مام پڕۆفیسۆر'));
  });
});
