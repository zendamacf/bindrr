import { describe, expect, it } from 'vitest';
import { parseCsv } from './parseCsv';

describe('parseCsv', () => {
  it('parses simple rows and tracks line numbers', () => {
    expect(parseCsv('a,b\n1,2\n3,4')).toEqual([
      { line: 1, fields: ['a', 'b'] },
      { line: 2, fields: ['1', '2'] },
      { line: 3, fields: ['3', '4'] },
    ]);
  });

  it('handles CRLF, a BOM and blank lines', () => {
    expect(parseCsv('﻿a,b\r\n\r\n1,2\r\n')).toEqual([
      { line: 1, fields: ['a', 'b'] },
      { line: 3, fields: ['1', '2'] },
    ]);
  });

  it('handles quoted commas, quotes and line breaks', () => {
    const records = parseCsv('a,b\n"x, y","say ""hi"""\n"multi\nline",z\nlast,row');
    expect(records[1].fields).toEqual(['x, y', 'say "hi"']);
    expect(records[2]).toEqual({ line: 3, fields: ['multi\nline', 'z'] });
    expect(records[3].line).toBe(5);
  });

  it('keeps empty fields', () => {
    expect(parseCsv('a,b,c\n1,,3')[1].fields).toEqual(['1', '', '3']);
  });
});
