import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BINDER_PAGE_SIZE } from '@/lib/collection/helpers';

const css = readFileSync(join(__dirname, 'BinderPocket.module.css'), 'utf8');

/** Column counts in the binder grid, from `repeat(N, ...)` declarations. */
function binderColumnCounts(): number[] {
  const grid = css.slice(css.indexOf('.grid {'), css.indexOf('.pocket {'));
  return [...grid.matchAll(/repeat\((\d+),/g)].map((match) => Number(match[1]));
}

describe('binder grid', () => {
  it('declares a fixed column count at every breakpoint', () => {
    expect(binderColumnCounts().length).toBeGreaterThanOrEqual(2);
  });

  // A short last row looks broken, so every column count must divide the binder page size.
  it.each(binderColumnCounts())('fills complete rows with %i columns', (columns) => {
    expect(BINDER_PAGE_SIZE % columns).toBe(0);
  });

  it('does not use auto-fill, which would make the row length depend on viewport width', () => {
    const grid = css.slice(css.indexOf('.grid {'), css.indexOf('.pocket {'));
    expect(grid).not.toMatch(/auto-fill|auto-fit/);
  });
});
