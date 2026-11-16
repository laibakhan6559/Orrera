import { useEffect, type ReactNode } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * App-wide providers. Animations follow the visitor's reduced-motion setting:
 * either their device setting, or the "Reduce motion" choice in Settings.
 */
export function Providers({ children }: { children: ReactNode }) {
  const motion = useSettingsStore((s) => s.motion);

  // Lets plain CSS animations (the home orrery, glow) switch off too.
  useEffect(() => {
    document.documentElement.dataset.motion = motion === 'reduced' ? 'reduced' : 'system';
  }, [motion]);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion={motion === 'reduced' ? 'always' : 'user'}>{children}</MotionConfig>
    </LazyMotion>
  );
}
