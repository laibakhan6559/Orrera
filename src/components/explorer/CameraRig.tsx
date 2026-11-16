import { useEffect, useRef, type ComponentRef } from 'react';
import { useFrame, useStore, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import type { PerspectiveCamera } from 'three';
import { getBodyById } from '@/data';
import { useExplorerStore } from '@/store/explorerStore';
import { focusDistance } from '@/utils/orbitMath';
import { registry } from './bodyRegistry';
import { defaultCameraPosition } from './cameraConstants';

const ORIGIN = new Vector3(0, 0, 0);
/** A focus move that has not settled after this long is handed to the visitor. */
const FOCUS_TRANSITION_SECONDS = 1.8;
/** On portrait screens the info sheet covers the lower part, so the scene is nudged up by this share of the height. */
const PORTRAIT_SHEET_OFFSET = 0.17;

type Mode = 'free' | 'focus' | 'follow' | 'reset';

/**
 * Owns the orbit controls and all automatic camera moves.
 *
 *  free    - the visitor is in control
 *  focus   - gliding to a selected body
 *  follow  - locked onto the selected body as it orbits (the visitor can still rotate and zoom)
 *  reset   - gliding back to the overview
 */
export function CameraRig() {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const store = useStore();

  const selectedId = useExplorerStore((s) => s.selectedId);
  const resetNonce = useExplorerStore((s) => s.resetNonce);

  const mode = useRef<Mode>('free');
  const goalDistance = useRef(20);
  const elapsed = useRef(0);
  const lastNonce = useRef(resetNonce);
  const viewOffsetY = useRef(0);
  const home = useRef(defaultCameraPosition(1.6));

  const bodyPosition = useRef(new Vector3());
  const move = useRef(new Vector3());
  const offset = useRef(new Vector3());

  // React to a new selection (or clearing it).
  useEffect(() => {
    const controls = controlsRef.current;
    const body = selectedId ? getBodyById(selectedId) : undefined;
    if (body) {
      const { width, height } = store.getState().size;
      goalDistance.current = focusDistance(body.visual.visualRadius, width / height);
      elapsed.current = 0;
      mode.current = 'focus';
      if (controls) controls.minDistance = body.visual.visualRadius * 1.6;
    } else {
      if (mode.current === 'focus' || mode.current === 'follow') mode.current = 'free';
      if (controls) controls.minDistance = 4;
    }
  }, [selectedId, store]);

  // "Reset view" glides back to the overview. Declared after the effect above so it wins.
  useEffect(() => {
    if (resetNonce === lastNonce.current) return;
    lastNonce.current = resetNonce;
    const { width, height } = store.getState().size;
    home.current = defaultCameraPosition(width / height);
    mode.current = 'reset';
  }, [resetNonce, store]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const { reducedMotion, selectedId: id } = useExplorerStore.getState();
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 4.5);
    const target = controls.target;

    if (mode.current === 'focus' || mode.current === 'follow') {
      const object = id ? registry.get(id) : undefined;
      if (object) {
        object.getWorldPosition(bodyPosition.current);

        const following = mode.current === 'follow';
        move.current.copy(bodyPosition.current).sub(target).multiplyScalar(following ? 1 : k);
        target.add(move.current);
        camera.position.add(move.current);

        if (!following) {
          elapsed.current += delta;
          offset.current.copy(camera.position).sub(target);
          const length = offset.current.length();
          const nextLength = length + (goalDistance.current - length) * k;
          offset.current.setLength(nextLength);
          camera.position.copy(target).add(offset.current);

          const settled =
            bodyPosition.current.distanceTo(target) < 0.05 &&
            Math.abs(goalDistance.current - nextLength) < 0.05;
          if (settled || elapsed.current > FOCUS_TRANSITION_SECONDS) mode.current = 'follow';
        }
      }
    } else if (mode.current === 'reset') {
      target.lerp(ORIGIN, k);
      camera.position.lerp(home.current, k);
      if (target.length() < 0.05 && camera.position.distanceTo(home.current) < 0.1) {
        target.copy(ORIGIN);
        camera.position.copy(home.current);
        mode.current = 'free';
      }
    }

    // Portrait screens: slide the picture up while something is selected, so the
    // body stays visible above the bottom info sheet.
    const { width, height } = state.size;
    const wantOffset = id && width < height ? height * PORTRAIT_SHEET_OFFSET : 0;
    viewOffsetY.current += (wantOffset - viewOffsetY.current) * k;
    if (Math.abs(viewOffsetY.current) > 0.5) {
      camera.setViewOffset(width, height, 0, viewOffsetY.current, width, height);
    } else if (camera.view?.enabled) {
      viewOffsetY.current = 0;
      camera.clearViewOffset();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      minDistance={4}
      maxDistance={340}
      onStart={() => {
        // The visitor grabbed the camera: stop gliding, keep following if we were.
        if (mode.current === 'focus') mode.current = 'follow';
        else if (mode.current === 'reset') mode.current = 'free';
      }}
    />
  );
}
