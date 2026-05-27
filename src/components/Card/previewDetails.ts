import { finishLabel } from '@/lib/collection/finish';
import type { CardSearchResult, CollectionCard } from '@/lib/collection/types';
import { scryfallLanguageLabel } from '@/lib/scryfall/languages';
import { formatMoney } from '@/utils/formatMoney';
import type { CardPreviewDetails } from './types';

function formatUsd(raw: string | null): string {
  if (!raw) return '—';
  const n = Number(raw);
  return formatMoney(Number.isFinite(n) ? n : null, 'USD') ?? '—';
}

export function previewFromSearchResult(result: CardSearchResult): CardPreviewDetails {
  return {
    name: result.name,
    imageUrl: result.imageUrl,
    metaLines: [
      `${result.setName} (${result.setCode}) · #${result.collectorNumber} · ${scryfallLanguageLabel(result.languageCode)}`,
      `Price: ${formatUsd(result.priceUsd)} · Foil: ${formatUsd(result.priceUsdFoil)} · Etched: ${formatUsd(result.priceUsdEtched)}`,
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
