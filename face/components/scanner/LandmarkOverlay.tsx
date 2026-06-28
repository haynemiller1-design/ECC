"use client";
import { LandmarkPoint } from "@/lib/scoring/goldenRatio";

interface Props {
  landmarks: LandmarkPoint[];
  width: number;
  height: number;
}

// Connects the 68-point mesh with line segments matching face-api.js groups
const CONNECTIONS: [number, number][] = [
  // Jaw line
  [0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],
  // Right eyebrow
  [17,18],[18,19],[19,20],[20,21],
  // Left eyebrow
  [22,23],[23,24],[24,25],[25,26],
  // Nose bridge
  [27,28],[28,29],[29,30],
  // Nose bottom
  [30,31],[31,32],[32,33],[33,34],[34,35],
  // Right eye
  [36,37],[37,38],[38,39],[39,40],[40,41],[41,36],
  // Left eye
  [42,43],[43,44],[44,45],[45,46],[46,47],[47,42],
  // Outer lips
  [48,49],[49,50],[50,51],[51,52],[52,53],[53,54],[54,55],[55,56],[56,57],[57,58],[58,59],[59,48],
  // Inner lips
  [60,61],[61,62],[62,63],[63,64],[64,65],[65,66],[66,67],[67,60],
];

export default function LandmarkOverlay({ landmarks, width, height }: Props) {
  if (!landmarks || landmarks.length < 68) return null;

  return (
    <svg
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 5 }}
      width={width}
      height={height}
    >
      {/* Connection lines */}
      {CONNECTIONS.map(([a, b], i) => (
        <line
          key={`l-${i}`}
          x1={landmarks[a].x} y1={landmarks[a].y}
          x2={landmarks[b].x} y2={landmarks[b].y}
          stroke="rgba(6,182,212,0.5)"
          strokeWidth={1}
        />
      ))}
      {/* Landmark dots */}
      {landmarks.map((pt, i) => (
        <circle
          key={`p-${i}`}
          cx={pt.x} cy={pt.y} r={2}
          fill="var(--accent-cyan)"
          opacity={0.8}
        />
      ))}
    </svg>
  );
}
