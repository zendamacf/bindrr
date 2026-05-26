import type { ScryfallCard } from './client';
import { scryfallPrimaryFace } from './client';

export type ScryfallCardExtendedDetails = {
  manaCost: string | null;
  typeLine: string | null;
  oracleText: string | null;
  flavorText: string | null;
  artist: string | null;
  releasedAt: string | null;
};

function oracleText(card: ScryfallCard): string | null {
  if (card.card_faces && card.card_faces.length > 0) {
    const parts = card.card_faces
      .map((face, index) => {
        if (!face.oracle_text) return null;
        const label = face.name ?? `Face ${index + 1}`;
        return `${label}\n${face.oracle_text}`;
      })
      .filter((part): part is string => part != null);
    if (parts.length > 0) return parts.join('\n\n');
  }
  return card.oracle_text ?? null;
}

function flavorText(card: ScryfallCard): string | null {
  if (card.flavor_text) return card.flavor_text;
  const fromFace = card.card_faces?.find((f) => f.flavor_text)?.flavor_text;
  return fromFace ?? null;
}

export function mapScryfallExtendedDetails(card: ScryfallCard): ScryfallCardExtendedDetails {
  const face = scryfallPrimaryFace(card);
  const manaCost = 'mana_cost' in face ? (face.mana_cost ?? null) : (card.mana_cost ?? null);
  const typeLine = 'type_line' in face ? (face.type_line ?? null) : (card.type_line ?? null);

  return {
    manaCost,
    typeLine,
    oracleText: oracleText(card),
    flavorText: flavorText(card),
    artist: card.artist ?? null,
    releasedAt: card.released_at ?? null,
  };
}
