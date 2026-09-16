# bindrr

## 2.1.2

### Patch Changes

- 329f076: Updated vite from 8.0.14 to 8.0.16 (version-update:semver-patch).
- ca5a535: Updated @biomejs/biome from 2.4.15 to 2.5.0 (version-update:semver-minor).
- edd75bf: Updated drizzle-kit from 0.31.4 to 0.31.10 (version-update:semver-patch).
- cb04751: Updated @mantine from 9.3.2 to 9.4.1 (version-update:semver-minor).
- 76e7e90: Updated react-dom, @types/react-dom (version-update:semver-minor).
- f9fb2c5: Updated @opentelemetry/core, @sentry/nextjs.
- 8d092fe: Updated react, @types/react (version-update:semver-minor).
- e4eb16d: Updated next from 16.2.6 to 16.2.9 (version-update:semver-patch).
- 06f6354: Updated postgres from 3.4.7 to 3.4.9 (version-update:semver-patch).
- 400bb9d: Updated @tanstack/react-query from 5.83.0 to 5.101.0 (version-update:semver-minor).
- b15e775: Updated @types/bcryptjs from 2.4.6 to 3.0.0 (version-update:semver-major).
- c8ac6bc: Updated typescript from 5.8.3 to 6.0.3 (version-update:semver-major).
- 9f60e67: Updated @vercel/analytics from 1.5.0 to 2.0.1 (version-update:semver-major).
- 89e5690: Updated vitest from 4.1.7 to 4.1.9 (version-update:semver-patch).
- 9689cca: Updated Mantine from 8.2.1 to 9.3.2, recharts from 2.15.4 to 3.8.1.
- 9144761: Improved duration of tests.
- be34ea6: Added CI workflow to automatically create changesets for Dependabot pull requests.

## 2.1.1

### Patch Changes

- ed6353d: Fixed error when syncing prices.
- c3f563b: Added pagination when searching for new cards to add to your collection.
- 41d7ec3: Improved number of cards processed in Vercel's maximum cron time.
- c3f563b: Improved responsiveness of whole app.
- a1ec129: Fixed 400 errors from Scryfall API due to default user agent.

## 2.1.0

### Minor Changes

- c2b3da2: Added daily re-syncing of updated pricing from Scryfall. Historical pricing history will also be maintained.

### Patch Changes

- faf309e: Added caching of exchange rates, card sets, and Scryfall's extended card details.
- 8e3fbd3: Added pricing trends over the last 30 days.
- f1fbb54: Added language selector when adding new cards to your collection.
- 501e05c: Improved logging of internal errors.
- fe87e2d: Added preferred currency setting, which is used to convert all displayed prices.
- 84345f1: Added loading animation while login form is submitting.
- 8e3fbd3: Added price history modal when viewing a card.
- b257311: Improved currency formatting.
- ce6fd84: Slightly improved speed of collection-based tests.
- 77e0941: Added set symbol & rarity swatch in collection filters.
- c2b3da2: Added Pino logger for server-side API requests.
- 228a329: Fixed height of currency selector requiring scrolling.

## 2.0.0

Ground-up rewrite from Python to Typescript.

### Ported

- Collection management.
- Pulling card & set data from TCGPlayer.

### Not included

- Decks management.
- Pulling market prices from TCGPlayer.
- Price history.

### Newly added

- Tests.
- Pulling prices from Scryfall.
- Etched card finish support.
