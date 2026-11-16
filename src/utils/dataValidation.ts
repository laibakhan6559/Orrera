import {
  FACT_CATEGORIES,
  QUIZ_CATEGORIES,
  QUIZ_DIFFICULTIES,
  type CelestialBody,
  type QuizQuestion,
  type SourceRef,
  type SpaceFact,
} from '@/data/types';

export interface ValidationIssue {
  path: string;
  message: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isIsoDate(value: unknown): boolean {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

function checkSource(source: SourceRef | undefined, path: string, out: ValidationIssue[]) {
  if (!source || !source.title?.trim()) {
    out.push({ path, message: 'Source needs a title.' });
    return;
  }
  if (!/^https:\/\//.test(source.url ?? '')) {
    out.push({ path, message: 'Source URL must start with https://.' });
  }
}

/** A numeric field that may be null (missing) but, when present, must be positive. */
function checkPositive(value: unknown, path: string, out: ValidationIssue[]) {
  if (value === null) return;
  if (!isFiniteNumber(value) || value <= 0) {
    out.push({ path, message: 'Must be a positive number, or null if unknown.' });
  }
}

export function validateBodies(bodies: CelestialBody[]): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const b of bodies) {
    const p = `bodies.${b.id ?? '?'}`;

    if (!b.id || !KEBAB.test(b.id)) out.push({ path: `${p}.id`, message: 'Invalid id.' });
    if (ids.has(b.id)) out.push({ path: `${p}.id`, message: 'Duplicate id.' });
    ids.add(b.id);
    if (!b.slug || !KEBAB.test(b.slug)) out.push({ path: `${p}.slug`, message: 'Invalid slug.' });
    if (slugs.has(b.slug)) out.push({ path: `${p}.slug`, message: 'Duplicate slug.' });
    slugs.add(b.slug);

    for (const key of ['displayName', 'tagline', 'description', 'atmosphere', 'surface'] as const) {
      if (!b[key]?.trim()) out.push({ path: `${p}.${key}`, message: 'Must not be empty.' });
    }
    if (!b.highlights?.length) out.push({ path: `${p}.highlights`, message: 'Needs at least one highlight.' });

    // Physical
    checkPositive(b.physical?.equatorialDiameterKm, `${p}.physical.equatorialDiameterKm`, out);
    checkPositive(b.physical?.massKg, `${p}.physical.massKg`, out);
    checkPositive(b.physical?.densityKgM3, `${p}.physical.densityKgM3`, out);
    checkPositive(b.physical?.gravityMs2, `${p}.physical.gravityMs2`, out);
    checkPositive(b.physical?.escapeVelocityKms, `${p}.physical.escapeVelocityKms`, out);
    const t = b.physical?.temperature;
    if (!t || (t.valueC !== null && !isFiniteNumber(t.valueC))) {
      out.push({ path: `${p}.physical.temperature`, message: 'Temperature must be a number or null.' });
    } else if (t.valueC !== null && t.valueC < -273.15) {
      out.push({ path: `${p}.physical.temperature`, message: 'Below absolute zero.' });
    }
    if (b.planetType && (b.planetType === 'gas-giant' || b.planetType === 'ice-giant')) {
      if (t?.basis === 'surface-mean') {
        out.push({
          path: `${p}.physical.temperature.basis`,
          message: 'Gas and ice giants have no solid surface; use "one-bar-level".',
        });
      }
    }

    // Rotation
    if (b.rotation) {
      const r = b.rotation;
      if (r.siderealPeriodHours !== null && (!isFiniteNumber(r.siderealPeriodHours) || r.siderealPeriodHours === 0)) {
        out.push({ path: `${p}.rotation.siderealPeriodHours`, message: 'Must be a non-zero number or null.' });
      }
      if (r.solarDayHours !== null) checkPositive(r.solarDayHours, `${p}.rotation.solarDayHours`, out);
      if (r.axialTiltDeg !== null && (!isFiniteNumber(r.axialTiltDeg) || r.axialTiltDeg < 0 || r.axialTiltDeg > 180)) {
        out.push({ path: `${p}.rotation.axialTiltDeg`, message: 'Axial tilt must be between 0 and 180 degrees.' });
      }
    }

    // Orbit
    if (b.objectType === 'planet' && !b.orbit) {
      out.push({ path: `${p}.orbit`, message: 'Planets need orbit data.' });
    }
    if (b.orbit) {
      checkPositive(b.orbit.meanDistanceFromSunKm, `${p}.orbit.meanDistanceFromSunKm`, out);
      checkPositive(b.orbit.orbitalPeriodDays, `${p}.orbit.orbitalPeriodDays`, out);
      const e = b.orbit.eccentricity;
      if (!isFiniteNumber(e) || e < 0 || e >= 1) {
        out.push({ path: `${p}.orbit.eccentricity`, message: 'Eccentricity must be in [0, 1).' });
      }
    }

    // Moons
    if (b.moons) {
      if (!Number.isInteger(b.moons.knownCount) || b.moons.knownCount < 0) {
        out.push({ path: `${p}.moons.knownCount`, message: 'Must be a non-negative integer.' });
      }
      if (!isIsoDate(b.moons.countAsOf)) {
        out.push({ path: `${p}.moons.countAsOf`, message: 'Moon counts need an ISO "as of" date.' });
      }
    }

    // Visual (display values, kept separate from science)
    const v = b.visual;
    if (!v || !isFiniteNumber(v.visualRadius) || v.visualRadius <= 0) {
      out.push({ path: `${p}.visual.visualRadius`, message: 'Must be a positive number.' });
    }
    if (b.objectType === 'planet' && (!v || !isFiniteNumber(v.visualOrbitRadius) || (v.visualOrbitRadius ?? 0) <= 0)) {
      out.push({ path: `${p}.visual.visualOrbitRadius`, message: 'Planets need a visual orbit radius.' });
    }
    if (!v || !HEX_COLOR.test(v.accent ?? '')) {
      out.push({ path: `${p}.visual.accent`, message: 'Accent must be a #rrggbb colour.' });
    }
    if (!v || v.palette?.length !== 2 || !v.palette.every((c) => HEX_COLOR.test(c))) {
      out.push({ path: `${p}.visual.palette`, message: 'Palette needs two #rrggbb colours.' });
    }

    // Sources and review metadata
    if (!b.sources?.length) out.push({ path: `${p}.sources`, message: 'At least one source is required.' });
    b.sources?.forEach((s, i) => checkSource(s, `${p}.sources[${i}]`, out));
    if (b.dataAsOf !== null && !isIsoDate(b.dataAsOf)) {
      out.push({ path: `${p}.dataAsOf`, message: 'Must be an ISO date or null.' });
    }
    if (!isIsoDate(b.lastReviewed)) out.push({ path: `${p}.lastReviewed`, message: 'Must be an ISO date.' });
  }

