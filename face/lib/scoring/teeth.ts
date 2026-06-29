import type { LandmarkPoint } from "./goldenRatio";

// Aesthetic smile/teeth assessment from the smile capture. From a webcam these
// are approximations, not dental diagnostics — see disclaimer on the results UI.

export interface TeethMetrics {
  alignment: number;   // 0-10 — how level/even the visible tooth row is
  symmetry: number;    // 0-10 — left/right balance of the smile
  whiteness: number;   // 0-10 — rough shade/brightness of the tooth region
  proportion: number;  // 0-10 — mouth/smile width vs facial proportion
  aggregate: number;   // 0-10 weighted overall
  whitenessConfident: boolean; // false when teeth weren't bright/visible enough to judge
  note: string;
}

function dist(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

// Map a deviation (0 = perfect) to a 0-10 score with a soft falloff.
function devScore(deviation: number, tolerance: number): number {
  const s = 10 * Math.max(0, 1 - deviation / tolerance);
  return Math.round(s * 10) / 10;
}

/**
 * @param lm             68-pt landmarks of the smile capture
 * @param teethBrightness luma (0-255) of the brightest tooth pixels
 * @param faceBrightness  luma (0-255) of the overall face — lighting reference
 * @param faceWidth       bizygomatic-ish face width in the same pixel space
 */
export function computeTeethMetrics(lm: LandmarkPoint[], teethBrightness: number, faceBrightness: number, faceWidth: number): TeethMetrics {
  if (!lm || lm.length < 68 || faceWidth <= 0) {
    return { alignment: 0, symmetry: 0, whiteness: 0, proportion: 0, aggregate: 0, whitenessConfident: false, note: "No smile capture available." };
  }

  // ── Alignment: how level the inner upper-lip / tooth line is. ──
  // Inner mouth top points 61,62,63 should sit on a near-horizontal line.
  const topPts = [lm[61], lm[62], lm[63]];
  const meanY = topPts.reduce((s, p) => s + p.y, 0) / topPts.length;
  const mouthW = dist(lm[48], lm[54]);
  const levelDev = topPts.reduce((s, p) => s + Math.abs(p.y - meanY), 0) / topPts.length / Math.max(1, mouthW);
  const alignment = devScore(levelDev, 0.12);

  // ── Symmetry: mouth-corner heights + distances to the facial midline. ──
  const midX = (lm[27].x + lm[8].x) / 2; // nasion→chin vertical midline x (approx)
  const leftCorner = lm[48], rightCorner = lm[54];
  const cornerYDev = Math.abs(leftCorner.y - rightCorner.y) / Math.max(1, mouthW);
  const distDev = Math.abs(Math.abs(leftCorner.x - midX) - Math.abs(rightCorner.x - midX)) / Math.max(1, mouthW);
  const symmetry = devScore((cornerYDev + distDev) / 2, 0.16);

  // ── Whiteness: judged by how much BRIGHTER the teeth are than the rest of the
  // face, so lighting (which dims the whole image equally) doesn't tank it.
  // Teeth at/above face brightness already read well; this skews realistically
  // high. If the face itself is too dark to judge, we say so and exclude it. ──
  const lit = faceBrightness >= 70;        // enough light to assess shade at all
  const teethVisible = teethBrightness >= 60;
  const whitenessConfident = lit && teethVisible;
  const rel = faceBrightness > 0 ? teethBrightness / faceBrightness : 1; // teeth-vs-face
  // rel 0.85 → 4, 1.0 → ~6.6, 1.15 → ~8.8, 1.25 → 10  (clamped)
  const whiteness = whitenessConfident
    ? Math.round(Math.min(10, Math.max(0, 4 + (rel - 0.85) / 0.35 * 6)) * 10) / 10
    : 0;

  // ── Proportion: smile width vs face width. Aesthetic ideal ≈ 0.50. ──
  const widthRatio = mouthW / faceWidth;
  const proportion = devScore(Math.abs(widthRatio - 0.50), 0.22);

  // Weight whiteness in only when we trust it; otherwise reweight the rest.
  const aggregate = whitenessConfident
    ? Math.round((alignment * 0.3 + symmetry * 0.3 + whiteness * 0.2 + proportion * 0.2) * 10) / 10
    : Math.round((alignment * 0.4 + symmetry * 0.35 + proportion * 0.25) * 10) / 10;

  const note = !lit
    ? "Lighting was too low to judge tooth shade accurately — try again in brighter, even light."
    : !teethVisible
      ? "Teeth weren't clearly visible, so whiteness was excluded — smile a bit wider next time."
      : aggregate >= 8
        ? "Even, balanced smile with good proportion."
        : aggregate >= 6
          ? "Generally balanced; minor asymmetry or shade variation."
          : "Notable asymmetry, shade, or proportion variance detected.";

  return { alignment, symmetry, whiteness, proportion, aggregate, whitenessConfident, note };
}
