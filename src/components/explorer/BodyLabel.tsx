import { Html } from '@react-three/drei';
import type { CelestialBody } from '@/data/types';
import { useExplorerStore } from '@/store/explorerStore';

interface BodyLabelProps {
  body: CelestialBody;
  /** Height above the body's centre, in scene units. */
  yOffset: number;
}

/** Name tag that floats above a body. Hidden when labels are off, unless hovered or selected. */
export function BodyLabel({ body, yOffset }: BodyLabelProps) {
  const showLabels = useExplorerStore((s) => s.showLabels);
  const selected = useExplorerStore((s) => s.selectedId === body.id);
  const hovered = useExplorerStore((s) => s.hoveredId === body.id);

  if (!showLabels && !selected && !hovered) return null;
  const active = selected || hovered;

  return (
    <Html position={[0, yOffset, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <span
        className="whitespace-nowrap rounded-full border bg-void/75 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] backdrop-blur-sm"
        style={{
          borderColor: active ? body.visual.accent : 'rgba(214,169,91,0.35)',
          color: active ? body.visual.accent : '#f1e6cc',
        }}
      >
        {body.displayName}
      </span>
    </Html>
  );
}
