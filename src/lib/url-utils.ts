const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'fbclid',
  'gclid',
  'msclkid',
  'mc_eid',
  'ref',
  '_hsenc',
  '_hsmi',
]);

/**
 * Validates whether a URL has a safe web scheme (http: or https:).
 * Rejects dangerous schemes like javascript:, data:, vbscript:, and file:.
 */
export function isValidWebUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts a clean domain/hostname from a URL, stripping leading 'www.'.
 */
export function extractDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return 'unknown';
  }
}

/**
 * Conservatively normalizes a URL for duplicate detection:
 * - Lowercases scheme and host
 * - Removes standard ports (80 for http, 443 for https)
 * - Removes tracking params (utm_*, fbclid, etc.) while preserving content params (id, v, etc.)
 * - Strips trailing slashes on empty paths
 * - Strips fragment identifier (#hash)
 */
export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return rawUrl.trim();
    }

    // Scheme and host are lowercase
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove standard ports
    if (
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    ) {
      parsed.port = '';
    }

    // Strip tracking parameters only
    const searchParams = new URLSearchParams(parsed.search);
    const keysToDelete: string[] = [];
    searchParams.forEach((_, key) => {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        keysToDelete.push(key);
      }
    });
    for (const key of keysToDelete) {
      searchParams.delete(key);
    }
    // Sort search parameters for deterministic comparison
    searchParams.sort();
    const cleanSearch = searchParams.toString();
    parsed.search = cleanSearch ? `?${cleanSearch}` : '';

    // Strip hash fragment
    parsed.hash = '';

    // Normalize path trailing slash (preserve single / if empty)
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;

    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Checks if two URLs are exact normalized duplicates.
 */
export function areUrlsDuplicates(urlA: string, urlB: string): boolean {
  if (!urlA || !urlB) return false;
  return normalizeUrl(urlA) === normalizeUrl(urlB);
}

/**
 * Checks if two URLs are likely duplicates (e.g. ignoring all query params when path matches).
 * Note: Conservative - used only as secondary advisory matching.
 */
export function isLikelyDuplicate(urlA: string, urlB: string): boolean {
  try {
    const a = new URL(urlA);
    const b = new URL(urlB);
    return (
      a.protocol.toLowerCase() === b.protocol.toLowerCase() &&
      a.hostname.replace(/^www\./i, '').toLowerCase() ===
        b.hostname.replace(/^www\./i, '').toLowerCase() &&
      a.pathname.replace(/\/$/, '') === b.pathname.replace(/\/$/, '')
    );
  } catch {
    return false;
  }
}
