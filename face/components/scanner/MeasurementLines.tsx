"use client";
import { LandmarkPoint } from "@/lib/scoring/goldenRatio";

interface Props {
  landmarks: LandmarkPoint[];
  srcWidth: number;   // pixel space the landmarks live in
  srcHeight: number;
  mirrored?: boolean; // flip horizontally to match a mirrored (selfie) preview
}

// The specific segments the analysis measures — lines with a dot at each end,
// no labels. Indices are face-api 68-point landmarks.
const SEGMENTS: [number, number][] = [
  [27, 33], // mid facial third (nasion → subnasale)
  [33, 8],  // lower facial third (subnasale → chin)
  [39, 42], // intercanthal width
  [36, 39], // left eye width
  [42, 45], // right eye width
  [31, 35], // nose width
  [48, 54], // mouth width
  [1, 15],  // bizygomatic (cheekbone) width
  [4, 12],  // gonial / jaw width
];

const ENDPOINTS = Array.from(new Set(SEGMENTS.flat()));

export default function MeasurementLines({ landmarks, srcWidth, srcHeight, mirrored = false }: Props) {
  if (!landmarks || landmarks.length < 68 || srcWidth <= 0 || srcHeight <= 0) return null;

  return (
    <svg
      viewBox={`0 0 ${srcWidth} ${srcHeight}`}
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 6,
        transform: mirrored ? "scaleX(-1)" : undefined,
      }}
    >
      {SEGMENTS.map(([a, b], i) => (
        <line
          key={`seg-${i}`}
          x1={landmarks[a].x} y1={landmarks[a].y}
          x2={landmarks[b].x} y2={landmarks[b].y}
          stroke="rgba(6,182,212,0.85)"
          strokeWidth={Math.max(1, srcWidth / 320)}
          strokeLinecap="round"
        />
      ))}
      {ENDPOINTS.map((idx) => (
        <circle
          key={`dot-${idx}`}
          cx={landmarks[idx].x} cy={landmarks[idx].y}
          r={Math.max(2, srcWidth / 130)}
          fill="#06B6D4"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={Math.max(0.5, srcWidth / 640)}
        />
      ))}
    </svg>
  );
}
