export function normalizeTag(t: string): string {
  return t.trim().toLowerCase().slice(0, 20);
}
