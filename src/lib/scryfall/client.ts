export type ScryfallCard = {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  lang: string;
  released_at?: string;
  rarity?: string;
  tcgplayer_id?: number | null;
  multiverse_ids?: number[];
  cmc?: number;
  type_line?: string;
  mana_cost?: string | null;
  colors?: string[];
  finishes?: string[];
  prices?: {
    usd?: string | null;
    usd_foil?: string | null;
  };
  image_uris?: {
    normal?: string;
  };
  card_faces?: Array<{
    mana_cost?: string | null;
    type_line?: string;
    cmc?: number;
    colors?: string[];
    image_uris?: {
      normal?: string;
    };
  }>;
};

export type ScryfallCardFace = NonNullable<ScryfallCard['card_faces']>[number];

type ScryfallSearchResponse = {
  object: 'list';
  total_cards: number;
  has_more: boolean;
  data: ScryfallCard[];
  code?: string;
};

export async function scryfallSearchPrints(query: string): Promise<ScryfallCard[]> {
  const url = new URL('https://api.scryfall.com/cards/search');
  url.searchParams.set('q', query);
  url.searchParams.set('unique', 'prints');

  const res = await fetch(url, {
    headers: { accept: 'application/json' },
  });

  // Scryfall returns 404 for not_found queries; treat as empty results.
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('Scryfall search failed');

  const body = (await res.json()) as ScryfallSearchResponse;
  if (body.code === 'not_found') return [];
  return body.data ?? [];
}

export async function scryfallGetCardById(id: string): Promise<ScryfallCard> {
  const res = await fetch(`https://api.scryfall.com/cards/${id}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Scryfall get card failed');
  return (await res.json()) as ScryfallCard;
}

export function scryfallImageUrl(card: ScryfallCard): string | null {
  if (card.image_uris?.normal) return card.image_uris.normal;
  if (card.card_faces?.[0]?.image_uris?.normal) return card.card_faces[0].image_uris.normal;
  return null;
}

/** Normal-size front image from a Scryfall printing id (when full card JSON is not available). */
export function scryfallPrintingImageUrl(scryfallId: string | null): string | null {
  if (!scryfallId) return null;
  return `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`;
}

export function scryfallPrimaryFace(card: ScryfallCard): ScryfallCard | ScryfallCardFace {
  return card.card_faces?.[0] ?? card;
}

export function scryfallFinishAvailability(finishes: string[] | undefined): {
  canAddNonfoil: boolean;
  canAddFoil: boolean;
} {
  if (!finishes || finishes.length === 0) {
    return { canAddNonfoil: true, canAddFoil: true };
  }
  return {
    canAddNonfoil: finishes.includes('nonfoil'),
    canAddFoil: finishes.includes('foil') || finishes.includes('etched'),
  };
}
