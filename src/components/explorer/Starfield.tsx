import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Points } from 'three';
import { mulberry32 } from '@/utils/proceduralTextures';
import { useExplorerStore } from '@/store/explorerStore';

const COUNT = 2600;

/** Distant stars on a big sphere around the scene. Deterministic, so it never flickers between renders. */
export function Starfield() {
  const ref = useRef<Points>(null);

  const geometry = useMemo(() => {
    const rng = mulberry32(20260);
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Uniform point on a sphere shell between radius 500 and 900.
      const u = rng() * 2 - 1;
      const theta = rng() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = 500 + rng() * 400;
      positions[i * 3] = r * s * Math.cos(theta);
      positions[i * 3 + 1] = r * u;
      positions[i * 3 + 2] = r * s * Math.sin(theta);

      // Warm white to pale brass, with a few brighter stars.
      const warm = rng();
      const bright = 0.45 + Math.pow(rng(), 2.5) * 0.55;
      colors[i * 3] = bright;
      colors[i * 3 + 1] = bright * (0.86 + warm * 0.12);
      colors[i * 3 + 2] = bright * (0.7 + warm * 0.25);
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // A very slow drift gives a sense of depth. Off for reduced motion or when paused.
  useFrame((_, delta) => {
    const points = ref.current;
    if (!points) return;
    const { reducedMotion, playing } = useExplorerStore.getState();
    if (reducedMotion || !playing) return;
    points.rotation.y += Math.min(delta, 0.1) * 0.004;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false} raycast={() => null}>
      <pointsMaterial size={1.6} sizeAttenuation={false} vertexColors transparent opacity={0.95} depthWrite={false} />
    </points>
  );
}
