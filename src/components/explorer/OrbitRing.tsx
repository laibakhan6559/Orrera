import { useEffect, useMemo } from 'react';
import { BufferGeometry, Vector3 } from 'three';
import type { CelestialBody } from '@/data/types';
import { useExplorerStore } from '@/store/explorerStore';

const SEGMENTS = 256;

/** Thin brass circle marking a planet's (illustrative) orbit. */
export function OrbitRing({ body }: { body: CelestialBody }) {
  const showOrbits = useExplorerStore((s) => s.showOrbits);
  const selected = useExplorerStore((s) => s.selectedId === body.id);
  const radius = body.visual.visualOrbitRadius ?? 0;

  const geometry = useMemo(() => {
    const points: Vector3[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      points.push(new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new BufferGeometry().setFromPoints(points);
  }, [radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  if (!showOrbits || radius <= 0) return null;

  return (
    <lineLoop geometry={geometry}>
      <lineBasicMaterial
        color={selected ? body.visual.accent : '#d6a95b'}
        transparent
        opacity={selected ? 0.9 : 0.3}
        depthWrite={false}
      />
    </lineLoop>
  );
}
