import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { CelestialBody } from '@/data/types';
import { useExplorerStore } from '@/store/explorerStore';
import { useSettingsStore } from '@/store/settingsStore';
import {
  advance,
  degToRad,
  orbitAngularSpeed,
  orbitPosition,
  spinSpeed,
  startAngle,
} from '@/utils/orbitMath';
import { createPlanetTexture } from '@/utils/proceduralTextures';
import { qualityProfile, resolveQuality } from '@/utils/quality';
import { BodyLabel } from './BodyLabel';
import { SaturnRings } from './SaturnRings';
import { registry } from './bodyRegistry';

/** One planet: orbits the Sun, spins on a tilted axis, and can be hovered or clicked. */
export function Planet({ body }: { body: CelestialBody }) {
  const quality = useSettingsStore((s) => s.quality);
  const [widthSegments, heightSegments] = qualityProfile(resolveQuality(quality)).sphereSegments;
  const orbitRef = useRef<Group>(null);
  const spinRef = useRef<Mesh>(null);

  const radius = body.visual.visualRadius;
  const orbitRadius = body.visual.visualOrbitRadius ?? 0;
  const orbitSpeed = orbitAngularSpeed(body.orbit?.orbitalPeriodDays ?? 365);
  const spin = spinSpeed(body.rotation?.siderealPeriodHours);
  const tilt = degToRad(body.rotation?.axialTiltDeg ?? 0);

  const angle = useRef(startAngle(body.orderFromSun));
  const initialPosition = useMemo(
    () => orbitPosition(orbitRadius, startAngle(body.orderFromSun)),
    [orbitRadius, body.orderFromSun],
  );
  const texture = useMemo(() => createPlanetTexture(body), [body]);

  useEffect(() => () => texture.dispose(), [texture]);

  useEffect(() => {
    const group = orbitRef.current;
    if (!group) return;
    registry.set(body.id, group);
    return () => {
      registry.delete(body.id);
    };
  }, [body.id]);

  useFrame((_, delta) => {
    const { playing, speed } = useExplorerStore.getState();
    const timeScale = playing ? speed : 0;
    angle.current = advance(angle.current, orbitSpeed, delta, timeScale);

    const group = orbitRef.current;
    if (group) {
      const [x, y, z] = orbitPosition(orbitRadius, angle.current);
      group.position.set(x, y, z);
    }
    const mesh = spinRef.current;
    if (mesh) mesh.rotation.y += spin * Math.min(delta, 0.1) * timeScale;
  });

  // Generous invisible hit area so small planets are easy to tap.
  const hitRadius = Math.max(radius * 1.3, 1.6);

  return (
    <group ref={orbitRef} position={initialPosition}>
      <group rotation={[0, 0, tilt]}>
        <mesh ref={spinRef} raycast={() => null}>
          <sphereGeometry args={[radius, widthSegments, heightSegments]} />
          <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
        </mesh>
        {body.visual.hasRings && <SaturnRings planetRadius={radius} />}
      </group>

      <mesh
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          useExplorerStore.getState().select(body.id);
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          useExplorerStore.getState().hover(body.id);
        }}
        onPointerOut={() => useExplorerStore.getState().hover(null)}
      >
        <sphereGeometry args={[hitRadius, 16, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <BodyLabel body={body} yOffset={Math.max(radius, radius * 1.15) + 1} />
    </group>
  );
}
