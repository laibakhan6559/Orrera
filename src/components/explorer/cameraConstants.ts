import { Vector3 } from 'three';

/** Viewing direction of the overview camera: raised about 25 degrees above the orbital plane. */
const OVERVIEW_DIRECTION = new Vector3(0, 0.42, 0.91).normalize();

/**
 * Where the camera starts, and where "Reset view" returns it.
 * Wide screens see every orbit; tall (phone) screens sit further back so the
 * inner Solar System fits, and the outer planets are reached with the list or zoom.
 */
export function defaultCameraPosition(aspect: number): Vector3 {
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1.6;
  const distance = safeAspect >= 1 ? 175 : Math.min(300, 175 / Math.sqrt(safeAspect));
  return OVERVIEW_DIRECTION.clone().multiplyScalar(distance);
}
