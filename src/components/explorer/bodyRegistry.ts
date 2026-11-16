import type { Object3D } from 'three';

/**
 * Lets the camera find the live 3D object of each body (planets move every
 * frame, so the camera needs the object itself, not a stored position).
 */
export const registry = new Map<string, Object3D>();
