import { finishLabel } from '@/lib/collection/finish';
import type { CardSearchResult, CollectionCard } from '@/lib/collection/types';
import { formatMoney } from '@/utils/formatMoney';
import type { CardPreviewDetails } from './types';

function formatUsd(raw: string | null): string {
  if (!raw) return '—';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '—';
  return `$${n.toFixed(2)}`;
}

export function previewFromSearchResult(result: CardSearchResult): CardPreviewDetails {
  const languageSuffix = result.language ? ` · ${result.language}` : '';
  return {
    name: result.name,
    imageUrl: result.imageUrl,
    metaLines: [
      `${result.setName} (${result.setCode}) · #${result.collectorNumber}${languageSuffix}`,
      `Price: ${formatUsd(result.priceUsd)} · Foil: ${formatUsd(result.priceUsdFoil)} · Etched: ${formatUsd(result.priceUsdEtched)}`,
    ],
  };
}

export function previewFromCollectionCard(card: CollectionCard): CardPreviewDetails {
  const languageSuffix = card.language ? ` · ${card.language}` : '';
  const priceLabel = formatMoney(card.price, card.currencyCode) ?? '—';
  const foilLabel = finishLabel(card.foil, card.etched);

  return {
    name: card.name,
    imageUrl: card.imageUrl,
    metaLines: [
      `${card.setName} (${card.setCode})${languageSuffix}`,
      `${card.rarity ?? '—'} · Qty ${card.quantity} · ${foilLabel} · ${priceLabel}`,
    ],
  };
}
