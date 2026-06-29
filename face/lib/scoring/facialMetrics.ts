import type { LandmarkPoint } from "./goldenRatio";

// Additional aesthetic measures beyond the golden ratio, drawn from the kinds of
// metrics facial-aesthetics analyses use (neoclassical canons, canthal tilt,
// facial fifths, nasal/lip proportion). All approximations from 2-D landmarks.

export interface MetricItem {
  name: string;
  score: number;   // 0-10
  detail: string;
}

export interface FacialMetrics {
  items: MetricItem[];
  aggregate: number; // 0-10 mean of items
}

// Gentle (Gaussian) falloff: deviation == tol scores ~5, never a hard 0.
function devScore(dev: number, tol: number): number {
  const s = 10 * Math.exp(-0.5 * Math.pow((dev / tol) * 1.1774, 2));
  return Math.round(Math.max(1, Math.min(10, s)) * 10) / 10;
}

export function computeFacialMetrics(lm: LandmarkPoint[]): FacialMetrics {
  if (!lm || lm.length < 68) return { items: [], aggregate: 0 };
  const p = lm;

  // ── Canthal tilt: outer canthus higher than inner is the aesthetic ideal. ──
  // Left eye: outer 36, inner 39. Right eye: inner 42, outer 45. (+deg = outer up)
  const tiltL = Math.atan2(p[39].y - p[36].y, Math.abs(p[36].x - p[39].x)) * 180 / Math.PI;
  const tiltR = Math.atan2(p[42].y - p[45].y, Math.abs(p[45].x - p[42].x)) * 180 / Math.PI;
  const avgTilt = (tiltL + tiltR) / 2;
  const canthalTilt = devScore(Math.abs(avgTilt - 6), 9); // ideal ≈ +6°

  // ── Facial fifths: face width should split into five equal eye-widths. ──
  const segs = [
    Math.abs(p[36].x - p[0].x),
    Math.abs(p[39].x - p[36].x),
    Math.abs(p[42].x - p[39].x),
    Math.abs(p[45].x - p[42].x),
    Math.abs(p[16].x - p[45].x),
  ];
  const segMean = segs.reduce((s, v) => s + v, 0) / segs.length;
  const fifthsDev = segMean > 0 ? segs.reduce((s, v) => s + Math.abs(v - segMean), 0) / segs.length / segMean : 1;
  const facialFifths = devScore(fifthsDev, 0.45);

  // ── Nasal harmony: nose width ≈ intercanthal distance (neoclassical). ──
  const noseW = Math.abs(p[35].x - p[31].x);
  const intercanthal = Math.abs(p[42].x - p[39].x);
  const nasalRatio = intercanthal > 0 ? noseW / intercanthal : 0;
  const nasalHarmony = devScore(Math.abs(nasalRatio - 1.0), 0.5);

  // ── Lip proportion: lower vermilion ≈ 1.6× upper (fuller lower lip). ──
  const upperLip = Math.abs(p[62].y - p[51].y);
  const lowerLip = Math.abs(p[57].y - p[66].y);
  const lipRatio = upperLip > 0 ? lowerLip / upperLip : 0;
  const lipProportion = devScore(Math.abs(lipRatio - 1.6), 1.2);

  // ── Mouth–nose harmony: mouth width ≈ 1.5× nose width (neoclassical). ──
  const mouthW = Math.abs(p[54].x - p[48].x);
  const mnRatio = noseW > 0 ? mouthW / noseW : 0;
  const mouthNose = devScore(Math.abs(mnRatio - 1.5), 0.8);

  const items: MetricItem[] = [
    { name: "Eye Tilt", score: canthalTilt, detail: `Eye angle ${avgTilt >= 0 ? "+" : ""}${avgTilt.toFixed(1)}° (a slight upward tilt is ideal)` },
    { name: "Face Width Balance", score: facialFifths, detail: "Even spacing across the width of the face" },
    { name: "Nose & Eyes", score: nasalHarmony, detail: "Nose width vs the space between your eyes" },
    { name: "Lip Fullness", score: lipProportion, detail: "Balance of lower lip to upper lip" },
    { name: "Mouth & Nose", score: mouthNose, detail: "Mouth width vs nose width" },
  ];
  const aggregate = Math.round(items.reduce((s, it) => s + it.score, 0) / items.length * 10) / 10;
  return { items, aggregate };
}
