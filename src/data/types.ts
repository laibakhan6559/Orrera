/**
 * ORRERA data model.
 *
 * Scientific values (physical / rotation / orbit) are stored separately from
 * the display values in `visual`. The overview scene is NOT to scale, so
 * `visualRadius` and `visualOrbitRadius` are illustrative only.
 *
 * Any value we do not have is `null` and is rendered as "Not in this dataset".
 */

export type ObjectType = 'star' | 'planet' | 'moon';
export type PlanetType = 'terrestrial' | 'gas-giant' | 'ice-giant';

export interface SourceRef {
  title: string;
  url: string;
}

/** What the temperature number actually refers to. Giants have no solid surface. */
export type TemperatureBasis = 'surface-mean' | 'one-bar-level' | 'effective-surface';

export interface TemperatureInfo {
  valueC: number | null;
  basis: TemperatureBasis;
  note?: string;
}

export interface PhysicalProps {
  /** Equatorial diameter, km (NASA fact sheet convention). */
  equatorialDiameterKm: number | null;
  massKg: number | null;
  densityKgM3: number | null;
  /** Gravity in m/s^2. For gas/ice giants this refers to the 1-bar level. */
  gravityMs2: number | null;
  escapeVelocityKms: number | null;
  temperature: TemperatureInfo;
}

export interface RotationProps {
  /** Sidereal rotation period in hours. Negative = retrograde (spins backwards). */
  siderealPeriodHours: number | null;
  /** Length of a solar day (sunrise to sunrise) in hours. */
  solarDayHours: number | null;
  /** Obliquity to orbit, degrees. */
  axialTiltDeg: number | null;
  note?: string;
}

export interface OrbitProps {
  meanDistanceFromSunKm: number;
  orbitalPeriodDays: number;
  eccentricity: number;
}

export interface MoonsInfo {
  knownCount: number;
  /** ISO date (YYYY-MM-DD) the count was taken from the source. Counts change. */
  countAsOf: string;
  /** Display names only for now; moon records arrive in a later step. */
  featuredMoons: string[];
}

/** Display-only values. Not scientific measurements. */
export interface VisualProps {
  visualRadius: number;
  visualOrbitRadius: number | null;
  /** Accent colour (hex) used for UI highlights. */
  accent: string;
  /** [light, dark] hex colours for the procedural planet gradient. */
  palette: [string, string];
  hasRings: boolean;
  /** Path to a bundled texture, or null to use the procedural material. */
  texture: string | null;
}

export interface CelestialBody {
  id: string;
  slug: string;
  displayName: string;
  objectType: ObjectType;
  planetType: PlanetType | null;
  parentObjectId: string | null;
  /** 0 for the Sun, 1-8 for Mercury to Neptune. */
  orderFromSun: number;
  tagline: string;
  description: string;
  atmosphere: string;
  surface: string;
  highlights: string[];
  physical: PhysicalProps;
  rotation: RotationProps | null;
  orbit: OrbitProps | null;
  moons: MoonsInfo | null;
  visual: VisualProps;
  relatedObjectIds: string[];
  notes: string[];
  sources: SourceRef[];
  /** ISO date the source data was published or last updated, or null if the source does not state one. */
  dataAsOf: string | null;
  /** ISO date this record was last reviewed. */
  lastReviewed: string;
}

export type FactCategory =
  | 'sun'
  | 'planets'
  | 'moons'
  | 'orbital-mechanics'
  | 'extreme-environments';

export interface SpaceFact {
  id: string;
  text: string;
  category: FactCategory;
  relatedObjectIds: string[];
  source: SourceRef;
  lastReviewed: string;
}

export type QuizCategory = 'planet-order' | 'planet-facts' | 'sun' | 'orbits';
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
  category: QuizCategory;
  difficulty: QuizDifficulty;
  relatedObjectIds: string[];
  source: SourceRef;
  lastReviewed: string;
}

export const FACT_CATEGORIES: FactCategory[] = [
  'sun',
  'planets',
  'moons',
  'orbital-mechanics',
  'extreme-environments',
];
export const QUIZ_CATEGORIES: QuizCategory[] = [
  'planet-order',
  'planet-facts',
  'sun',
  'orbits',
];
export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ['beginner', 'intermediate', 'advanced'];
