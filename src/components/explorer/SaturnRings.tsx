import { useEffect, useMemo } from 'react';
import { DoubleSide, RingGeometry } from 'three';
import { createRingTexture } from '@/utils/proceduralTextures';

const INNER = 1.25;
const OUTER = 2.3;

/** Saturn's rings, sized relative to the planet's display radius. */
export function SaturnRings({ planetRadius }: { planetRadius: number }) {
  const texture = useMemo(() => createRingTexture(), []);

  const geometry = useMemo(() => {
    const inner = planetRadius * INNER;
    const outer = planetRadius * OUTER;
    const geo = new RingGeometry(inner, outer, 192, 1);
    // Map U to the distance from the centre so the strip texture runs inner -> outer.
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - inner) / (outer - inner), 0.5);
    }
    return geo;
  }, [planetRadius]);

  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <meshStandardMaterial
        map={texture}
        side={DoubleSide}
        transparent
        depthWrite={false}
        roughness={1}
        metalness={0}
        emissive="#3a2f1a"
        emissiveIntensity={0.45}
      />
    </mesh>
  );
}
