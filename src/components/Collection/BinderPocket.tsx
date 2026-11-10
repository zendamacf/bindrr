import type { CSSProperties, ReactNode } from 'react';
import { FinishCardImage } from '@/components/Card/FinishCardImage';
import classes from './BinderPocket.module.css';
import { RaritySwatch } from './RaritySwatch';

/** The grid that holds pockets. Keep `key` tied to the page so turning a page replays the deal-in. */
export function BinderGrid({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <ul className={classes.grid} data-testid={testId}>
      {children}
    </ul>
  );
}

type BinderPocketProps = {
  name: string;
  imageUrl: string | null;
  foil: boolean;
  etched: boolean;
  /** Shown as a pill on the card art when above 1. */
  quantity: number;
  rarityCode: string | null;
  setCode: string;
  /** Finish and language labels, shown after the set code. */
  tags?: ReactNode;
  price: string;
  /** Right of the price, such as a trend badge. */
  priceAside?: ReactNode;
  /** Position on the page; staggers the deal-in animation. */
  index: number;
  onOpen: () => void;
  testId: string;
};

/** One sleeve in a binder page. The whole sleeve opens the card. */
export function BinderPocket({
  name,
  imageUrl,
  foil,
  etched,
  quantity,
  rarityCode,
  setCode,
  tags,
  price,
  priceAside,
  index,
  onOpen,
  testId,
}: BinderPocketProps) {
  return (
    <li className={classes.pocket} style={{ '--i': index } as CSSProperties} data-testid={testId}>
      <div className={classes.art}>
        {imageUrl ? (
          <FinishCardImage
            src={imageUrl}
            width={488}
            height={680}
            foil={foil}
            etched={etched}
            borderRadius={9}
            style={{ width: '100%' }}
          />
        ) : (
          <span className={classes.noArt}>No image</span>
        )}
        {quantity > 1 && <span className={classes.qty}>×{quantity}</span>}
      </div>

      <button
        type="button"
        className={classes.caption}
        aria-label={`Open ${name}`}
        onClick={onOpen}
      >
        <span className={classes.name} title={name}>
          {name}
        </span>
        <span className={classes.meta}>
          <RaritySwatch rarityCode={rarityCode} size={12} />
          <span className={classes.setCode}>{setCode}</span>
          {tags}
        </span>
        <span className={classes.priceRow}>
          <span className={`${classes.price} numeric`}>{price}</span>
          {priceAside}
        </span>
      </button>
    </li>
  );
}
