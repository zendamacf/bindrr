import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCRYFALL_LANGUAGE,
  isScryfallLanguageCode,
  scryfallLanguageLabel,
} from './languages';

describe('isScryfallLanguageCode', () => {
  it('accepts supported Scryfall language codes', () => {
    expect(isScryfallLanguageCode('en')).toBe(true);
    expect(isScryfallLanguageCode('ja')).toBe(true);
    expect(isScryfallLanguageCode('zhs')).toBe(true);
  });

  it('rejects unknown codes', () => {
    expect(isScryfallLanguageCode('xx')).toBe(false);
    expect(isScryfallLanguageCode('')).toBe(false);
  });

  it('defaults to English', () => {
    expect(DEFAULT_SCRYFALL_LANGUAGE).toBe('en');
  });
});

describe('scryfallLanguageLabel', () => {
  it('maps codes to readable names', () => {
    expect(scryfallLanguageLabel('ja')).toBe('Japanese');
    expect(scryfallLanguageLabel(null)).toBe('English');
  });
});
