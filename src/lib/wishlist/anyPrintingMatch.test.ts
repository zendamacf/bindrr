import { describe, expect, it } from 'vitest';
import { cheapestMatchingPrinting, countOwnedCopies } from './anyPrintingMatch';

const p = (
  printingId: number,
  price: string | null,
  foilprice: string | null = null,
  etchedprice: string | null = null,
) => ({ printingId, price, foilprice, etchedprice });

describe('cheapestMatchingPrinting', () => {
  const printings = [p(1, '2.00', '0.50'), p(2, '1.00'), p(3, '0.10', null, '5')];

  it('returns the lowest price across printings and finishes for any/any', () => {
    const result = cheapestMatchingPrinting(printings, 'any');
    expect(result).toMatchObject({ finish: 'nonfoil', price: 0.1 });
    expect(result?.printing.printingId).toBe(3);
  });

  it('respects the finish restriction', () => {
    const result = cheapestMatchingPrinting(printings, 'foil');
    expect(result?.printing.printingId).toBe(1);
    expect(result?.price).toBe(0.5);
  });

  it('returns null when no matching printing has a price', () => {
    expect(cheapestMatchingPrinting([p(1, '2.00')], 'etched')).toBeNull();
    expect(cheapestMatchingPrinting([], 'any')).toBeNull();
  });

  it('keeps the first printing on equal prices', () => {
    const result = cheapestMatchingPrinting([p(1, '1.00'), p(2, '1.00')], 'any');
    expect(result?.printing.printingId).toBe(1);
  });
});

describe('countOwnedCopies', () => {
  const copies = [
    { foil: false, etched: false, quantity: 2 },
    { foil: true, etched: false, quantity: 1 },
    { foil: false, etched: true, quantity: 4 },
  ];

  it('counts all copies for any/any', () => {
    expect(countOwnedCopies(copies, 'any')).toBe(7);
  });
  it('filters by finish', () => {
    expect(countOwnedCopies(copies, 'nonfoil')).toBe(2);
    expect(countOwnedCopies(copies, 'foil')).toBe(1);
    expect(countOwnedCopies(copies, 'etched')).toBe(4);
  });
});
