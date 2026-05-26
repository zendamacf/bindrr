export type CardFinish = 'nonfoil' | 'foil' | 'etched';

/** Mantine color tokens for finish UI (buttons, labels, price hints). */
export const FINISH_MANTINE_COLOR: Record<CardFinish, string> = {
  nonfoil: 'green',
  foil: 'orange',
  etched: 'violet',
};

export function finishMantineColor(finish: CardFinish): string {
  return FINISH_MANTINE_COLOR[finish];
}

export function finishMantineColorFromFlags(foil: boolean, etched: boolean): string {
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

export function addingKeyForFinish(scryfallId: string, finish: CardFinish): string {
  return `${scryfallId}:${finish}`;
}
