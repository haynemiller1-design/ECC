// Deterministic golden ratio scoring engine.
// Identical landmark sets always produce identical scores — no randomness.

export const PHI = 1.618033988749895;

export interface LandmarkPoint { x: number; y: number; }

export interface RatioResult {
  name: string;
  actual: number;
  ideal: number;
  score: number; // 0-10
  deviation: number; // absolute % deviation from ideal
}

export interface GoldenRatioScore {
  aggregate: number; // 0-10, deterministic
  ratios: RatioResult[];
}

function dist(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

function scoreRatio(actual: number, ideal: number): number {
  if (ideal === 0) return 0;
  const deviation = Math.abs(actual - ideal) / ideal;
  return Math.max(0, Math.min(10, (1 - deviation) * 10));
}

// face-api.js 68-point landmark indices (0-based):
// Trichion (hairline): approximated as midpoint of points 0 & 16 shifted up — use point 27 (nose bridge top) as proxy
// Nasion: point 27 (nose bridge)
// Subnasale: point 33 (nose tip base)
// Gnathion: point 8 (chin tip)
// Left eye inner: 39, outer: 36 | Right eye inner: 42, outer: 45
// Nose width: points 31 (left ala) & 35 (right ala)
// Mouth: points 48 (left cheilion) & 54 (right cheilion)
// Face width (bizygomatic): points 1 & 15

export function computeGoldenRatioScore(landmarks: LandmarkPoint[]): GoldenRatioScore {
  if (!landmarks || landmarks.length < 68) {
    return { aggregate: 0, ratios: [] };
  }

  const p = landmarks;

  // Vertical facial thirds
  // Estimate trichion: extrapolate above nasion by the nasion-to-subnasale distance
  const nasion = p[27];
  const subnasale = p[33];
  const gnathion = p[8];
  const nasionToSubnasale = dist(nasion, subnasale);
  const subnasaleToGnathion = dist(subnasale, gnathion);
  const trichionEstimated: LandmarkPoint = {
    x: nasion.x,
    y: nasion.y - nasionToSubnasale * PHI,
  };
  const trichionToNasion = dist(trichionEstimated, nasion);

  const r1: RatioResult = {
    name: "Upper to Mid Facial Third",
    actual: trichionToNasion / nasionToSubnasale,
    ideal: 1.0,
    score: 0,
    deviation: 0,
  };
  r1.deviation = Math.abs(r1.actual - r1.ideal) / r1.ideal;
  r1.score = scoreRatio(r1.actual, r1.ideal);

  const r2: RatioResult = {
    name: "Mid to Lower Facial Third",
    actual: nasionToSubnasale / subnasaleToGnathion,
    ideal: PHI,
    score: 0,
    deviation: 0,
  };
  r2.deviation = Math.abs(r2.actual - r2.ideal) / r2.ideal;
  r2.score = scoreRatio(r2.actual, r2.ideal);

  // Intercanthal distance vs. single eye width
  const leftEyeInner = p[39]; const leftEyeOuter = p[36];
  const rightEyeInner = p[42]; const rightEyeOuter = p[45];
  const intercanthalDist = dist(leftEyeInner, rightEyeInner);
  const leftEyeWidth = dist(leftEyeOuter, leftEyeInner);
  const rightEyeWidth = dist(rightEyeInner, rightEyeOuter);
  const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2;
  const r3: RatioResult = {
    name: "Intercanthal / Eye Width",
    actual: intercanthalDist / avgEyeWidth,
    ideal: 1.0,
    score: 0,
    deviation: 0,
  };
  r3.deviation = Math.abs(r3.actual - r3.ideal) / r3.ideal;
  r3.score = scoreRatio(r3.actual, r3.ideal);

  // Nose width vs. mouth width
  const noseLeft = p[31]; const noseRight = p[35];
  const mouthLeft = p[48]; const mouthRight = p[54];
  const noseWidth = dist(noseLeft, noseRight);
  const mouthWidth = dist(mouthLeft, mouthRight);
  const r4: RatioResult = {
    name: "Nose Width / Mouth Width",
    actual: noseWidth / mouthWidth,
    ideal: 1 / PHI, // ~0.618
    score: 0,
    deviation: 0,
  };
  r4.deviation = Math.abs(r4.actual - r4.ideal) / r4.ideal;
  r4.score = scoreRatio(r4.actual, r4.ideal);

  // Weighted aggregate: R1(0.25) R2(0.25) R3(0.25) R4(0.25)
  const aggregate = r1.score * 0.25 + r2.score * 0.25 + r3.score * 0.25 + r4.score * 0.25;

  return {
    aggregate: Math.round(aggregate * 10) / 10,
    ratios: [r1, r2, r3, r4],
  };
}
