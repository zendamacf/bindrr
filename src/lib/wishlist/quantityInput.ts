/** The value of a quantity field. The field is empty ('') while the user types a new number. */
export type QuantityInput = number | '';

/** Converts the value of a number field to a quantity input. Anything that is not a number is empty. */
export function toQuantityInput(value: string | number): QuantityInput {
  return typeof value === 'number' && Number.isFinite(value) ? value : '';
}

/** True when the value is a whole number from 1 to the maximum (if there is a maximum). */
export function isValidQuantity(value: QuantityInput, max?: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    (max === undefined || value <= max)
  );
}
