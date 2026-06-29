// Deterministic facial-proportion scoring engine.
// Identical landmark sets always produce identical scores — no randomness.
import { scoreCloseness } from "./calibrate";

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

  const nasion = p[27];
  const subnasale = p[33];
  const gnathion = p[8];
  const nasionToSubnasale = dist(nasion, subnasale);
  const subnasaleToGnathion = dist(subnasale, gnathion);
  const faceWidth = dist(p[1], p[15]);

  // Eye measurements
  const intercanthalDist = dist(p[39], p[42]);
  const avgEyeWidth = (dist(p[36], p[39]) + dist(p[42], p[45])) / 2;
  // Nose / mouth widths
  const noseWidth = dist(p[31], p[35]);
  const mouthWidth = dist(p[48], p[54]);

  // Each metric is measurable from real landmarks, with a target drawn from
  // anthropometric norms and a tolerance tuned so an ordinary face sits mid-scale.
  const mk = (name: string, actual: number, ideal: number, relTol: number): RatioResult => ({
    name, actual, ideal, deviation: ideal ? Math.abs(actual - ideal) / Math.abs(ideal) : 0,
    score: scoreCloseness(actual, ideal, relTol),
  });

  const ratios: RatioResult[] = [
    // Mid third (nasion→subnasale) vs lower third (subnasale→chin). ~0.80 ideal.
    mk("Mid-to-Lower Balance", nasionToSubnasale / subnasaleToGnathion, 0.80, 0.26),
    // Inner-eye gap should be about one eye-width.
    mk("Eye Spacing", intercanthalDist / avgEyeWidth, 1.0, 0.24),
    // Nose width ≈ 0.62 of mouth width.
    mk("Nose & Mouth Width", noseWidth / mouthWidth, 0.62, 0.26),
    // Mouth width ≈ 0.40 of face width.
    mk("Mouth & Face Width", mouthWidth / faceWidth, 0.40, 0.26),
  ];

  const aggregate = Math.round(ratios.reduce((s, r) => s + r.score, 0) / ratios.length * 10) / 10;
  return { aggregate, ratios };
}
