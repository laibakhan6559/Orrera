import { describe, expect, it } from 'vitest';
import {
  NOT_IN_DATASET,
  cToF,
  fToC,
  formatDistance,
  formatGravity,
  formatLength,
  formatMass,
  formatNumber,
  formatOrbitalPeriod,
  formatRotation,
  formatScientific,
  formatTemperature,
  kmToMiles,
  milesToKm,
} from '@/utils/units';

describe('conversions', () => {
  it('converts km and miles both ways', () => {
    expect(kmToMiles(1.609344)).toBeCloseTo(1, 10);
    expect(milesToKm(1)).toBeCloseTo(1.609344, 10);
  });

  it('converts Celsius and Fahrenheit both ways', () => {
    expect(cToF(100)).toBe(212);
    expect(cToF(-40)).toBe(-40);
    expect(fToC(32)).toBe(0);
  });
});

describe('formatScientific', () => {
  it('writes large numbers with superscript exponents', () => {
    expect(formatScientific(5.97e24)).toBe('5.97 × 10²⁴');
    expect(formatScientific(1.9884e30)).toBe('1.99 × 10³⁰');
    expect(formatScientific(3.3e23)).toBe('3.3 × 10²³');
  });

  it('writes ordinary numbers plainly', () => {
    expect(formatScientific(123)).toBe('123');
  });

  it('handles missing values', () => {
    expect(formatScientific(null)).toBe(NOT_IN_DATASET);
    expect(formatScientific(undefined)).toBe(NOT_IN_DATASET);
    expect(formatScientific(Number.NaN)).toBe(NOT_IN_DATASET);
  });
});

describe('formatters', () => {
  it('formats numbers with grouping', () => {
    expect(formatNumber(12756, 0)).toBe('12,756');
    expect(formatNumber(null)).toBe(NOT_IN_DATASET);
  });

  it('formats lengths in both unit systems', () => {
    expect(formatLength(12756, 'metric')).toBe('12,756 km');
    expect(formatLength(12756, 'imperial')).toBe('7,926 mi');
  });

  it('formats large distances', () => {
    expect(formatDistance(149_600_000)).toBe('149.6 million km');
    expect(formatDistance(1_432_000_000)).toBe('1.43 billion km');
    expect(formatDistance(149_600_000, 'imperial')).toBe('93 million mi');
  });

  it('formats mass and gravity', () => {
    expect(formatMass(5.97e24)).toBe('5.97 × 10²⁴ kg');
    expect(formatGravity(9.8)).toBe('9.8 m/s²');
    expect(formatGravity(9.8, 'imperial')).toBe('32.2 ft/s²');
  });

  it('formats temperatures including negatives', () => {
    expect(formatTemperature(15)).toBe('15 °C');
    expect(formatTemperature(15, 'imperial')).toBe('59 °F');
    expect(formatTemperature(-65, 'imperial')).toBe('-85 °F');
  });

  it('formats orbital periods', () => {
    expect(formatOrbitalPeriod(365.2)).toBe('365.2 days');
    expect(formatOrbitalPeriod(687)).toBe('687 days (1.9 Earth years)');
  });

  it('formats rotation and flags retrograde spin', () => {
    expect(formatRotation(23.9)).toBe('23.9 hours');
    expect(formatRotation(-5832.5)).toBe('5,832.5 hours (243 days), retrograde');
    expect(formatRotation(null)).toBe(NOT_IN_DATASET);
  });
});
