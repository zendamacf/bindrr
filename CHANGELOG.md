# bindrr

## 3.0.0

### Major Changes

- 359a8db: Self-host with Docker Compose instead of Vercel.

### Patch Changes

- abd0607: Updated baseline-browser-mapping from 2.10.32 to 2.11.21 (version-update:semver-minor).
- 215caed: Updated brace-expansion from 5.0.6 to 5.0.7 (version-update:semver-patch).
- ee216f7: Updated brace-expansion from 5.0.7 to 5.0.8 (version-update:semver-patch).
- 8f638fa: Updated brace-expansion from 5.0.8 to 5.0.9 (version-update:semver-patch).
- 4c2b83c: Updated browserslist from 4.28.2 to 4.28.9 (version-update:semver-patch).
- a4a31ff: Updated @sentry/nextjs, @types/node (version-update:semver-minor).
- 341a10b: Updated @sentry/nextjs, @biomejs/biome, @types/node, @vitest/coverage-v8, typescript, vitest (version-update:semver-major).
- 0cbabb0: Updated recharts, vite (version-update:semver-patch).
- d141195: Updated @sentry/nextjs, recharts, @biomejs/biome, @types/node, vite (version-update:semver-minor).
- d81ee12: Updated @sentry/nextjs, jose, recharts, @biomejs/biome, @types/node, postcss, vite (version-update:semver-minor).
- 0b1217b: Updated @tanstack/react-query, jose, recharts, @biomejs/biome (version-update:semver-minor).
- 4309853: Updated jose (version-update:semver-patch).
- c75d81e: Updated @sentry/nextjs, @tanstack/react-query, @biomejs/biome, @changesets/cli, vite (version-update:semver-minor).
- 078d055: Updated @biomejs/biome (version-update:semver-patch).
- d66a5a1: Updated @sentry/nextjs, @tanstack/react-query, recharts, @biomejs/biome, @types/node, vite (version-update:semver-major).
- fa19e1b: Updated @sentry/nextjs, jose, @biomejs/biome, @types/node, postcss, vite (version-update:semver-minor).
- 0c446e2: Updated @tanstack/react-query, postcss (version-update:semver-patch).
- 715f57e: Updated jose, @types/node (version-update:semver-major).
- 2cf8942: Updated fast-uri from 3.1.2 to 3.1.4 (version-update:semver-patch).
- 1fcbc12: Updated fast-uri from 3.1.4 to 3.1.5 (version-update:semver-patch).
- 7fa93cf: Updated fast-uri from 3.1.5 to 3.1.7 (version-update:semver-patch).
- 23305fd: Updated @mantine/charts, @mantine/core, @mantine/hooks, @mantine/notifications (version-update:semver-patch).
- 9675e87: Updated @mantine/charts, @mantine/core, @mantine/hooks, @mantine/notifications (version-update:semver-patch).
- d8cffcf: Updated @mantine/charts, @mantine/core, @mantine/hooks, @mantine/notifications (version-update:semver-minor).
- a68aea1: Updated postcss, next.
- ab06cb9: Updated js-yaml, @changesets/cli.
- 3a12c28: Updated nanoid from 3.3.17 to 3.3.19 (version-update:semver-patch).
- 9f827b7: Updated next from 16.2.9 to 16.2.11 (version-update:semver-patch).
- 6ddfdda: Updated next from 16.3.0 to 16.3.4 (version-update:semver-patch).
- 16b7141: Updated postcss from 8.5.16 to 8.5.18 (version-update:semver-patch).
- d710197: Updated postcss-selector-parser from 7.1.0 to 7.1.5 (version-update:semver-patch).
- 2ee2be8: Updated react, react-dom (version-update:semver-patch).
- 84d36b1: Updated @types/react, @types/react-dom (version-update:semver-patch).
- 2d63b2e: Updated sharp from 0.35.3 to 0.35.4 (version-update:semver-patch).
- 5c54430: Updated vitest from 4.1.10 to 4.1.11 (version-update:semver-patch).

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
