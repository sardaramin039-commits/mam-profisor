/**
 * Restricts authenticated/internal API handling to same-origin /api endpoints.
 * Relative paths are resolved against the supplied or current browser origin.
 */
export function isInternalApiUrl(url: string, origin?: string): boolean {
  if (!url) return false;

  const baseOrigin = origin ?? (typeof window !== 'undefined' ? window.location.origin : undefined);
  if (!baseOrigin) return false;

  try {
    const base = new URL(baseOrigin);
    const target = new URL(url, base.origin);
    if (target.origin !== base.origin) return false;

    return target.pathname === '/api' || target.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}
