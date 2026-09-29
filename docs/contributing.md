# Contributing

## Workflow

1. Fork / branch from `main`.
2. Make focused changes with tests where behavior changes.
3. Run `npm run lint`, `npm run typecheck`, and `npm test` (or `npm run test:coverage`).
4. Add a **changeset** for user-visible changes (see below).
5. Open a pull request.

## Changesets

This repo uses [Changesets](https://github.com/changesets/changesets) for version notes:

```bash
npm run changeset
```

Choose `patch`, `minor`, or `major` for the `bindrr` package. CI and maintainers run `npm run changeset:version` when cutting releases.

Dependabot PRs may include auto-generated changeset files under `.changeset/`.

## Docker image releases

Tagging `v*` triggers `.github/workflows/publish-docker.yml`, which pushes `ghcr.io/zendamacf/bindrr:<tag>`.

## Code style

- Formatting and lint: **Biome** (`npm run lint:fix`).
- Prefer importing route paths from `src/routes.ts` instead of string literals.
