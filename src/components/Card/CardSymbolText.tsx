'use client';

import { Text, type TextProps } from '@mantine/core';
import Image from 'next/image';
import {
  reportUnknownScryfallSymbol,
  scryfallSymbolSvgUri,
  splitScryfallSymbolText,
} from '@/lib/scryfall/symbology';

type CardSymbolTextProps = TextProps & {
  text: string;
  symbolSize?: number;
};

function partKey(part: { kind: string; value: string }, index: number): string {
  return `${index}-${part.kind}-${part.value}`;
}

export function CardSymbolText({ text, symbolSize = 16, ...textProps }: CardSymbolTextProps) {
  const parts = splitScryfallSymbolText(text);

  return (
    <Text span {...textProps}>
      {parts.map((part, index) => {
        const key = partKey(part, index);

        if (part.kind === 'text') {
          return <span key={key}>{part.value}</span>;
        }

        const uri = scryfallSymbolSvgUri(part.value);
        if (!uri) {
          reportUnknownScryfallSymbol(part.value);
          return <span key={key}>{part.value}</span>;
        }

        return (
          <Image
            key={key}
            src={uri}
            alt={part.value}
            width={symbolSize}
            height={symbolSize}
            unoptimized
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginInline: 1,
            }}
          />
        );
      })}
    </Text>
  );
}
