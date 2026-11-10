'use client';

import classes from './Logo.module.css';
import { CardFan, useFanReplay } from './Page/CardFan';

type LogoProps = {
  /** Wordmark size in px. The cards scale with it. Omit to inherit the parent's font size. */
  size?: number;
  /** Deal the cards out on load. Turn off where another fan is already animating. */
  animated?: boolean;
};

/** Hovering anywhere on the logo, wordmark included, replays the deal-in. */
export function Logo({ size, animated = true }: LogoProps) {
  const { replayKey, replay } = useFanReplay();

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover only replays a decorative animation
    <span
      className={classes.logo}
      style={size ? { fontSize: size } : undefined}
      onMouseEnter={replay}
    >
      <CardFan
        className={classes.mark}
        detailed={false}
        animated={animated}
        replayKey={replayKey}
        decorative
      />
      <span className={classes.word}>bindrr</span>
    </span>
  );
}
