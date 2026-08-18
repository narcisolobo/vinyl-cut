import { isVariantAvailable } from '../is-variant-available';

describe('isVariantAvailable', () => {
  it('returns false for zero stock', () => {
    expect(isVariantAvailable(0)).toBe(false);
  });

  it('returns false when availability is null or undefined', () => {
    expect(isVariantAvailable(null)).toBe(false);
    expect(isVariantAvailable(undefined)).toBe(false);
  });

  it('returns true for positive stock', () => {
    expect(isVariantAvailable(1)).toBe(true);
    expect(isVariantAvailable(12)).toBe(true);
  });
});
