import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Stars } from '@react-three/drei';
import { AdditiveBlending, Vector3 } from 'three';
import type { DirectionalLight, Mesh } from 'three';
import type { CelestialBody } from '@/data/types';
import { SaturnRings } from '@/components/explorer/SaturnRings';
import { degToRad, TWO_PI } from '@/utils/orbitMath';
import { createGlowTexture, createPlanetTexture } from '@/utils/proceduralTextures';
import { qualityProfile, resolveQuality } from '@/utils/quality';
import { useSettingsStore } from '@/store/settingsStore';
import { MAX_ZOOM, MIN_ZOOM, VIEW_SPIN_SECONDS, clampDistance, startDistance } from '@/utils/globe';

export interface GlobeCommand {
  /** Changes on every request so repeated clicks are noticed. */
  nonce: number;
  kind: 'zoom-in' | 'zoom-out' | 'reset';
}

interface GlobeCanvasProps {
  body: CelestialBody;
  spinning: boolean;
  showAxis: boolean;
  reducedMotion: boolean;
  command: GlobeCommand;
  onReady: () => void;
  onFailure: () => void;
}

/** The body itself: a textured sphere on a tilted axis that turns a full 360 degrees. */
function Body({ body, spinning, showAxis }: Pick<GlobeCanvasProps, 'body' | 'spinning' | 'showAxis'>) {
  const quality = useSettingsStore((s) => s.quality);
  // Closer zoom than the explorer needs, so use more polygons than the scene does.
  const [w, h] = resolveQuality(quality) === 'low' ? [64, 48] : [128, 96];
  const meshRef = useRef<Mesh>(null);
  const isStar = body.objectType === 'star';
  const tilt = degToRad(body.rotation?.axialTiltDeg ?? 0);

  const texture = useMemo(() => createPlanetTexture(body), [body]);
  const glow = useMemo(() => (isStar ? createGlowTexture(body.visual.accent) : null), [isStar, body.visual.accent]);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => () => glow?.dispose(), [glow]);

  // Always turns the same way in the viewer. Backwards spin (Venus, Uranus) comes from the tilt of the axis.
  useFrame((_, delta) => {
    if (spinning && meshRef.current) meshRef.current.rotation.y += (TWO_PI / VIEW_SPIN_SECONDS) * Math.min(delta, 0.1);
  });

  return (
    <group rotation={[0, 0, tilt]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, w, h]} />
        {isStar ? (
          <meshBasicMaterial map={texture} />
        ) : (
          <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
        )}
      </mesh>
      {body.visual.hasRings && <SaturnRings planetRadius={1} />}
      {glow && (
        <sprite scale={[5.5, 5.5, 1]}>
          <spriteMaterial map={glow} blending={AdditiveBlending} transparent depthWrite={false} opacity={0.85} />
        </sprite>
      )}
      {showAxis && (
        <Line points={[[0, -1.7, 0], [0, 1.7, 0]]} color="#e3b768" lineWidth={1.5} dashed dashSize={0.12} gapSize={0.08} />
      )}
    </group>
  );
}

const LIGHT_OFFSET = new Vector3(-2, 3, 0);

/** A light that stays on the viewer's side, so whichever face you turn to is lit. */
function Headlight() {
  const light = useRef<DirectionalLight>(null);
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    if (!light.current) return;
    light.current.position.copy(camera.position).add(LIGHT_OFFSET);
  });
  return <directionalLight ref={light} intensity={2.4} color="#fff3dc" />;
}

/** Applies zoom buttons and reset to the camera. */
function CameraCommands({ command, hasRings, bodyId }: { command: GlobeCommand; hasRings: boolean; bodyId: string }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { update: () => void } | null;
  const size = useThree((s) => s.size);
  const last = useRef(command.nonce);

  useEffect(() => {
    if (command.nonce === last.current) return;
    last.current = command.nonce;
    const distance = camera.position.length();
    if (command.kind === 'zoom-in') camera.position.setLength(clampDistance(distance / 1.35));
    else if (command.kind === 'zoom-out') camera.position.setLength(clampDistance(distance * 1.35));
    else {
      const d = startDistance(hasRings, size.width / size.height);
      camera.position.set(0, d * 0.18, d);
    }
    controls?.update();
  }, [command, camera, controls, hasRings, size]);

  // Choosing another object starts from a fresh view.
  useEffect(() => {
    const d = startDistance(hasRings, size.width / size.height);
    camera.position.set(0, d * 0.18, d);
    controls?.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the object changes, not on every resize
  }, [bodyId, hasRings, camera, controls]);

  return null;
}

/** The 360 degree viewer canvas. Loaded lazily so three.js stays out of the first page load. */
export default function GlobeCanvas({ body, spinning, showAxis, reducedMotion, command, onReady, onFailure }: GlobeCanvasProps) {
  const quality = useSettingsStore((s) => s.quality);
  const { dpr } = qualityProfile(resolveQuality(quality));
  const d = startDistance(body.visual.hasRings, window.innerWidth / window.innerHeight);

  return (
    <div
      role="img"
      aria-label={`Interactive 3D model of ${body.displayName}. Drag to turn it, scroll or pinch to zoom. Use the buttons for keyboard control.`}
      className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, d * 0.18, d], fov: 40, near: 0.05, far: 400 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            onFailure();
          });
          onReady();
        }}
      >
        <color attach="background" args={['#05060d']} />
        <ambientLight intensity={body.objectType === 'star' ? 0 : 0.28} />
        <Headlight />
        <Stars radius={120} depth={40} count={reducedMotion ? 1500 : 3000} factor={4} fade speed={reducedMotion ? 0 : 0.6} />
        <Body key={body.id} body={body} spinning={spinning} showAxis={showAxis} />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping={!reducedMotion}
          dampingFactor={0.08}
          minDistance={MIN_ZOOM}
          maxDistance={MAX_ZOOM}
          rotateSpeed={0.7}
          zoomSpeed={0.8}
        />
        <CameraCommands command={command} hasRings={body.visual.hasRings} bodyId={body.id} />
      </Canvas>
    </div>
  );
}
