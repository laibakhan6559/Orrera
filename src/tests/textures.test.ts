import { describe, expect, it } from 'vitest';
import { hashString, hexToRgb, mixColors, mulberry32, rgba } from '@/utils/proceduralTextures';

describe('procedural texture helpers', () => {
  it('mulberry32 is deterministic and stays in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    expect(seqA).toEqual(seqB);
    for (const v of seqA) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(mulberry32(43)()).not.toBe(mulberry32(42)());
  });

  it('hashString is stable and different per body', () => {
    expect(hashString('earth')).toBe(hashString('earth'));
    expect(hashString('earth')).not.toBe(hashString('mars'));
  });

  it('hexToRgb reads 6 and 3 digit colours', () => {
    expect(hexToRgb('#d6a95b')).toEqual([214, 169, 91]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });

  it('mixColors blends and clamps', () => {
    expect(mixColors('#000000', '#ffffff', 0.5)).toEqual([128, 128, 128]);
    expect(mixColors('#000000', '#ffffff', 2)).toEqual([255, 255, 255]);
    expect(mixColors([10, 20, 30], [10, 20, 30], 0.3)).toEqual([10, 20, 30]);
  });

  it('rgba builds a CSS colour', () => {
    expect(rgba([1, 2, 3], 0.5)).toBe('rgba(1, 2, 3, 0.5)');
  });
});
