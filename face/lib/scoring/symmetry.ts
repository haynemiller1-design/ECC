import { LandmarkPoint } from "./goldenRatio";

export interface HemifaceDelta {
  leftScore: number;
  rightScore: number;
  symmetryScore: number; // 0-10; 10 = perfect mirror
  deltaMap: { feature: string; deltaPixels: number; percentDiff: number }[];
}

// Computes left vs right hemi-face symmetry using mirrored landmark pairs
export function computeSymmetry(landmarks: LandmarkPoint[]): HemifaceDelta {
  if (!landmarks || landmarks.length < 68) {
    return { leftScore: 0, rightScore: 0, symmetryScore: 0, deltaMap: [] };
  }

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

  // Facial midline: vertical line through nose bridge (pt 27) and chin (pt 8)
  const midX = (landmarks[27].x + landmarks[8].x) / 2;

  const deltaMap = mirrorPairs.map(([li, ri, feature]) => {
    const lPoint = landmarks[li];
    const rPoint = landmarks[ri];
    const lDistFromMid = Math.abs(lPoint.x - midX);
    const rDistFromMid = Math.abs(rPoint.x - midX);
    const deltaPixels = Math.abs(lDistFromMid - rDistFromMid);
    const avgDist = (lDistFromMid + rDistFromMid) / 2;
    const percentDiff = avgDist > 0 ? (deltaPixels / avgDist) * 100 : 0;
    return { feature, deltaPixels, percentDiff };
  });

  const avgPercentDiff = deltaMap.reduce((sum, d) => sum + d.percentDiff, 0) / deltaMap.length;
  // 0% diff → 10/10, 30%+ diff → 0/10
  const symmetryScore = Math.max(0, Math.min(10, (1 - avgPercentDiff / 30) * 10));

  return {
    leftScore: Math.round(symmetryScore * 10) / 10,
    rightScore: Math.round(symmetryScore * 10) / 10,
    symmetryScore: Math.round(symmetryScore * 10) / 10,
    deltaMap,
  };
}
