/** Matches a free-text query against an item's text and optional tags. A leading "#" is stripped so "#work" and "work" behave the same. */
export function matchesSearch(query: string, text: string, tags?: string[]): boolean {
  const q = query.trim().toLowerCase().replace(/^#/, '');
  if (!q) return true;
  if (text.toLowerCase().includes(q)) return true;
  return (tags ?? []).some((tag) => tag.toLowerCase().includes(q));
}
