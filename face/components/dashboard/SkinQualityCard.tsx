"use client";
import GlassCard from "@/components/ui/GlassCard";
import NeonBadge from "@/components/ui/NeonBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import { useTelemetry } from "@/lib/context/TelemetryContext";

// Skin quality is heuristic without a dermatology model.
// We use skin type + age to generate a profile.
function deriveSkinProfile(skinType: string | null, age: number | null) {
  const base = { clarity: 7.5, texture: 7, hydration: 7, evenness: 7.5 };
  if (!skinType || !age) return base;
  if (skinType === "oily") { base.clarity -= 1.5; base.texture -= 0.5; }
  if (skinType === "dry") { base.hydration -= 2; base.texture -= 1; }
  if (skinType === "sensitive") { base.evenness -= 1.5; base.clarity -= 0.5; }
  if (age > 40) { base.hydration -= 1; base.evenness -= 1; base.texture -= 1; }
  if (age > 55) { base.clarity -= 0.5; base.hydration -= 0.5; }
  return Object.fromEntries(Object.entries(base).map(([k, v]) => [k, Math.max(1, Math.min(10, v))])) as typeof base;
}

export default function SkinQualityCard() {
  const { state } = useTelemetry();
  const profile = deriveSkinProfile(state.skinType, state.age);
  const aggregate = (profile.clarity + profile.texture + profile.hydration + profile.evenness) / 4;

  return (
    <GlassCard glow="cyan">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Skin Quality</h3>
        <NeonBadge label={`${aggregate.toFixed(1)} / 10`} color="cyan" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ProgressBar value={profile.clarity * 10} color="cyan" label="Clarity & Pore Quality" />
        <ProgressBar value={profile.texture * 10} color="green" label="Texture Smoothness" />
        <ProgressBar value={profile.hydration * 10} color="violet" label="Hydration Level" />
        <ProgressBar value={profile.evenness * 10} color="cyan" label="Tone Evenness" />
      </div>

      <div style={{ marginTop: 16, padding: "12px", background: "rgba(6,182,212,0.06)", borderRadius: 8, border: "1px solid rgba(6,182,212,0.1)" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Profile derived from <strong style={{ color: "var(--text-subtle)" }}>{state.skinType || "unknown"}</strong> skin type
          {state.age ? ` at age ${state.age}` : ""}. Camera-based pixel density analysis available post-scan.
        </p>
      </div>
    </GlassCard>
  );
}
