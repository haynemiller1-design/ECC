"use client";
import { RatioResult } from "@/lib/scoring/goldenRatio";
import ProgressBar from "@/components/ui/ProgressBar";
import NeonBadge from "@/components/ui/NeonBadge";

interface Props { ratios: RatioResult[]; }

function gradeColor(score: number): "green" | "cyan" | "violet" {
  if (score >= 7.5) return "green";
  if (score >= 5) return "cyan";
  return "violet";
}

export default function RatioBreakdown({ ratios }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {ratios.map((r) => (
        <div key={r.name}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-subtle)" }}>{r.name}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                {r.actual.toFixed(3)} / {r.ideal.toFixed(3)}
              </span>
              <NeonBadge label={`${r.score.toFixed(1)}`} color={gradeColor(r.score)} />
            </div>
          </div>
          <ProgressBar value={r.score * 10} color={gradeColor(r.score)} showValue={false} />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            {(r.deviation * 100).toFixed(1)}% deviation from ideal ratio
          </p>
        </div>
      ))}
    </div>
  );
}
