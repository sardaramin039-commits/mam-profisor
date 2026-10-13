import { describe, expect, it } from 'vitest';
import { geminiKeyPoolSignature } from './gemini.service';

describe('Gemini client pool signature', () => {
  it('is stable for the same normalized key order', () => {
    const first = geminiKeyPoolSignature(['key-one', 'key-two']);
    const second = geminiKeyPoolSignature(['key-one', 'key-two']);
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes when a key is rotated even if the key count is unchanged', () => {
    expect(geminiKeyPoolSignature(['old-key-a', 'old-key-b']))
      .not.toBe(geminiKeyPoolSignature(['new-key-a', 'new-key-b']));
  });

  it('changes when key order changes because round-robin order changes', () => {
    expect(geminiKeyPoolSignature(['key-one', 'key-two']))
      .not.toBe(geminiKeyPoolSignature(['key-two', 'key-one']));
  });
});
