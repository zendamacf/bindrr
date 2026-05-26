import type { CardSearchResult } from './types';

export type SetFilterOption = { value: string; label: string };

export function buildSetFilterOptions(results: CardSearchResult[]): SetFilterOption[] {
  const byCode = new Map<string, SetFilterOption>();
  for (const r of results) {
    const code = r.setCode?.trim();
    if (!code) continue;
    if (!byCode.has(code)) {
      const name = r.setName?.trim() || code;
      byCode.set(code, { value: code, label: `${name} (${code})` });
    }
  }
  return [...byCode.values()].sort((a, b) => a.label.localeCompare(b.label));
}
