/**
 * Produces a deterministic SHA-256 digest for a JSON-serializable manuscript snapshot.
 * This is an integrity fingerprint, not a digital signature or a claim of authorship.
 */
export async function sha256Fingerprint(value: unknown): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('SHA-256 Web Crypto is unavailable in this environment.');

  const serialized = JSON.stringify(value);
  if (typeof serialized !== 'string') {
    throw new Error('Fingerprint input is not JSON-serializable.');
  }

  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(serialized));
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  return `SHA256:${hex.toUpperCase()}`;
}
