import type { CelestialBody } from '@/data/types';
import {
  formatDegrees,
  formatDensity,
  formatDistance,
  formatGravity,
  formatLength,
  formatMass,
  formatNumber,
  formatOrbitalPeriod,
  formatRotation,
  formatTemperature,
  formatVelocity,
  type UnitSystem,
} from './units';

export const MIN_COMPARE = 2;
export const MAX_COMPARE = 4;
export const DEFAULT_COMPARE = ['earth', 'mars'];

/** Reads ?p=earth,mars. Falls back to the default pair if the value is missing or unusable. */
export function parseSelection(param: string | null, validIds: string[]): string[] {
  if (!param) return [...DEFAULT_COMPARE];
  const ids = [
    ...new Set(
      param
        .split(',')
        .map((s) => s.trim())
        .filter((id) => validIds.includes(id)),
    ),
  ].slice(0, MAX_COMPARE);
  return ids.length >= MIN_COMPARE ? ids : [...DEFAULT_COMPARE];
}

/** Adds or removes a planet while keeping the selection between MIN and MAX. */
export function toggleSelection(current: string[], id: string): string[] {
  if (current.includes(id)) {
    return current.length > MIN_COMPARE ? current.filter((c) => c !== id) : current;
  }
  return current.length < MAX_COMPARE ? [...current, id] : current;
}

export interface CompareCell {
  bodyId: string;
  text: string;
  /** Share of the largest value in this row (0 to 1), or null when there is nothing to draw. */
  ratio: number | null;
  /** True for the highest value when the values differ. */
  isMax: boolean;
  /** Small extra line, such as "11.2x Earth". */
  note?: string;
}

export interface CompareRow {
  id: string;
  label: string;
  cells: CompareCell[];
}

interface Metric {
  id: string;
  label: string;
  value: (b: CelestialBody) => number | null;
  text: (b: CelestialBody, units: UnitSystem) => string;
  /** Draw a bar relative to the largest value in the row. */
  bar: boolean;
  /** Show "x Earth" under the value. */
  vsEarth?: boolean;
}

const METRICS: Metric[] = [
  {
    id: 'diameter',
    label: 'Diameter',
    value: (b) => b.physical.equatorialDiameterKm,
    text: (b, u) => formatLength(b.physical.equatorialDiameterKm, u),
    bar: true,
    vsEarth: true,
  },
  {
    id: 'mass',
    label: 'Mass',
    value: (b) => b.physical.massKg,
    text: (b, u) => formatMass(b.physical.massKg, u),
    bar: true,
    vsEarth: true,
  },
  {
    id: 'density',
    label: 'Mean density',
    value: (b) => b.physical.densityKgM3,
    text: (b, u) => formatDensity(b.physical.densityKgM3, u),
    bar: true,
  },
  {
    id: 'gravity',
    label: 'Gravity',
    value: (b) => b.physical.gravityMs2,
    text: (b, u) =>
      formatGravity(b.physical.gravityMs2, u) + (b.planetType === 'terrestrial' ? '' : ' (at 1 bar)'),
    bar: true,
    vsEarth: true,
  },
  {
    id: 'escape',
    label: 'Escape velocity',
    value: (b) => b.physical.escapeVelocityKms,
    text: (b, u) => formatVelocity(b.physical.escapeVelocityKms, u),
    bar: true,
  },
  {
    id: 'temperature',
    label: 'Temperature',
    value: (b) => b.physical.temperature.valueC,
    text: (b, u) =>
      formatTemperature(b.physical.temperature.valueC, u) +
      (b.physical.temperature.basis === 'one-bar-level' ? ' (at 1 bar)' : ' (mean surface)'),
    // Temperatures can be negative, so a "share of the largest" bar would mislead.
    bar: false,
  },
  {
    id: 'distance',
    label: 'Mean distance from Sun',
    value: (b) => b.orbit?.meanDistanceFromSunKm ?? null,
    text: (b, u) => formatDistance(b.orbit?.meanDistanceFromSunKm, u),
    bar: true,
  },
  {
    id: 'period',
    label: 'Orbital period (year)',
    value: (b) => b.orbit?.orbitalPeriodDays ?? null,
    text: (b) => formatOrbitalPeriod(b.orbit?.orbitalPeriodDays),
    bar: true,
  },
  {
    id: 'rotation',
    label: 'Rotation period',
    value: (b) => b.rotation?.siderealPeriodHours ?? null,
    text: (b) => formatRotation(b.rotation?.siderealPeriodHours),
    bar: true,
  },
  {
    id: 'tilt',
    label: 'Axial tilt',
    value: (b) => b.rotation?.axialTiltDeg ?? null,
    text: (b) => formatDegrees(b.rotation?.axialTiltDeg),
    bar: true,
  },
  {
    id: 'moons',
    label: 'Known moons',
    value: (b) => b.moons?.knownCount ?? null,
    text: (b) => formatNumber(b.moons?.knownCount, 0),
    bar: true,
  },
];

/** "0.0553x Earth", "318x Earth": three significant digits. */
export function formatEarthRatio(ratio: number): string {
  return `${formatNumber(Number(ratio.toPrecision(3)), 3)}× Earth`;
}

/**
 * Builds the comparison table: one row per measurement, one cell per planet.
 * Values keep their real units; bars are only a visual aid.
 */
export function buildComparison(
  selected: CelestialBody[],
  units: UnitSystem,
  earth: CelestialBody | undefined,
): CompareRow[] {
  return METRICS.map((metric) => {
    const values = selected.map((b) => metric.value(b));
    const magnitudes = values.map((v) => (v == null ? null : Math.abs(v)));
    const finite = magnitudes.filter((v): v is number => v != null);
    const max = finite.length ? Math.max(...finite) : 0;
    const differ = new Set(finite).size > 1;
    const earthValue = earth ? metric.value(earth) : null;

    const cells: CompareCell[] = selected.map((body, i) => {
      const mag = magnitudes[i];
      const ratio = metric.bar && mag != null && max > 0 ? mag / max : null;
      let note: string | undefined;
      if (metric.vsEarth && earthValue && values[i] != null) {
        note = body.id === 'earth' ? 'Reference' : formatEarthRatio((values[i] as number) / earthValue);
      }
      return {
        bodyId: body.id,
        text: metric.text(body, units),
        ratio,
        isMax: differ && ratio === 1,
        note,
      };
    });

    return { id: metric.id, label: metric.label, cells };
  });
}

/** True relative sizes for the size chart: the biggest planet gets `maxPx`. */
export function relativeSizes(
  selected: CelestialBody[],
  maxPx: number,
  minPx = 8,
): { id: string; px: number; ratio: number }[] {
  const diameters = selected.map((b) => b.physical.equatorialDiameterKm ?? 0);
  const max = Math.max(...diameters, 0);
  return selected.map((b, i) => {
    const ratio = max > 0 ? diameters[i] / max : 0;
    return { id: b.id, px: Math.max(minPx, ratio * maxPx), ratio };
  });
}
