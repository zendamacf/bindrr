export function formatLogChange(change: number): string {
  if (change > 0) return `+${change}`;
  return String(change);
}

export function formatLogOccurred(iso: string): string {
  return new Date(iso).toLocaleString();
}
