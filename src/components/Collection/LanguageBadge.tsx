import { Badge } from '@mantine/core';
import { DEFAULT_SCRYFALL_LANGUAGE, normalizeScryfallLanguageCode } from '@/lib/scryfall/languages';

type LanguageBadgeProps = {
  languageCode: string | null | undefined;
};

export function LanguageBadge({ languageCode }: LanguageBadgeProps) {
  const code = normalizeScryfallLanguageCode(languageCode);
  if (code === DEFAULT_SCRYFALL_LANGUAGE) return null;

  return (
    <Badge size="xs" variant="light">
      {code.toUpperCase()}
    </Badge>
  );
}
