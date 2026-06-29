import type { LandmarkPoint } from "./goldenRatio";

// Pose normalization ("frontalization"): correct a tilted / turned face back
// toward a straight-on view BEFORE scoring, so an angled photo still gets a
// fair rating. This is a first-order 2-D correction (no 3-D model): it levels
// head tilt (roll) and rescales the horizontal axis for the head turn (yaw).

export interface PoseCorrection {
  landmarks: LandmarkPoint[];
  yawDeg: number;   // estimated left/right turn
  rollDeg: number;  // estimated head tilt
  reliable: boolean; // false when turned/tilted too far for an accurate rating
}

function centroid(p: LandmarkPoint[], idx: number[]): LandmarkPoint {
  let sx = 0, sy = 0;
  for (const i of idx) { sx += p[i].x; sy += p[i].y; }
  return { x: sx / idx.length, y: sy / idx.length };
}
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k);

export function frontalizeLandmarks(lm: LandmarkPoint[]): PoseCorrection {
  if (!lm || lm.length < 68) return { landmarks: lm, yawDeg: 0, rollDeg: 0, reliable: false };

  // ── 1. Roll: rotate so the eye line is horizontal. ──
  const leftEye = centroid(lm, range(36, 41));
  const rightEye = centroid(lm, range(42, 47));
  const rollRad = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
  const c = centroid(lm, range(0, 67));
  const cosR = Math.cos(-rollRad), sinR = Math.sin(-rollRad);
  let pts = lm.map(p => {
    const dx = p.x - c.x, dy = p.y - c.y;
    return { x: c.x + dx * cosR - dy * sinR, y: c.y + dx * sinR + dy * cosR };
  });

  // ── 2. Yaw: estimate the turn from how the nose sits between the face edges. ──
  const nose = pts[30], L = pts[0], R = pts[16];
  const leftW = nose.x - L.x, rightW = R.x - nose.x;
  const asym = (rightW - leftW) / Math.max(1, rightW + leftW); // -1..1
  // The nose-between-edges asymmetry under-reads the true turn; calibrate it
  // (~0.55 maps the projected shift back to an approximate head-turn angle).
  const yawRad = Math.asin(Math.max(-0.97, Math.min(0.97, asym / 0.55)));
  const yawDeg = yawRad * 180 / Math.PI;
  const rollDeg = rollRad * 180 / Math.PI;

  // ── 3. Undo the horizontal foreshortening (widths shrink by ~cos(yaw)). ──
  const midX = (L.x + R.x) / 2;
  const cosY = Math.max(0.5, Math.cos(yawRad));
  pts = pts.map(p => ({ x: midX + (p.x - midX) / cosY, y: p.y }));

  const reliable = Math.abs(yawDeg) <= 32 && Math.abs(rollDeg) <= 22;
  return { landmarks: pts, yawDeg, rollDeg, reliable };
}
