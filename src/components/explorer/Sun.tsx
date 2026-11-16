import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { AdditiveBlending } from 'three';
import type { Group, Mesh, Sprite } from 'three';
import type { CelestialBody } from '@/data/types';
import { useExplorerStore } from '@/store/explorerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { createGlowTexture, createPlanetTexture } from '@/utils/proceduralTextures';
import { spinSpeed } from '@/utils/orbitMath';
import { qualityProfile, resolveQuality } from '@/utils/quality';
import { BodyLabel } from './BodyLabel';
import { registry } from './bodyRegistry';

/** The Sun: a glowing textured sphere that also acts as the scene's light source. */
export function Sun({ body }: { body: CelestialBody }) {
  const quality = useSettingsStore((s) => s.quality);
  const [widthSegments, heightSegments] = qualityProfile(resolveQuality(quality)).sphereSegments;
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Sprite>(null);

  const radius = body.visual.visualRadius;
  const spin = spinSpeed(body.rotation?.siderealPeriodHours);
  const texture = useMemo(() => createPlanetTexture(body), [body]);
  const glow = useMemo(() => createGlowTexture(body.visual.accent), [body.visual.accent]);

  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => () => glow.dispose(), [glow]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    registry.set(body.id, group);
    return () => {
      registry.delete(body.id);
    };
  }, [body.id]);

  useFrame((state, delta) => {
    const { playing, speed } = useExplorerStore.getState();
    const timeScale = playing ? speed : 0;
    const mesh = meshRef.current;
    if (mesh) mesh.rotation.y += spin * Math.min(delta, 0.1) * timeScale;
    // A slow breathing glow. Static when the visitor prefers reduced motion.
    const glowSprite = glowRef.current;
    if (glowSprite) {
      const reduced = useExplorerStore.getState().reducedMotion;
      const pulse = reduced ? 1 : 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
      const size = radius * 7.5 * pulse;
      glowSprite.scale.set(size, size, 1);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} raycast={() => null}>
        <sphereGeometry args={[radius, widthSegments, heightSegments]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      <sprite ref={glowRef} raycast={() => null}>
        <spriteMaterial
          map={glow}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          opacity={0.9}
        />
      </sprite>

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
        <sphereGeometry args={[radius * 1.05, 24, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <BodyLabel body={body} yOffset={radius + 1.6} />
    </group>
  );
}
