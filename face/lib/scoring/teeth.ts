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
 * @param lm           68-pt landmarks of the smile capture
 * @param brightness   mean luminance (0-255) sampled from the inner-mouth region
 * @param faceWidth    bizygomatic-ish face width in the same pixel space
 */
export function computeTeethMetrics(lm: LandmarkPoint[], teethBrightness: number, faceWidth: number): TeethMetrics {
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

  // ── Whiteness: from the brightest (tooth) pixels, baseline ~110 (dim teeth)
  // to ~235 (bright white). Below ~70 the teeth weren't really visible/lit, so
  // we don't trust the reading and exclude it from the aggregate. ──
  const whitenessConfident = teethBrightness >= 70;
  const whiteness = whitenessConfident
    ? Math.round(Math.min(10, Math.max(0, (teethBrightness - 110) / (235 - 110) * 10)) * 10) / 10
    : 0;

  // ── Proportion: smile width vs face width. Aesthetic ideal ≈ 0.50. ──
  const widthRatio = mouthW / faceWidth;
  const proportion = devScore(Math.abs(widthRatio - 0.50), 0.22);

  // Weight whiteness in only when we trust it; otherwise reweight the rest.
  const aggregate = whitenessConfident
    ? Math.round((alignment * 0.3 + symmetry * 0.3 + whiteness * 0.2 + proportion * 0.2) * 10) / 10
    : Math.round((alignment * 0.4 + symmetry * 0.35 + proportion * 0.25) * 10) / 10;

  const note = !whitenessConfident
    ? "Couldn't read tooth shade reliably (teeth not clearly visible or lit) — whiteness excluded."
    : aggregate >= 8
      ? "Even, balanced smile with good proportion."
      : aggregate >= 6
        ? "Generally balanced; minor asymmetry or shade variation."
        : "Notable asymmetry, shade, or proportion variance detected.";

  return { alignment, symmetry, whiteness, proportion, aggregate, whitenessConfident, note };
}
