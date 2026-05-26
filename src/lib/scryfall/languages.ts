/** Scryfall `lang` codes — https://scryfall.com/docs/api/languages */
export const SCRYFALL_LANGUAGE_CODES = [
  'en',
  'es',
  'fr',
  'de',
  'it',
  'pt',
  'ja',
  'ko',
  'ru',
  'zhs',
  'zht',
  'he',
  'la',
  'grc',
  'ar',
  'sa',
  'ph',
  'qya',
] as const;

export type ScryfallLanguageCode = (typeof SCRYFALL_LANGUAGE_CODES)[number];

export const SCRYFALL_LANGUAGES: { value: ScryfallLanguageCode; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ru', label: 'Russian' },
  { value: 'zhs', label: 'Simplified Chinese' },
  { value: 'zht', label: 'Traditional Chinese' },
  { value: 'he', label: 'Hebrew' },
  { value: 'la', label: 'Latin' },
  { value: 'grc', label: 'Ancient Greek' },
  { value: 'ar', label: 'Arabic' },
  { value: 'sa', label: 'Sanskrit' },
  { value: 'ph', label: 'Phyrexian' },
  { value: 'qya', label: 'Quenya' },
];

const LANGUAGE_CODE_SET = new Set<string>(SCRYFALL_LANGUAGE_CODES);

export function isScryfallLanguageCode(value: string): value is ScryfallLanguageCode {
  return LANGUAGE_CODE_SET.has(value);
}

export const DEFAULT_SCRYFALL_LANGUAGE: ScryfallLanguageCode = 'en';

export function normalizeScryfallLanguageCode(code: string | null | undefined): string {
  return (code ?? DEFAULT_SCRYFALL_LANGUAGE).trim().toLowerCase();
}

export function scryfallLanguageLabel(code: string | null | undefined): string {
  const normalized = normalizeScryfallLanguageCode(code);
  const entry = SCRYFALL_LANGUAGES.find((language) => language.value === normalized);
  return entry?.label ?? normalized.toUpperCase();
}
