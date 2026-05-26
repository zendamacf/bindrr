export function printingFinishAvailability(
  price: string | null,
  foilprice: string | null,
  etchedprice: string | null,
): { canAddNonfoil: boolean; canAddFoil: boolean; canAddEtched: boolean } {
  const hasNonfoil = price != null;
  const hasFoil = foilprice != null;
  const hasEtched = etchedprice != null;

  if (!hasNonfoil && !hasFoil && !hasEtched) {
    return { canAddNonfoil: true, canAddFoil: true, canAddEtched: true };
  }

  return {
    canAddNonfoil: hasNonfoil,
    canAddFoil: hasFoil,
    canAddEtched: hasEtched,
  };
}
