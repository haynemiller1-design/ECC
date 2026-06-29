import type { LandmarkPoint } from "./goldenRatio";

// "Definition" = how lean / sculpted vs full / round the face reads. This is the
// facial-fullness signal (an average face is often slightly fuller, a model
// leaner) that pure proportion ratios miss — so it's a big part of separating an
// average grade from a high one.

export interface FaceShape {
  definition: number; // 0-10, higher = more defined/lean
  taper: number;      // jaw width / cheekbone width (lower = more tapered)
  fwhr: number;       // face width / height (higher = rounder/fuller)
}

function dist(a: LandmarkPoint, b: LandmarkPoint): number { return Math.hypot(b.x - a.x, b.y - a.y); }

export function computeFaceShape(lm: LandmarkPoint[]): FaceShape {
  if (!lm || lm.length < 68) return { definition: 5, taper: 0, fwhr: 0 };
  const cheekW = dist(lm[1], lm[15]);            // cheekbone-to-cheekbone
  const jawW = dist(lm[4], lm[12]);              // lower-jaw width
  const browY = (lm[19].y + lm[24].y) / 2;
  const faceH = Math.abs(lm[8].y - browY);        // brow line to chin
  const taper = cheekW > 0 ? jawW / cheekW : 1;   // lower = more defined jaw
  const fwhr = faceH > 0 ? cheekW / faceH : 1;    // higher = rounder/wider face

  // A tapered jaw (taper ≈ 0.66) reads sculpted → high; a full/round lower face
  // (taper ≈ 0.95) reads softer → low.
  let score = 10 - (taper - 0.66) * 26;
  // A wide/round face (high width-to-height) reads fuller — mild extra penalty.
  if (fwhr > 1.05) score -= (fwhr - 1.05) * 14;
  score = Math.max(1, Math.min(10, score));
  return {
    definition: Math.round(score * 10) / 10,
    taper: Math.round(taper * 100) / 100,
    fwhr: Math.round(fwhr * 100) / 100,
  };
}
