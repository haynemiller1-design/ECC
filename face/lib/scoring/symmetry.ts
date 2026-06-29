import { LandmarkPoint } from "./goldenRatio";

export interface HemifaceDelta {
  leftScore: number;
  rightScore: number;
  symmetryScore: number; // 0-10; 10 = perfect mirror
  deltaMap: { feature: string; deltaPixels: number; percentDiff: number; score: number }[];
}

// Computes left vs right hemi-face symmetry using mirrored landmark pairs.
// `yawDeg` (estimated head turn) widens the tolerance: an angled photo shows
// more apparent asymmetry that isn't real, so we don't over-penalize it.
export function computeSymmetry(landmarks: LandmarkPoint[], yawDeg = 0): HemifaceDelta {
  if (!landmarks || landmarks.length < 68) {
    return { leftScore: 0, rightScore: 0, symmetryScore: 0, deltaMap: [] };
  }
  const tol = 30 * (1 + Math.min(Math.abs(yawDeg), 35) / 22); // 30% at 0°, wider when turned
  const toScore = (pct: number) => Math.round(Math.max(0, Math.min(10, (1 - pct / tol) * 10)) * 10) / 10;

  // Mirrored pairs [left_idx, right_idx]
  // Ordered so the first five shown are the most recognizable, plain features.
  const mirrorPairs: [number, number, string][] = [
    [36, 45, "Eyes"],
    [4, 12, "Cheekbones"],
    [2, 14, "Jawline"],
    [31, 35, "Nose"],
    [48, 54, "Mouth"],
    [0, 16, "Jaw Width"],
    [1, 15, "Lower Jaw"],
    [3, 13, "Jaw"],
    [5, 11, "Mid Cheeks"],
    [6, 10, "Upper Cheeks"],
    [39, 42, "Inner Eye Corners"],
    [37, 44, "Upper Eyelids"],
    [41, 46, "Lower Eyelids"],
    [49, 53, "Upper Lip"],
    [50, 52, "Cupid's Bow"],
  ];

  // Facial midline: the average of the mirrored pairs' midpoints. This is a
  // yaw-robust symmetry axis — unlike the nose, it doesn't drift toward the
  // near side when the head is turned, so a slightly angled face isn't unfairly
  // scored as asymmetric.
  const midX = mirrorPairs.reduce((s, [li, ri]) => s + (landmarks[li].x + landmarks[ri].x) / 2, 0) / mirrorPairs.length;

  const rows = mirrorPairs.map(([li, ri, feature]) => {
    const lDistFromMid = Math.abs(landmarks[li].x - midX);
    const rDistFromMid = Math.abs(landmarks[ri].x - midX);
    const deltaPixels = Math.abs(lDistFromMid - rDistFromMid);
    const avgDist = (lDistFromMid + rDistFromMid) / 2;
    const percentDiff = avgDist > 0 ? (deltaPixels / avgDist) * 100 : 0;
    return { feature, deltaPixels, percentDiff, avgDist };
  });
  const deltaMap = rows.map(({ feature, deltaPixels, percentDiff }) => ({ feature, deltaPixels, percentDiff, score: toScore(percentDiff) }));

  // Weight each feature by how far it sits from the midline (its width). Wide,
  // lateral features (eyes, cheeks, jaw) are barely distorted by a head turn,
  // while narrow central ones (nose, inner lips) distort a lot — so weighting by
  // width makes the symmetry score robust to an angled photo.
  const wSum = rows.reduce((s, r) => s + r.avgDist, 0) || 1;
  const avgPercentDiff = rows.reduce((s, r) => s + r.percentDiff * r.avgDist, 0) / wSum;
  const symmetryScore = toScore(avgPercentDiff);

  return {
    leftScore: Math.round(symmetryScore * 10) / 10,
    rightScore: Math.round(symmetryScore * 10) / 10,
    symmetryScore: Math.round(symmetryScore * 10) / 10,
    deltaMap,
  };
}
