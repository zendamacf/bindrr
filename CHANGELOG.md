# bindrr

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
