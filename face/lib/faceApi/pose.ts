import type { LandmarkPoint } from "@/lib/scoring/goldenRatio";

// ── Live face-pose & framing metrics derived from the 68-point mesh ──
// All pure functions so the capture state-machine can be unit-tested without a
// camera. Coordinates are in the raw (un-mirrored) video pixel space.

export interface FaceMetrics {
  detected: boolean;
  yaw: number;            // -1..1, 0 = frontal. + = subject's head turned (raw coords)
  pitch: number;          // ~-1..1, + = chin up
  centerOffsetX: number;  // fraction of frame from center, + = face right of center (raw)
  centerOffsetY: number;  // + = face below center
  sizeRatio: number;      // face width / frame width
  smileCurve: number;     // >0 = mouth corners raised (smiling)
  mouthOpenRatio: number; // inner mouth height / mouth width (teeth visible when high)
}

export type ScanTarget = "front" | "left" | "right" | "smile";

export interface TargetCheck {
  satisfied: boolean;
  hint: string;
}

function dist(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

const ZERO: FaceMetrics = {
  detected: false, yaw: 0, pitch: 0, centerOffsetX: 0, centerOffsetY: 0,
  sizeRatio: 0, smileCurve: 0, mouthOpenRatio: 0,
};

export function computeFaceMetrics(lm: LandmarkPoint[] | null, frameW: number, frameH: number): FaceMetrics {
  if (!lm || lm.length < 68 || frameW <= 0 || frameH <= 0) return ZERO;

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of lm) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const faceW = maxX - minX;
  const cX = (minX + maxX) / 2, cY = (minY + maxY) / 2;

  // Yaw: how far the nose sits between the two face edges.
  const nose = lm[30];
  const leftDist = nose.x - lm[0].x;
  const rightDist = lm[16].x - nose.x;
  const yaw = (rightDist - leftDist) / Math.max(1, rightDist + leftDist);

  // Pitch: vertical balance of (eyes→nose) vs (nose→chin).
  const eyeMidY = (lm[36].y + lm[45].y) / 2;
  const upper = lm[30].y - eyeMidY;
  const lower = lm[8].y - lm[30].y;
  const pitch = (lower - upper) / Math.max(1, lower + upper) - 0.34;

  // Smile / teeth from the mouth.
  const mouthW = dist(lm[48], lm[54]);
  const innerOpen = dist(lm[62], lm[66]);
  const cornerY = (lm[48].y + lm[54].y) / 2;
  const lipCenterY = (lm[51].y + lm[57].y) / 2;

  return {
    detected: true,
    yaw,
    pitch,
    centerOffsetX: (cX - frameW / 2) / frameW,
    centerOffsetY: (cY - frameH / 2) / frameH,
    sizeRatio: faceW / frameW,
    smileCurve: (lipCenterY - cornerY) / Math.max(1, mouthW),
    mouthOpenRatio: innerOpen / Math.max(1, mouthW),
  };
}

// Tunable thresholds (exported so they're easy to adjust on-device).
export const POSE = {
  SIZE_MIN: 0.30,
  SIZE_MAX: 0.80,
  CENTER_TOL: 0.13,
  FRONTAL: 0.17,   // |yaw| below this counts as facing forward
  PROFILE: 0.26,   // |yaw| beyond this counts as a profile turn
  SMILE_CURVE: 0.05,
  MOUTH_OPEN: 0.09,
};

// Is the face framed well enough for a frontal/smile shot? Returns a corrective
// hint, or null when framing is good. `mirrored` flips horizontal hints so they
// match the selfie (mirrored) preview the user sees.
function framingHint(m: FaceMetrics, mirrored: boolean): string | null {
  if (m.sizeRatio < POSE.SIZE_MIN) return "Move a little closer";
  if (m.sizeRatio > POSE.SIZE_MAX) return "Move back a little";
  if (m.centerOffsetY < -POSE.CENTER_TOL) return "Lower the camera a bit";
  if (m.centerOffsetY > POSE.CENTER_TOL) return "Raise the camera a bit";
  const ox = mirrored ? -m.centerOffsetX : m.centerOffsetX;
  if (ox > POSE.CENTER_TOL) return "Move slightly left";
  if (ox < -POSE.CENTER_TOL) return "Move slightly right";
  return null;
}

export function checkTarget(target: ScanTarget, m: FaceMetrics, mirrored = true): TargetCheck {
  if (!m.detected) return { satisfied: false, hint: "Position your face in the frame" };

  switch (target) {
    case "front": {
      const f = framingHint(m, mirrored);
      if (f) return { satisfied: false, hint: f };
      if (Math.abs(m.yaw) > POSE.FRONTAL) return { satisfied: false, hint: "Face the camera straight on" };
      return { satisfied: true, hint: "Hold still…" };
    }
    case "left": {
      const y = mirrored ? -m.yaw : m.yaw;
      if (m.sizeRatio < POSE.SIZE_MIN * 0.8) return { satisfied: false, hint: "Move a little closer" };
      if (y > -POSE.PROFILE) return { satisfied: false, hint: "Slowly turn your head to your LEFT" };
      return { satisfied: true, hint: "Hold still…" };
    }
    case "right": {
      const y = mirrored ? -m.yaw : m.yaw;
      if (m.sizeRatio < POSE.SIZE_MIN * 0.8) return { satisfied: false, hint: "Move a little closer" };
      if (y < POSE.PROFILE) return { satisfied: false, hint: "Slowly turn your head to your RIGHT" };
      return { satisfied: true, hint: "Hold still…" };
    }
    case "smile": {
      const f = framingHint(m, mirrored);
      if (f) return { satisfied: false, hint: f };
      if (Math.abs(m.yaw) > POSE.FRONTAL + 0.06) return { satisfied: false, hint: "Face forward and smile" };
      if (m.smileCurve < POSE.SMILE_CURVE || m.mouthOpenRatio < POSE.MOUTH_OPEN) {
        return { satisfied: false, hint: "Smile big — show your teeth!" };
      }
      return { satisfied: true, hint: "Hold still…" };
    }
  }
}
