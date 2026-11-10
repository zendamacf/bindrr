'use client';

import { useRef, useState } from 'react';
import classes from './CardFan.module.css';

/** Long enough for the deal-in to finish, so hovering can't restart it mid-animation. */
const REPLAY_COOLDOWN_MS = 1100;

/** Returns a number that changes when the animation should replay, and a trigger for it. */
export function useFanReplay() {
  const [count, setCount] = useState(0);
  const lastPlayed = useRef(0);

  const replay = () => {
    const now = Date.now();
    if (now - lastPlayed.current < REPLAY_COOLDOWN_MS) return;
    lastPlayed.current = now;
    setCount((c) => c + 1);
  };

  return { replayKey: count, replay };
}

type CardFanProps = {
  className?: string;
  /** Adds the front card's inset frame and foil sheen. Turn off at small sizes. */
  detailed?: boolean;
  /** Deal the cards out from a stack on mount. Hovering replays it either way. */
  animated?: boolean;
  /** Hide from assistive tech when text beside it already names the brand. */
  decorative?: boolean;
  /** Replay when this changes. Use `useFanReplay` when a larger area should trigger it. */
  replayKey?: number;
  /** Replay when the pointer enters the fan itself. */
  replayOnHover?: boolean;
};

/** The logo's fanned cards. They deal out from a stack on load and again on hover. */
export function CardFan({
  className,
  detailed = true,
  animated = true,
  decorative = false,
  replayKey = 0,
  replayOnHover = false,
}: CardFanProps) {
  const own = useFanReplay();
  const playCount = replayKey + own.replayKey;
  // Without a deal-in on mount, the cards start fanned and only animate once replayed.
  const still = !animated && playCount === 0;

  return (
    <svg
      viewBox="-1 -1 48 46"
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': 'Three fanned cards' })}
      className={[classes.fan, still ? classes.still : null, className].filter(Boolean).join(' ')}
      onMouseEnter={replayOnHover ? own.replay : undefined}
    >
      {detailed && (
        <defs>
          <linearGradient id="fan-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#fff" stopOpacity="0.22" />
            <stop offset="0.75" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {/* Remounting the group restarts the CSS animation on its cards. */}
      <g key={playCount}>
        <g className={classes.back}>
          <rect width="25" height="35" rx="3" fill="#9c7fb6" />
        </g>
        <g className={classes.middle}>
          <rect width="25" height="35" rx="3" fill="#7b549e" />
        </g>
        <g className={classes.front}>
          <rect width="25" height="35" rx="3" fill="#5b2a86" />
          {detailed && (
            <>
              <rect
                x="1.6"
                y="1.6"
                width="21.8"
                height="31.8"
                rx="1.8"
                fill="none"
                stroke="#fff"
                strokeOpacity="0.2"
                strokeWidth="0.4"
              />
              <rect width="25" height="35" rx="3" fill="url(#fan-sheen)" />
            </>
          )}
        </g>
      </g>
    </svg>
  );
}
