import { Text, type TextProps } from '@mantine/core';
import {
  type WishlistFinish,
  wishlistFinishColor,
  wishlistFinishLabel,
} from '@/lib/wishlist/finish';

type WishlistFinishLabelProps = TextProps & {
  finish: WishlistFinish;
};

export function WishlistFinishLabel({ finish, ...props }: WishlistFinishLabelProps) {
  const color = wishlistFinishColor(finish);

  return (
    <Text span c={color} fw={color ? 600 : undefined} {...props}>
      {wishlistFinishLabel(finish)}
    </Text>
  );
}
