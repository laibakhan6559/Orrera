import type { CelestialBody } from './types';

/**
 * The Moon, for the 360 degree viewer. It is kept apart from bodies.json on purpose:
 * it is not a planet, so it does not belong on the planet cards, the compare page
 * or the orbit scene. Values follow the NASA NSSDC Moon Fact Sheet.
 */
export const moon: CelestialBody = {
  id: 'moon',
  slug: 'moon',
  displayName: 'Moon',
  objectType: 'moon',
  planetType: null,
  parentObjectId: 'earth',
  orderFromSun: 3,
  tagline: "Earth's only natural satellite",
  description:
    'The Moon is the fifth largest moon in the Solar System and the only place beyond Earth that people have visited. It is locked to Earth by gravity, so the same face always points our way.',
  atmosphere: 'Almost none. A very thin layer of gas, far too thin to breathe or to carry weather.',
  surface:
    'Grey dust and rock covered in craters, with dark plains called maria (lava that cooled long ago). Temperatures swing from about -178 °C to 117 °C at the equator between night and day.',
  highlights: [
    'It spins once for every orbit around Earth, so we only ever see one side.',
    'Its gravity is about one sixth of Earth’s.',
    'The dark patches you see from Earth are ancient lava plains.',
  ],
  physical: {
    equatorialDiameterKm: 3475,
    massKg: 7.346e22,
    densityKgM3: 3344,
    gravityMs2: 1.62,
    escapeVelocityKms: 2.38,
    temperature: {
      valueC: null,
      basis: 'surface-mean',
      note: 'No single mean is given. The equator swings from about -178 °C to 117 °C.',
    },
  },
  rotation: {
    siderealPeriodHours: 655.72,
    solarDayHours: null,
    axialTiltDeg: 6.68,
    note: 'Tidally locked: one spin takes as long as one orbit of Earth (27.3 days).',
  },
  orbit: null,
  moons: null,
  visual: {
    visualRadius: 1,
    visualOrbitRadius: null,
    accent: '#c9c4bb',
    palette: ['#cfcac1', '#6d6a68'],
    hasRings: false,
    texture: null,
  },
  relatedObjectIds: ['earth'],
  notes: ['Values follow the NASA NSSDC Moon Fact Sheet, last updated 11 January 2024.'],
  sources: [{ title: 'NASA NSSDC Moon Fact Sheet', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html' }],
  dataAsOf: '2024-01-11',
  lastReviewed: '2026-11-16',
};
