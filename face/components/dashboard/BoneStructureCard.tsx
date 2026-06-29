"use client";
import { BoneMetrics } from "@/lib/scoring/boneMetrics";
import GlassCard from "@/components/ui/GlassCard";
import ProgressBar from "@/components/ui/ProgressBar";
import NeonBadge from "@/components/ui/NeonBadge";

interface Props { metrics: BoneMetrics; }

export default function BoneStructureCard({ metrics }: Props) {
  return (
    <GlassCard glow="violet">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Face Shape &amp; Structure</h3>
        <NeonBadge label={`${metrics.aggregateBoneScore.toFixed(1)} / 10`} color="violet" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <ProgressBar value={metrics.bizygomaticScore * 10} color="violet" label="Cheekbone Width" />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>How wide your cheekbones are vs face length</p>
        </div>
        <div>
          <ProgressBar value={metrics.gonialScore * 10} color="cyan" label="Jaw Angle" />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>How sharp or soft the angle of your jaw is</p>
        </div>
        <div>
          <ProgressBar value={metrics.jawlineScore * 10} color="green" label="Chin &amp; Jaw" />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>How much your chin projects forward</p>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
        {metrics.dimorphismNote}
      </p>
    </GlassCard>
  );
}
