import { describe, expect, it } from 'vitest';
import { IMPORT_MAX_ROWS, parseImportRows } from './parseImportRows';

const HEADER = 'set,collector_number,quantity,language,finish';

describe('parseImportRows', () => {
  it('parses valid rows with defaults', () => {
    const result = parseImportRows('set,collector_number,quantity\nLEA,232,2');
    expect(result.fatal).toBeNull();
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      {
        line: 2,
        set: 'lea',
        collectorNumber: '232',
        language: 'en',
        finish: 'nonfoil',
        quantity: 2,
        scryfallId: null,
      },
    ]);
  });

  it('accepts header variants', () => {
    const result = parseImportRows('Set, Collector Number ,QUANTITY\nlea,1,1');
    expect(result.rows).toHaveLength(1);
  });

  it('reads finish, language and boolean columns', () => {
    const result = parseImportRows(`${HEADER}\nlea,1,1,ja,foil\nlea,2,1,,Etched\nlea,3,1,,normal`);
    expect(result.rows.map((r) => [r.language, r.finish])).toEqual([
      ['ja', 'foil'],
      ['en', 'etched'],
      ['en', 'nonfoil'],
    ]);

    const flags = parseImportRows(
      'set,collector_number,quantity,foil,etched\nlea,1,1,yes,\nlea,2,1,,1',
    );
    expect(flags.rows.map((r) => r.finish)).toEqual(['foil', 'etched']);
  });

  it('reports row errors with line numbers', () => {
    const result = parseImportRows(
      `${HEADER}\nlea,1,0,,\nlea,2,x,,\n,3,1,,\nlea,4,1,xx,\nlea,5,1,,shiny\nlea,6,1,,`,
    );
    expect(result.errors.map((e) => e.line)).toEqual([2, 3, 4, 5, 6]);
    expect(result.rows.map((r) => r.line)).toEqual([7]);
  });

  it('rejects foil and etched together', () => {
    const result = parseImportRows('set,collector_number,quantity,foil,etched\nlea,1,1,true,true');
    expect(result.errors).toHaveLength(1);
  });

  it('allows a scryfall_id without set and number', () => {
    const id = '0000579f-7b35-4ed3-b44c-db2a538066fe';
    const result = parseImportRows(`scryfall_id,set,collector_number,quantity\n${id},,,1`);
    expect(result.rows[0].scryfallId).toBe(id);
  });

  it('rejects an invalid scryfall_id', () => {
    const result = parseImportRows('scryfall_id,set,collector_number,quantity\nnope,lea,1,1');
    expect(result.errors).toEqual([{ line: 2, reason: 'Invalid scryfall_id.' }]);
  });

  it('fails on missing required columns and empty files', () => {
    expect(parseImportRows('set,quantity\nlea,1').fatal).toMatch(/collector_number/);
    expect(parseImportRows('').fatal).toMatch(/empty/);
  });

  it('fails when there are too many rows', () => {
    const body = Array.from({ length: IMPORT_MAX_ROWS + 1 }, () => 'lea,1,1').join('\n');
    expect(parseImportRows(`set,collector_number,quantity\n${body}`).fatal).toMatch(/more than/);
  });
});
