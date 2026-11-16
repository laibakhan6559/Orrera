import { Canvas } from '@react-three/fiber';
import { useExplorerStore } from '@/store/explorerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { qualityProfile, resolveQuality } from '@/utils/quality';
import { defaultCameraPosition } from './cameraConstants';
import { Scene } from './Scene';

interface ExplorerCanvasProps {
  /** Called once the renderer exists. */
  onReady: () => void;
  /** Called if the WebGL context is lost and cannot be used any more. */
  onFailure: () => void;
}

/** The 3D canvas. Loaded lazily so three.js stays out of the first page load. */
export default function ExplorerCanvas({ onReady, onFailure }: ExplorerCanvasProps) {
  const hovering = useExplorerStore((s) => s.hoveredId !== null);
  const quality = useSettingsStore((s) => s.quality);
  const { dpr } = qualityProfile(resolveQuality(quality));

  return (
    <div
      role="img"
      aria-label="Interactive 3D model of the Sun and the eight planets, not to scale. Use the object list to choose a world."
      className="absolute inset-0 touch-none"
      style={{ cursor: hovering ? 'pointer' : 'grab' }}
    >
      <Canvas
        dpr={dpr}
        camera={{
          position: defaultCameraPosition(window.innerWidth / window.innerHeight).toArray(),
          fov: 45,
          near: 0.1,
          far: 3000,
        }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            onFailure();
          });
          onReady();
        }}
        onPointerMissed={() => useExplorerStore.getState().select(null)}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
