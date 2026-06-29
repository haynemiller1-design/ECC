import { LandmarkPoint } from "./goldenRatio";
import { scoreCloseness } from "./calibrate";

export interface BoneMetrics {
  bizygomaticScore: number; // face width vs length ratio
  gonialScore: number;      // jaw angle sharpness
  jawlineScore: number;     // jaw definition (chin projection)
  aggregateBoneScore: number;
  dimorphismNote: string;
}

export function computeBoneMetrics(
  landmarks: LandmarkPoint[],
  sex: "male" | "female"
): BoneMetrics {
  if (!landmarks || landmarks.length < 68) {
    return { bizygomaticScore: 0, gonialScore: 0, jawlineScore: 0, aggregateBoneScore: 0, dimorphismNote: "" };
  }

  const p = landmarks;

  // Bizygomatic width (cheekbone-to-cheekbone): approx pts 1 & 15
  const bizygWidth = Math.abs(p[15].x - p[1].x);
  // Face height: pt 27 (nasion) to pt 8 (gnathion)
  const faceHeight = Math.abs(p[8].y - p[27].y);
  const widthToHeight = bizygWidth / faceHeight;

  // Ideal ratio differs by sex
  const idealWidthToHeight = sex === "male" ? 0.78 : 0.72;
  const bizygomaticScore = scoreCloseness(widthToHeight, idealWidthToHeight, 0.22);

  // Gonial angle: angle at pts 4 & 12 (jaw angle region)
  // Approximate using vector from pt 5→4 (jaw) and pt 4→5's y component
  const leftJawVec = { x: p[4].x - p[5].x, y: p[4].y - p[5].y };
  const chinVec = { x: p[8].x - p[4].x, y: p[8].y - p[4].y };
  const dotL = leftJawVec.x * chinVec.x + leftJawVec.y * chinVec.y;
  const magL = Math.sqrt(leftJawVec.x ** 2 + leftJawVec.y ** 2);
  const magC = Math.sqrt(chinVec.x ** 2 + chinVec.y ** 2);
  const gonialAngle = magL > 0 && magC > 0
    ? Math.acos(Math.max(-1, Math.min(1, dotL / (magL * magC)))) * (180 / Math.PI)
    : 120;

  // Ideal gonial angle: male ~115°, female ~120°
  const idealGonial = sex === "male" ? 115 : 120;
  const gonialScore = scoreCloseness(gonialAngle, idealGonial, 0.22);

  // Jawline definition: chin projection (distance from pt 8 to horizontal line of pt 6-10)
  const jawLineY = (p[6].y + p[10].y) / 2;
  const chinProjection = p[8].y - jawLineY;
  const relProjection = chinProjection / faceHeight;
  // Ideal projection: ~18-22% of face height for sharp chin
  const idealProjection = sex === "male" ? 0.22 : 0.18;
  const jawlineScore = scoreCloseness(relProjection, idealProjection, 0.35);

  const aggregateBoneScore = Math.round(
    (bizygomaticScore * 0.35 + gonialScore * 0.35 + jawlineScore * 0.3) * 10
  ) / 10;

  const dimorphismNote = sex === "male"
    ? "Compared with typical male proportions: broader cheekbones, a sharper jaw angle, and a stronger chin."
    : "Compared with typical female proportions: softer cheekbones, a gentler jaw angle, and a more tapered chin.";

  return { bizygomaticScore, gonialScore, jawlineScore, aggregateBoneScore, dimorphismNote };
}
