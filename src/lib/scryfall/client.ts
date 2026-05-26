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
    usd_etched?: string | null;
  };
  image_uris?: {
    normal?: string;
  };
  oracle_text?: string | null;
  flavor_text?: string | null;
  artist?: string | null;
  scryfall_uri?: string;
  card_faces?: Array<{
    name?: string;
    mana_cost?: string | null;
    type_line?: string;
    oracle_text?: string | null;
    flavor_text?: string | null;
    cmc?: number;
    colors?: string[];
    image_uris?: {
      normal?: string;
    };
  }>;
};

export type ScryfallCardFace = NonNullable<ScryfallCard['card_faces']>[number];

export type ScryfallSet = {
  object: 'set';
  code: string;
  name: string;
  released_at?: string;
  icon_svg_uri?: string;
};

export async function scryfallGetSetByCode(setCode: string): Promise<ScryfallSet> {
  const code = setCode.trim().toLowerCase();
  const res = await fetch(`https://api.scryfall.com/sets/${encodeURIComponent(code)}`, {
    headers: { accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Scryfall get set failed');
  return (await res.json()) as ScryfallSet;
}

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

/** Max identifiers per POST /cards/collection (Scryfall API limit). */
export const SCRYFALL_COLLECTION_BATCH_SIZE = 75;

/** Minimum delay between collection requests (2 req/s rate limit). */
export const SCRYFALL_COLLECTION_MIN_INTERVAL_MS = 500;

type ScryfallCollectionResponse = {
  object: 'list';
  data: ScryfallCard[];
  not_found?: unknown[];
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scryfallFetchCollectionBatch(
  scryfallIds: string[],
  options?: { fetchImpl?: typeof fetch },
): Promise<ScryfallCard[]> {
  if (scryfallIds.length === 0) return [];
  if (scryfallIds.length > SCRYFALL_COLLECTION_BATCH_SIZE) {
    throw new Error(`Scryfall collection batch exceeds ${SCRYFALL_COLLECTION_BATCH_SIZE} cards`);
  }

  const fetchImpl = options?.fetchImpl ?? fetch;
  const res = await fetchImpl('https://api.scryfall.com/cards/collection', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      identifiers: scryfallIds.map((id) => ({ id })),
    }),
  });

  if (!res.ok) throw new Error('Scryfall collection fetch failed');

  const body = (await res.json()) as ScryfallCollectionResponse;
  return body.data ?? [];
}

export async function scryfallFetchCollection(
  scryfallIds: string[],
  options?: { delayMs?: number; fetchImpl?: typeof fetch },
): Promise<ScryfallCard[]> {
  if (scryfallIds.length === 0) return [];

  const delayMs = options?.delayMs ?? SCRYFALL_COLLECTION_MIN_INTERVAL_MS;
  const cards: ScryfallCard[] = [];

  for (let offset = 0; offset < scryfallIds.length; offset += SCRYFALL_COLLECTION_BATCH_SIZE) {
    if (offset > 0) await sleep(delayMs);

    const chunk = scryfallIds.slice(offset, offset + SCRYFALL_COLLECTION_BATCH_SIZE);
    cards.push(...(await scryfallFetchCollectionBatch(chunk, options)));
  }

  return cards;
}

export function scryfallPricesFromCard(card: ScryfallCard) {
  return {
    price: card.prices?.usd ?? null,
    foilprice: card.prices?.usd_foil ?? null,
    etchedprice: card.prices?.usd_etched ?? null,
  };
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

/**
 * Fallback when `card_sets.symbol_svg_uri` is missing (code alone is not always correct).
 * @deprecated Prefer stored {@link ScryfallSet.icon_svg_uri} from the database.
 */
export function scryfallSetSymbolUrl(setCode: string | null): string | null {
  const code = setCode?.trim().toLowerCase();
  if (!code) return null;
  return `https://svgs.scryfall.io/sets/${code}.svg`;
}

export function scryfallPrimaryFace(card: ScryfallCard): ScryfallCard | ScryfallCardFace {
  return card.card_faces?.[0] ?? card;
}

export function scryfallFinishAvailability(finishes: string[] | undefined): {
  canAddNonfoil: boolean;
  canAddFoil: boolean;
  canAddEtched: boolean;
} {
  if (!finishes || finishes.length === 0) {
    return { canAddNonfoil: true, canAddFoil: true, canAddEtched: true };
  }
  return {
    canAddNonfoil: finishes.includes('nonfoil'),
    canAddFoil: finishes.includes('foil'),
    canAddEtched: finishes.includes('etched'),
  };
}
