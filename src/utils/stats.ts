import type { CelestialBody, TemperatureBasis } from '@/data/types';
import {
  NOT_IN_DATASET,
  formatDegrees,
  formatDensity,
  formatDistance,
  formatDuration,
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

export interface StatRow {
  id: string;
  label: string;
  value: string;
  /** Short definition or caveat shown under the value. */
  note?: string;
}

export interface StatGroups {
  physical: StatRow[];
  motion: StatRow[];
}

const TEMPERATURE_LABEL: Record<TemperatureBasis, { label: string; note: string }> = {
  'surface-mean': { label: 'Mean surface temperature', note: 'Average over the whole surface.' },
  'one-bar-level': {
    label: 'Temperature at 1 bar',
    note: 'There is no solid surface; this is the temperature where the pressure equals Earth sea level.',
  },
  'effective-surface': {
    label: 'Surface temperature',
    note: 'Effective temperature of the visible surface.',
  },
};

/** Turns a body record into labelled rows with units, ready for display. */
export function buildStatRows(body: CelestialBody, system: UnitSystem = 'metric'): StatGroups {
  const p = body.physical;
  const temp = TEMPERATURE_LABEL[p.temperature.basis];

  const physical: StatRow[] = [
    {
      id: 'diameter',
      label: 'Diameter',
      value: formatLength(p.equatorialDiameterKm, system),
      note: body.objectType === 'star' ? 'Volumetric mean diameter.' : 'Equatorial diameter.',
    },
    { id: 'mass', label: 'Mass', value: formatMass(p.massKg, system) },
    { id: 'density', label: 'Mean density', value: formatDensity(p.densityKgM3, system) },
    {
      id: 'gravity',
      label: 'Gravity',
      value: formatGravity(p.gravityMs2, system),
      note: body.planetType === 'gas-giant' || body.planetType === 'ice-giant' ? 'At the 1-bar level.' : undefined,
    },
    { id: 'escape', label: 'Escape velocity', value: formatVelocity(p.escapeVelocityKms, system) },
    {
      id: 'temperature',
      label: temp.label,
      value: formatTemperature(p.temperature.valueC, system),
      note: p.temperature.note ?? temp.note,
    },
  ];

  const motion: StatRow[] = [];

  if (body.orbit) {
    motion.push(
      {
        id: 'distance',
        label: 'Mean distance from Sun',
        value: formatDistance(body.orbit.meanDistanceFromSunKm, system),
      },
      {
        id: 'period',
        label: 'Orbital period',
        value: formatOrbitalPeriod(body.orbit.orbitalPeriodDays),
        note: 'Length of one year on this planet.',
      },
      {
        id: 'eccentricity',
        label: 'Orbital eccentricity',
        value: formatNumber(body.orbit.eccentricity, 3),
        note: '0 is a perfect circle; higher values are more stretched.',
      },
    );
  }

  if (body.rotation) {
    motion.push(
      {
        id: 'rotation',
        label: 'Rotation period (sidereal)',
        value: formatRotation(body.rotation.siderealPeriodHours),
        note: body.rotation.note ?? 'Time to spin once relative to the stars.',
      },
      {
        id: 'solar-day',
        label: 'Solar day',
        value: formatDuration(body.rotation.solarDayHours),
        note: 'Sunrise to sunrise.',
      },
      {
        id: 'tilt',
        label: 'Axial tilt',
        value: formatDegrees(body.rotation.axialTiltDeg),
        note: 'Obliquity to orbit.',
      },
    );
  }

  if (body.moons) {
    motion.push({
      id: 'moons',
      label: 'Known moons',
      value: formatNumber(body.moons.knownCount, 0),
      note: `Known as of ${body.moons.countAsOf}. Moon counts change.`,
    });
  }

  return { physical, motion };
}

export { NOT_IN_DATASET };
