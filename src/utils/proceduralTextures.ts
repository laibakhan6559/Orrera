import { CanvasTexture, SRGBColorSpace, RepeatWrapping, ClampToEdgeWrapping } from 'three';
import type { CelestialBody } from '@/data/types';
import { hashString, mulberry32 } from './random';

/* ------------------------------------------------------------------ */
/* Small, pure helpers (unit-tested; they do not touch the canvas)     */
/* ------------------------------------------------------------------ */

type Rgb = [number, number, number];

// Shared with non-3D code (quiz shuffling), so they live in random.ts and stay out of the three.js chunk.
export { hashString, mulberry32 } from './random';

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.replace(/./g, '$&$&') : clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixColors(a: Rgb | string, b: Rgb | string, t: number): Rgb {
  const ca = typeof a === 'string' ? hexToRgb(a) : a;
  const cb = typeof b === 'string' ? hexToRgb(b) : b;
  const k = Math.min(1, Math.max(0, t));
  return [
    Math.round(ca[0] + (cb[0] - ca[0]) * k),
    Math.round(ca[1] + (cb[1] - ca[1]) * k),
    Math.round(ca[2] + (cb[2] - ca[2]) * k),
  ];
}

export function rgba(color: Rgb, alpha = 1): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

/* ------------------------------------------------------------------ */
/* Canvas painting                                                     */
/* ------------------------------------------------------------------ */

type Rng = () => number;
type Style = 'sun' | 'moon' | 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'ice';

const TEX_W = 1024;
const TEX_H = 512;

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is not available');
  return [canvas, ctx];
}

/** Draws a shape at x and its wrapped copies so the texture tiles around the sphere. */
function wrapped(w: number, x: number, reach: number, draw: (x: number) => void) {
  draw(x);
  if (x - reach < 0) draw(x + w);
  if (x + reach > w) draw(x - w);
}

