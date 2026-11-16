/**
 * Unit conversion and display formatting.
 *
 * Every formatter returns "Not in this dataset" for missing values, so the UI
 * never shows a made-up number.
 */

export type UnitSystem = 'metric' | 'imperial';

export const NOT_IN_DATASET = 'Not in this dataset';

export const KM_PER_MILE = 1.609344;
export const FT_PER_M = 3.280839895;
export const LB_PER_KG = 2.2046226218;
/** 1 kg/m^3 expressed in lb/ft^3. */
export const LB_FT3_PER_KG_M3 = 0.0624279606;

type Maybe = number | null | undefined;

const isNum = (v: Maybe): v is number => typeof v === 'number' && Number.isFinite(v);

export const kmToMiles = (km: number) => km / KM_PER_MILE;
export const milesToKm = (mi: number) => mi * KM_PER_MILE;
export const cToF = (c: number) => (c * 9) / 5 + 32;
export const fToC = (f: number) => ((f - 32) * 5) / 9;
export const msToFts = (ms: number) => ms * FT_PER_M;
export const kgToLb = (kg: number) => kg * LB_PER_KG;

/** 1,234.5 style number with a limited number of decimals (trailing zeros dropped). */
export function formatNumber(value: Maybe, maxFractionDigits = 1): string {
  if (!isNum(value)) return NOT_IN_DATASET;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
};

export const toSuperscript = (n: number) =>
  String(n)
    .split('')
    .map((c) => SUPERSCRIPT[c] ?? c)
    .join('');

/** 5.972e24 -> "5.97 × 10²⁴". Values between 0.01 and 10,000 are written plainly. */
export function formatScientific(value: Maybe, sigDigits = 3): string {
  if (!isNum(value)) return NOT_IN_DATASET;
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 0.01 && abs < 10000) {
    return formatNumber(Number(value.toPrecision(sigDigits)), 4);
  }
  const exponent = Math.floor(Math.log10(abs));
  const mantissa = value / Math.pow(10, exponent);
  const rounded = Number(mantissa.toPrecision(sigDigits));
  // Rounding can push 9.999 up to 10.0; renormalise.
  if (Math.abs(rounded) >= 10) {
    return `${formatNumber(rounded / 10, sigDigits - 1)} × 10${toSuperscript(exponent + 1)}`;
  }
  return `${formatNumber(rounded, sigDigits - 1)} × 10${toSuperscript(exponent)}`;
}

export function formatLength(km: Maybe, system: UnitSystem = 'metric'): string {
  if (!isNum(km)) return NOT_IN_DATASET;
  return system === 'metric'
    ? `${formatNumber(km, 0)} km`
    : `${formatNumber(kmToMiles(km), 0)} mi`;
}

/** Large distances: "149.6 million km", "4.52 billion km". */
export function formatDistance(km: Maybe, system: UnitSystem = 'metric'): string {
  if (!isNum(km)) return NOT_IN_DATASET;
  const unit = system === 'metric' ? 'km' : 'mi';
  const value = system === 'metric' ? km : kmToMiles(km);
  if (value >= 1e9) return `${formatNumber(value / 1e9, 2)} billion ${unit}`;
  if (value >= 1e6) return `${formatNumber(value / 1e6, 1)} million ${unit}`;
  return `${formatNumber(value, 0)} ${unit}`;
}

export function formatMass(kg: Maybe, system: UnitSystem = 'metric'): string {
  if (!isNum(kg)) return NOT_IN_DATASET;
  return system === 'metric'
    ? `${formatScientific(kg)} kg`
    : `${formatScientific(kgToLb(kg))} lb`;
}

export function formatDensity(kgM3: Maybe, system: UnitSystem = 'metric'): string {
  if (!isNum(kgM3)) return NOT_IN_DATASET;
  return system === 'metric'
    ? `${formatNumber(kgM3, 0)} kg/m³`
    : `${formatNumber(kgM3 * LB_FT3_PER_KG_M3, 1)} lb/ft³`;
}

export function formatGravity(ms2: Maybe, system: UnitSystem = 'metric'): string {
  if (!isNum(ms2)) return NOT_IN_DATASET;
  return system === 'metric'
    ? `${formatNumber(ms2, 1)} m/s²`
    : `${formatNumber(msToFts(ms2), 1)} ft/s²`;
}

export function formatVelocity(kms: Maybe, system: UnitSystem = 'metric'): string {
  if (!isNum(kms)) return NOT_IN_DATASET;
  return system === 'metric'
    ? `${formatNumber(kms, 1)} km/s`
    : `${formatNumber(kmToMiles(kms), 1)} mi/s`;
}

export function formatTemperature(c: Maybe, system: UnitSystem = 'metric'): string {
  if (!isNum(c)) return NOT_IN_DATASET;
  return system === 'metric'
    ? `${formatNumber(c, 0)} °C`
    : `${formatNumber(cToF(c), 0)} °F`;
}

/** "365.2 days" or "687 days (1.9 years)" for longer orbits. */
export function formatOrbitalPeriod(days: Maybe): string {
  if (!isNum(days)) return NOT_IN_DATASET;
  const base = `${formatNumber(days, 1)} days`;
  return days >= 400 ? `${base} (${formatNumber(days / 365.25, 1)} Earth years)` : base;
}

/** Sidereal rotation. Negative input means retrograde. */
export function formatRotation(hours: Maybe): string {
  if (!isNum(hours)) return NOT_IN_DATASET;
  const abs = Math.abs(hours);
  let text = `${formatNumber(abs, 1)} hours`;
  if (abs >= 48) text += ` (${formatNumber(abs / 24, 1)} days)`;
  if (hours < 0) text += ', retrograde';
  return text;
}

export function formatDuration(hours: Maybe): string {
  if (!isNum(hours)) return NOT_IN_DATASET;
  const abs = Math.abs(hours);
  const base = `${formatNumber(abs, 1)} hours`;
  return abs >= 48 ? `${base} (${formatNumber(abs / 24, 1)} days)` : base;
}

export function formatDegrees(deg: Maybe, maxFractionDigits = 1): string {
  if (!isNum(deg)) return NOT_IN_DATASET;
  return `${formatNumber(deg, maxFractionDigits)}°`;
}
