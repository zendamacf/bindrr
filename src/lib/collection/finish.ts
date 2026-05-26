import type { DefaultMantineColor } from '@mantine/core';

export type CardFinish = 'nonfoil' | 'foil' | 'etched';

/** Mantine color tokens for finish UI (buttons, labels, price hints). */
export const FINISH_MANTINE_COLOR: Record<CardFinish, DefaultMantineColor | undefined> = {
  nonfoil: undefined,
  foil: 'cyan',
  etched: 'violet',
};

export function finishMantineColor(finish: CardFinish): DefaultMantineColor | undefined {
  return FINISH_MANTINE_COLOR[finish];
}

export function finishMantineColorFromFlags(
  foil: boolean,
  etched: boolean,
): DefaultMantineColor | undefined {
  return finishMantineColor(finishFromFlags(foil, etched));
}

export function finishFlags(finish: CardFinish): { foil: boolean; etched: boolean } {
  switch (finish) {
    case 'foil':
      return { foil: true, etched: false };
    case 'etched':
      return { foil: false, etched: true };
    default:
      return { foil: false, etched: false };
  }
}

export function finishFromFlags(foil: boolean, etched: boolean): CardFinish {
  if (etched) return 'etched';
  if (foil) return 'foil';
  return 'nonfoil';
}

export function finishLabel(foil: boolean, etched: boolean): string {
  if (etched) return 'Etched';
  if (foil) return 'Foil';
  return 'Non-foil';
}

export function finishLabelForFinish(finish: CardFinish): string {
  const { foil, etched } = finishFlags(finish);
  return finishLabel(foil, etched);
}

export const CARD_FINISHES: CardFinish[] = ['nonfoil', 'foil', 'etched'];

export function addingKeyForFinish(scryfallId: string, finish: CardFinish): string {
  return `${scryfallId}:${finish}`;
}
