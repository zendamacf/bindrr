import type { CardSearchResult } from './types';

/** Placeholder data for add-card UI until search API is wired up. */
export const MOCK_SEARCH_RESULTS: CardSearchResult[] = [
  {
    printingId: 1,
    name: 'Lightning Bolt',
    setName: 'Double Masters',
    setCode: '2XM',
    collectorNumber: '141',
    language: null,
    imageUrl: null,
  },
  {
    printingId: 2,
    name: 'Counterspell',
    setName: 'Dominaria Remastered',
    setCode: 'DMR',
    collectorNumber: '53',
    language: null,
    imageUrl: null,
  },
  {
    printingId: 3,
    name: 'Sol Ring',
    setName: 'Commander Masters',
    setCode: 'CMM',
    collectorNumber: '412',
    language: null,
    imageUrl: null,
  },
  {
    printingId: 4,
    name: 'Lightning Bolt',
    setName: 'Magic 2010',
    setCode: 'M10',
    collectorNumber: '146',
    language: null,
    imageUrl: null,
  },
  {
    printingId: 5,
    name: 'Brainstorm',
    setName: 'Strixhaven Mystical Archive',
    setCode: 'STA',
    collectorNumber: '13',
    language: 'JP',
    imageUrl: null,
  },
];

export function filterMockSearchResults(query: string): CardSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 3) return [];

  return MOCK_SEARCH_RESULTS.filter(
    (card) =>
      card.name.toLowerCase().includes(normalized) ||
      card.setName.toLowerCase().includes(normalized) ||
      card.setCode.toLowerCase().includes(normalized),
  );
}
