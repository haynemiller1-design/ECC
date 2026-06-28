"use client";
import { useEffect, useState } from "react";

interface Props {
  score: number; // 0-10
  size?: number;
}

export default function ScoreRing({ score, size = 180 }: Props) {
  const [displayed, setDisplayed] = useState(0);
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score / 10;
  const dashOffset = circumference * (1 - pct);

  useEffect(() => {
    const duration = 1500;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(score * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  const scoreColor = score >= 8 ? "var(--accent-green)" : score >= 6 ? "var(--accent-cyan)" : score >= 4 ? "var(--accent-violet)" : "#F43F5E";

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        {/* Background ring */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        {/* Score ring */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 8px ${scoreColor})`, transition: "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: size * 0.22, fontWeight: 800, color: scoreColor, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {displayed.toFixed(1)}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.1em" }}>/ 10.0</div>
      </div>
    </div>
  );
}
