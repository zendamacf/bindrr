import { Text, type TextProps } from '@mantine/core';
import { finishLabel, finishMantineColorFromFlags } from '@/lib/collection/finish';

type FinishLabelProps = TextProps & {
  foil: boolean;
  etched: boolean;
};

export function FinishLabel({ foil, etched, ...props }: FinishLabelProps) {
  const color = finishMantineColorFromFlags(foil, etched);
  const isSpecialFinish = foil || etched;

  return (
    <Text span c={color} fw={isSpecialFinish ? 600 : undefined} {...props}>
      {finishLabel(foil, etched)}
    </Text>
  );
}
