import { finishLabel } from '@/lib/collection/finish';
import type { CardSearchResult, CollectionCard } from '@/lib/collection/types';
import { scryfallLanguageLabel } from '@/lib/scryfall/languages';
import { formatMoney } from '@/utils/formatMoney';
import type { CardPreviewDetails } from './types';

function formatPrice(amount: number | null, currencyCode: string): string {
  return formatMoney(amount, currencyCode) ?? '—';
}

export function previewFromSearchResult(result: CardSearchResult): CardPreviewDetails {
  const { currencyCode } = result;
  return {
    name: result.name,
    imageUrl: result.imageUrl,
    metaLines: [
      `${result.setName} (${result.setCode}) · #${result.collectorNumber} · ${scryfallLanguageLabel(result.languageCode)}`,
      `Price: ${formatPrice(result.price, currencyCode)} · Foil: ${formatPrice(result.priceFoil, currencyCode)} · Etched: ${formatPrice(result.priceEtched, currencyCode)}`,
    ],
    foil: false,
    etched: false,
  };
}

export function previewFromCollectionCard(card: CollectionCard): CardPreviewDetails {
  const priceLabel = formatMoney(card.price, card.currencyCode) ?? '—';
  const foilLabel = finishLabel(card.foil, card.etched);

  return {
    name: card.name,
    imageUrl: card.imageUrl,
    metaLines: [
      `${card.setName} (${card.setCode}) · ${card.language}`,
      `${card.rarity ?? '—'} · Qty ${card.quantity} · ${foilLabel} · ${priceLabel}`,
    ],
    foil: card.foil,
    etched: card.etched,
  };
}
