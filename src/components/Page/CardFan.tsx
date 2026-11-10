import classes from './CardFan.module.css';

/** The logo's fanned cards, drawn large. They deal out from a stack once on load. */
export function CardFan({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-1 -1 48 46"
      role="img"
      aria-label="Three fanned cards"
      className={[classes.fan, className].filter(Boolean).join(' ')}
    >
      <defs>
        <linearGradient id="fan-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.75" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className={classes.back}>
        <rect width="25" height="35" rx="3" fill="#9c7fb6" />
      </g>
      <g className={classes.middle}>
        <rect width="25" height="35" rx="3" fill="#7b549e" />
      </g>
      <g className={classes.front}>
        <rect width="25" height="35" rx="3" fill="#5b2a86" />
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
      </g>
    </svg>
  );
}
