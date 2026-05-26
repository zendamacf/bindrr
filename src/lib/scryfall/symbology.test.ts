import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SCRYFALL_SYMBOL_SVG_URIS } from './symbolMap';
import {
  clearReportedUnknownSymbols,
  reportUnknownScryfallSymbol,
  scryfallSymbolSvgUri,
  splitScryfallSymbolText,
} from './symbology';

const captureException = vi.fn();

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

describe('splitScryfallSymbolText', () => {
  it('returns an empty array for empty input', () => {
    expect(splitScryfallSymbolText('')).toEqual([]);
  });

  it('splits mana costs into text and symbol parts', () => {
    expect(splitScryfallSymbolText('{1}{R}')).toEqual([
      { kind: 'symbol', value: '{1}' },
      { kind: 'symbol', value: '{R}' },
    ]);
  });

  it('preserves surrounding text and newlines', () => {
    expect(splitScryfallSymbolText('Tap {T}: Add {R/G}.')).toEqual([
      { kind: 'text', value: 'Tap ' },
      { kind: 'symbol', value: '{T}' },
      { kind: 'text', value: ': Add ' },
      { kind: 'symbol', value: '{R/G}' },
      { kind: 'text', value: '.' },
    ]);
  });
});

describe('scryfallSymbolSvgUri', () => {
  it('returns URIs from the static map', () => {
    expect(scryfallSymbolSvgUri('{Q}')).toBe(SCRYFALL_SYMBOL_SVG_URIS['{Q}']);
    expect(scryfallSymbolSvgUri('{R/G}')).toBe(SCRYFALL_SYMBOL_SVG_URIS['{R/G}']);
  });

  it('returns null for unknown symbols', () => {
    expect(scryfallSymbolSvgUri('{xxx}')).toBeNull();
  });
});

describe('reportUnknownScryfallSymbol', () => {
  beforeEach(() => {
    clearReportedUnknownSymbols();
    captureException.mockClear();
  });

  it('reports each unknown symbol only once', () => {
    reportUnknownScryfallSymbol('{ZZZ}');
    reportUnknownScryfallSymbol('{ZZZ}');

    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
