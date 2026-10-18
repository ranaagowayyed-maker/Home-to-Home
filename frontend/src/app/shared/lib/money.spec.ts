import { formatMoney, toMajorUnits, toMinorUnits } from './money';

describe('money', () => {
  it('formats minor units in the configured currency with two decimals', () => {
    expect(formatMoney(1250)).toBe('$12.50');
    expect(formatMoney(5)).toBe('$0.05');
    expect(formatMoney(100000)).toBe('$1,000.00');
  });

  it('accepts an explicit currency', () => {
    expect(formatMoney(1250, 'EUR')).toBe('€12.50');
  });

  it('converts between major and minor units without float drift', () => {
    expect(toMinorUnits('12.50')).toBe(1250);
    expect(toMinorUnits('0.29')).toBe(29);
    expect(toMinorUnits('19.99')).toBe(1999);
    expect(toMajorUnits(1250)).toBe('12.50');
  });
});