  // Cross-record checks
  for (const b of bodies) {
    const p = `bodies.${b.id}`;
    if (b.parentObjectId !== null && !ids.has(b.parentObjectId)) {
      out.push({ path: `${p}.parentObjectId`, message: `Unknown parent "${b.parentObjectId}".` });
    }
    for (const rel of b.relatedObjectIds ?? []) {
      if (!ids.has(rel)) out.push({ path: `${p}.relatedObjectIds`, message: `Unknown object "${rel}".` });
    }
  }

  const planets = bodies.filter((b) => b.objectType === 'planet');
  const orders = planets.map((b) => b.orderFromSun).sort((a, b) => a - b);
  if (orders.some((o, i) => o !== i + 1)) {
    out.push({ path: 'bodies', message: 'Planets must have orderFromSun values 1..N with no gaps or repeats.' });
  }
  const byOrder = [...planets].sort((a, b) => a.orderFromSun - b.orderFromSun);
  for (let i = 1; i < byOrder.length; i++) {
    const prev = byOrder[i - 1];
    const cur = byOrder[i];
    if (
      prev.orbit && cur.orbit &&
      prev.orbit.meanDistanceFromSunKm >= cur.orbit.meanDistanceFromSunKm
    ) {
      out.push({ path: `bodies.${cur.id}.orbit`, message: 'Real distances must increase with orderFromSun.' });
    }
    const pv = prev.visual?.visualOrbitRadius;
    const cv = cur.visual?.visualOrbitRadius;
    if (pv != null && cv != null && pv >= cv) {
      out.push({ path: `bodies.${cur.id}.visual.visualOrbitRadius`, message: 'Visual orbit radii must increase with orderFromSun.' });
    }
  }

  return out;
}

export function validateFacts(facts: SpaceFact[], knownIds: Set<string>): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const f of facts) {
    const p = `facts.${f.id ?? '?'}`;
    if (!f.id) out.push({ path: p, message: 'Missing id.' });
    if (seen.has(f.id)) out.push({ path: p, message: 'Duplicate id.' });
    seen.add(f.id);
    if (!f.text?.trim()) out.push({ path: `${p}.text`, message: 'Text must not be empty.' });
    if (!FACT_CATEGORIES.includes(f.category)) out.push({ path: `${p}.category`, message: 'Unknown category.' });
    for (const rel of f.relatedObjectIds ?? []) {
      if (!knownIds.has(rel)) out.push({ path: `${p}.relatedObjectIds`, message: `Unknown object "${rel}".` });
    }
    checkSource(f.source, `${p}.source`, out);
    if (!isIsoDate(f.lastReviewed)) out.push({ path: `${p}.lastReviewed`, message: 'Must be an ISO date.' });
  }
  return out;
}

export function validateQuiz(questions: QuizQuestion[], knownIds: Set<string>): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const q of questions) {
    const p = `quiz.${q.id ?? '?'}`;
    if (!q.id) out.push({ path: p, message: 'Missing id.' });
    if (seen.has(q.id)) out.push({ path: p, message: 'Duplicate id.' });
    seen.add(q.id);
    if (!q.question?.trim()) out.push({ path: `${p}.question`, message: 'Question must not be empty.' });
    if (!Array.isArray(q.choices) || q.choices.length < 2) {
      out.push({ path: `${p}.choices`, message: 'Needs at least two choices.' });
    } else if (new Set(q.choices.map((c) => c.trim().toLowerCase())).size !== q.choices.length) {
      out.push({ path: `${p}.choices`, message: 'Choices must be unique.' });
    }
    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= (q.choices?.length ?? 0)) {
      out.push({ path: `${p}.correctIndex`, message: 'correctIndex is out of range.' });
    }
    if (!q.explanation?.trim()) out.push({ path: `${p}.explanation`, message: 'Explanation must not be empty.' });
    if (!QUIZ_CATEGORIES.includes(q.category)) out.push({ path: `${p}.category`, message: 'Unknown category.' });
    if (!QUIZ_DIFFICULTIES.includes(q.difficulty)) out.push({ path: `${p}.difficulty`, message: 'Unknown difficulty.' });
    for (const rel of q.relatedObjectIds ?? []) {
      if (!knownIds.has(rel)) out.push({ path: `${p}.relatedObjectIds`, message: `Unknown object "${rel}".` });
    }
    checkSource(q.source, `${p}.source`, out);
    if (!isIsoDate(q.lastReviewed)) out.push({ path: `${p}.lastReviewed`, message: 'Must be an ISO date.' });
  }
  return out;
}
