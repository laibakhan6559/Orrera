export type QualityPref = 'auto' | 'low' | 'high';
export type ResolvedQuality = 'low' | 'high';

export interface QualityProfile {
  /** Device pixel ratio range handed to the 3D canvas. */
  dpr: number | [number, number];
  /** Sphere width and height segments. */
  sphereSegments: [number, number];
}

/** "Auto" picks the light profile on devices that report 4 or fewer CPU cores. */
export function resolveQuality(
  pref: QualityPref,
  cores: number | undefined = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : undefined,
): ResolvedQuality {
  if (pref !== 'auto') return pref;
  return cores !== undefined && cores > 0 && cores <= 4 ? 'low' : 'high';
}

export function qualityProfile(quality: ResolvedQuality): QualityProfile {
  return quality === 'low'
    ? { dpr: 1, sphereSegments: [32, 24] }
    : { dpr: [1, 2], sphereSegments: [64, 48] };
}
