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
  const mirrorPairs: [number, number, string][] = [
    [0, 16, "Jaw Corners"],
    [1, 15, "Lower Jaw"],
    [2, 14, "Jaw Line"],
    [3, 13, "Mandible"],
    [4, 12, "Cheek Lower"],
    [5, 11, "Cheek Mid"],
    [6, 10, "Cheek Upper"],
    [36, 45, "Eye Outer Canthus"],
    [39, 42, "Eye Inner Canthus"],
    [37, 44, "Eye Upper Lid"],
    [41, 46, "Eye Lower Lid"],
    [31, 35, "Nose Ala"],
    [48, 54, "Mouth Corner"],
    [49, 53, "Upper Lip"],
    [50, 52, "Upper Lip Cupid"],
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
