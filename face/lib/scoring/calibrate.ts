// Shared scoring helpers so every metric maps to a sensible 1-10 the same way.
//
// Honest note: these are geometry-from-landmarks heuristics calibrated to
// published facial-proportion norms — not a model trained on human ratings, so
// they can't perfectly rank "average" vs "model". The goal here is a sane,
// well-spread distribution that doesn't crash to 0.0 and centers an ordinary
// face around 5.

// How close `actual` is to an ideal target, on a 1-10 scale with a gentle
// (Gaussian) falloff. `relTol` is the relative deviation that scores ~5, so a
// typical face lands mid-scale and only real outliers score low. Never returns
// a hard 0.
export function scoreCloseness(actual: number, ideal: number, relTol: number): number {
  if (!isFinite(actual) || ideal === 0) return 1;
  const dev = Math.abs(actual - ideal) / Math.abs(ideal);
  // dev == relTol  → 5.0 ;  dev == 0 → 10 ;  large dev → ~1
  const s = 10 * Math.exp(-0.5 * Math.pow((dev / relTol) * 1.1774, 2));
  return Math.round(Math.max(1, Math.min(10, s)) * 10) / 10;
}

// Same idea but for a value that should sit inside a band [lo, hi] (e.g. an
// angle). Inside the band → 10, falling off outside by `relTol` of the band.
export function scoreBand(actual: number, lo: number, hi: number, softness: number): number {
  if (!isFinite(actual)) return 1;
  let dev = 0;
  if (actual < lo) dev = (lo - actual) / softness;
  else if (actual > hi) dev = (actual - hi) / softness;
  const s = 10 * Math.exp(-0.5 * Math.pow(dev, 2));
  return Math.round(Math.max(1, Math.min(10, s)) * 10) / 10;
}

// Final perceptual calibration for the headline overall score: expands the
// (regression-to-the-mean) raw average around 5 so the 1-10 scale is usable —
// an ordinary face ≈ 5, well-proportioned ≈ 8-9, poorly proportioned ≈ 2-3.
export function calibrateOverall(raw: number): number {
  // Landmark ratios cluster high (most people sit near the proportional ideals),
  // so we recenter: a typical raw ≈ 6.5 maps to 5 ("average"), spreading out to
  // ~7-8 for well-proportioned and ~2-4 for poorly-proportioned faces.
  const spread = (raw - 6.5) * 1.6 + 5.0;
  return Math.round(Math.max(1, Math.min(10, spread)) * 10) / 10;
}