function blob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
) {
  wrapped(TEX_W, x, rx, (px) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(px, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function paintBands(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  light: Rgb,
  dark: Rgb,
  bandCount: number,
  contrast: number,
) {
  let y = 0;
  while (y < TEX_H) {
    const bandHeight = (TEX_H / bandCount) * (0.45 + rng() * 1.1);
    const tone = 0.5 + (rng() - 0.5) * contrast * 2;
    ctx.fillStyle = rgba(mixColors(dark, light, tone));
    ctx.fillRect(0, y, TEX_W, bandHeight + 1);
    y += bandHeight;
  }
  // Soft streaks add turbulence along the bands.
  for (let i = 0; i < 320; i++) {
    const tone = rng();
    blob(
      ctx,
      rng() * TEX_W,
      rng() * TEX_H,
      18 + rng() * 110,
      0.8 + rng() * 3.2,
      rgba(mixColors(dark, light, tone), 0.05 + rng() * 0.16),
    );
  }
}

function paintBlotches(
  ctx: CanvasRenderingContext2D,
  rng: Rng,
  light: Rgb,
  dark: Rgb,
  count: number,
  maxSize: number,
) {
  ctx.fillStyle = rgba(mixColors(dark, light, 0.5));
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  for (let i = 0; i < count; i++) {
    const size = 4 + rng() * maxSize;
    blob(
      ctx,
      rng() * TEX_W,
      rng() * TEX_H,
      size * (0.8 + rng() * 0.8),
      size * (0.6 + rng() * 0.6),
      rgba(mixColors(dark, light, rng()), 0.18 + rng() * 0.32),
    );
  }
}

function paintPolarCaps(ctx: CanvasRenderingContext2D, rng: Rng, size: number, alpha: number) {
  for (let i = 0; i < 90; i++) {
    const x = rng() * TEX_W;
    const rx = 10 + rng() * 40;
    blob(ctx, x, rng() * size, rx, size * (0.4 + rng() * 0.5), `rgba(255,255,255,${alpha})`);
    blob(ctx, x, TEX_H - rng() * size, rx, size * (0.4 + rng() * 0.5), `rgba(255,255,255,${alpha})`);
  }
}

function paintCraters(ctx: CanvasRenderingContext2D, rng: Rng, count: number) {
  for (let i = 0; i < count; i++) {
    const r = 2 + Math.pow(rng(), 2.2) * 26;
    const x = rng() * TEX_W;
    const y = rng() * TEX_H;
    wrapped(TEX_W, x, r, (px) => {
      ctx.beginPath();
      ctx.arc(px, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 26, 24, 0.22)';
      ctx.fill();
      ctx.lineWidth = Math.max(1, r * 0.18);
      ctx.strokeStyle = 'rgba(235, 228, 215, 0.2)';
      ctx.stroke();
    });
  }
}

const STYLE_BY_ID: Record<string, Style> = {
  sun: 'sun',
  moon: 'moon',
  mercury: 'mercury',
  venus: 'venus',
  earth: 'earth',
  mars: 'mars',
  jupiter: 'jupiter',
  saturn: 'saturn',
  uranus: 'ice',
  neptune: 'ice',
};

function paintBody(ctx: CanvasRenderingContext2D, body: CelestialBody, rng: Rng) {
  const light = hexToRgb(body.visual.palette[0]);
  const dark = hexToRgb(body.visual.palette[1]);
  const style: Style =
    STYLE_BY_ID[body.id] ??
    (body.planetType === 'terrestrial' ? 'mercury' : body.planetType === 'gas-giant' ? 'jupiter' : 'ice');

  switch (style) {
    case 'sun': {
      paintBlotches(ctx, rng, light, dark, 900, 22);
      for (let i = 0; i < 40; i++) {
        blob(ctx, rng() * TEX_W, TEX_H * (0.3 + rng() * 0.4), 3 + rng() * 9, 2 + rng() * 6, 'rgba(120, 50, 0, 0.35)');
      }
      break;
    }
    case 'moon': {
      paintBlotches(ctx, rng, light, dark, 360, 40);
      // Dark lava plains ("maria") on the near side, then craters over the top.
      for (let i = 0; i < 14; i++) {
        blob(ctx, TEX_W * (0.12 + rng() * 0.36), TEX_H * (0.25 + rng() * 0.5), 30 + rng() * 70, 22 + rng() * 40, 'rgba(46, 44, 48, 0.4)');
      }
      paintCraters(ctx, rng, 320);
      break;
    }
    case 'mercury': {
      paintBlotches(ctx, rng, light, dark, 520, 34);
      paintCraters(ctx, rng, 260);
      break;
    }
    case 'venus': {
      paintBands(ctx, rng, light, dark, 9, 0.16);
      paintBlotches(ctx, rng, light, mixColors(dark, light, 0.4), 120, 70);
      break;
    }
    case 'earth': {
      ctx.fillStyle = rgba(mixColors(dark, light, 0.28));
      ctx.fillRect(0, 0, TEX_W, TEX_H);
      // Shallow seas
      for (let i = 0; i < 160; i++) {
        blob(ctx, rng() * TEX_W, rng() * TEX_H, 20 + rng() * 80, 8 + rng() * 36, rgba(mixColors(dark, light, 0.5), 0.12));
      }
      // Continents: clusters of green and tan blobs
      for (let c = 0; c < 9; c++) {
        const cx = rng() * TEX_W;
        const cy = TEX_H * (0.22 + rng() * 0.56);
        for (let i = 0; i < 26; i++) {
          const color = rng() > 0.35 ? [63, 125, 74] : [181, 164, 106];
          blob(
            ctx,
            cx + (rng() - 0.5) * 150,
            cy + (rng() - 0.5) * 70,
            12 + rng() * 38,
            8 + rng() * 22,
            rgba(color as Rgb, 0.85),
          );
        }
      }
      // Cloud streaks and polar ice
      for (let i = 0; i < 140; i++) {
        blob(ctx, rng() * TEX_W, rng() * TEX_H, 20 + rng() * 90, 2 + rng() * 6, 'rgba(255,255,255,0.2)');
      }
      paintPolarCaps(ctx, rng, 28, 0.9);
      break;
    }
    case 'mars': {
      paintBlotches(ctx, rng, light, dark, 420, 60);
      for (let i = 0; i < 26; i++) {
        blob(ctx, rng() * TEX_W, TEX_H * (0.25 + rng() * 0.5), 20 + rng() * 60, 6 + rng() * 22, 'rgba(70, 28, 16, 0.28)');
      }
      paintCraters(ctx, rng, 60);
      paintPolarCaps(ctx, rng, 18, 0.85);
      break;
    }
    case 'jupiter': {
      paintBands(ctx, rng, light, dark, 18, 0.42);
      // Great Red Spot
      blob(ctx, TEX_W * 0.62, TEX_H * 0.62, 42, 22, 'rgba(176, 72, 42, 0.9)');
      blob(ctx, TEX_W * 0.62, TEX_H * 0.62, 28, 13, 'rgba(214, 120, 76, 0.8)');
      break;
    }
    case 'saturn': {
      paintBands(ctx, rng, light, dark, 14, 0.2);
      break;
    }
    case 'ice': {
      paintBands(ctx, rng, light, dark, 8, 0.14);
      for (let i = 0; i < 18; i++) {
        blob(ctx, rng() * TEX_W, TEX_H * (0.2 + rng() * 0.6), 14 + rng() * 40, 2 + rng() * 5, 'rgba(255,255,255,0.14)');
      }
      break;
    }
  }
}

/** Builds a unique, repeatable surface texture for a body. No image files needed. */
export function createPlanetTexture(body: CelestialBody): CanvasTexture {
  const [canvas, ctx] = makeCanvas(TEX_W, TEX_H);
  paintBody(ctx, body, mulberry32(hashString(body.id)));
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/** Transparent radial gradient used for the Sun's glow sprite. */
export function createGlowTexture(color: string): CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);
  const rgb = hexToRgb(color);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, rgba(rgb, 0.95));
  g.addColorStop(0.25, rgba(rgb, 0.45));
  g.addColorStop(0.6, rgba(rgb, 0.12));
  g.addColorStop(1, rgba(rgb, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Strip texture for Saturn's rings. U runs from the inner edge to the outer edge. */
export function createRingTexture(): CanvasTexture {
  const w = 1024;
  const [canvas, ctx] = makeCanvas(w, 4);
  const rng = mulberry32(hashString('saturn-rings'));
  for (let x = 0; x < w; x++) {
    const t = x / w;
    let density: number;
    if (t < 0.18) density = 0.22; // faint inner (C) ring
    else if (t < 0.58) density = 0.88; // bright (B) ring
    else if (t < 0.63) density = 0.05; // Cassini division
    else if (t < 0.92) density = 0.68; // (A) ring
    else if (t < 0.935) density = 0.08; // Encke gap
    else density = 0.5;
    density *= 0.82 + 0.18 * Math.sin(x * 0.31) + (rng() - 0.5) * 0.28;
    const tone = mixColors('#8e7a52', '#e7d3a1', 0.35 + 0.65 * Math.abs(Math.sin(x * 0.047 + 1.3)));
    ctx.fillStyle = rgba(tone, Math.min(1, Math.max(0, density)));
    ctx.fillRect(x, 0, 1, 4);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  return texture;
}
