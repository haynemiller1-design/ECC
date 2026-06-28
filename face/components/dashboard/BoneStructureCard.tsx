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
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Bone Structure</h3>
        <NeonBadge label={`${metrics.aggregateBoneScore.toFixed(1)} / 10`} color="violet" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <ProgressBar value={metrics.bizygomaticScore * 10} color="violet" label="Bizygomatic Ratio" />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Cheekbone-to-cheekbone width vs face height</p>
        </div>
        <div>
          <ProgressBar value={metrics.gonialScore * 10} color="cyan" label="Gonial Angle" />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Jaw angle sharpness vs dimorphic norm</p>
        </div>
        <div>
          <ProgressBar value={metrics.jawlineScore * 10} color="green" label="Chin Projection" />
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Chin prominence relative to face height</p>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
        {metrics.dimorphismNote}
      </p>
    </GlassCard>
  );
}
