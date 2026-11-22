/**
 * Utility to parse single or multiple photo evidence URLs
 * Supports comma-separated strings, JSON arrays, or single URL string
 */
export function parseFotoBukti(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return [];
    if (s.startsWith('[') && s.endsWith(']')) {
      try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.filter(Boolean);
      } catch (e) {}
    }
    return s.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
}
