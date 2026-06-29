"use client";
import { HemifaceDelta } from "@/lib/scoring/symmetry";
import GlassCard from "@/components/ui/GlassCard";
import NeonBadge from "@/components/ui/NeonBadge";

interface Props { delta: HemifaceDelta; }

export default function ProportionCard({ delta }: Props) {
  return (
    <GlassCard glow="green">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Proportion & Symmetry</h3>
        <NeonBadge label={`${delta.symmetryScore.toFixed(1)} / 10`} color="green" />
      </div>

      {/* Hemi-face visual */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, textAlign: "center", padding: "16px", background: "rgba(16,185,129,0.06)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.1)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-green)" }}>{delta.leftScore.toFixed(1)}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Left Side</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", color: "var(--text-muted)", fontSize: 20 }}>⇆</div>
        <div style={{ flex: 1, textAlign: "center", padding: "16px", background: "rgba(16,185,129,0.06)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.1)" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-green)" }}>{delta.rightScore.toFixed(1)}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Right Side</div>
        </div>
      </div>

      {/* Delta table */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {delta.deltaMap.slice(0, 6).map((d) => (
          <div key={d.feature} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.feature}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 60, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden",
              }}>
                <div style={{
                  width: `${Math.min(100, d.percentDiff * 3)}%`, height: "100%",
                  background: d.percentDiff < 5 ? "var(--accent-green)" : d.percentDiff < 15 ? "var(--accent-cyan)" : "var(--accent-violet)",
                }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--text-subtle)", width: 40, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                {d.percentDiff.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
