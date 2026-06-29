"use client";
import { SkinAnalysis } from "@/lib/scoring/skinAnalysis";
import { ACNE_TYPES } from "@/lib/clinical/acne";
import GlassCard from "@/components/ui/GlassCard";
import NeonBadge from "@/components/ui/NeonBadge";

const EVIDENCE: Record<"A" | "B" | "C", { label: string; color: "green" | "cyan" | "violet" }> = {
  A: { label: "Strong evidence", color: "green" },
  B: { label: "Moderate evidence", color: "cyan" },
  C: { label: "Expert advice", color: "violet" },
};

export default function AcneAnalysis({ skin }: { skin: SkinAnalysis }) {
  return (
    <GlassCard glow="cyan">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Acne</h3>
        <NeonBadge label={skin.severity === "clear" ? "Clear" : `${skin.severity[0].toUpperCase()}${skin.severity.slice(1)}`} color="cyan" />
      </div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: skin.types.length ? 18 : 0 }}>
        {skin.note}
      </p>

      {skin.types.map(({ type, confidence }) => {
        const info = ACNE_TYPES[type];
        return (
          <div key={type} style={{
            marginTop: 14, padding: 14, borderRadius: 12,
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{info.name}</div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {Math.round(confidence * 100)}% match
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 12 }}>{info.looksLike}</p>

            {info.seeDerm && (
              <div style={{ padding: "8px 12px", borderRadius: 8, marginBottom: 12, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
                <p style={{ fontSize: 12, color: "var(--accent-rose)", lineHeight: 1.5 }}>⚠ This type usually needs a dermatologist to prevent scarring.</p>
              </div>
            )}

            <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
              Best ways to treat it
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {info.treatments.map((t) => (
                <div key={t.name} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-subtle)" }}>{t.name}</span>
                    <NeonBadge label={EVIDENCE[t.evidence].label} color={EVIDENCE[t.evidence].color} />
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.55 }}>{t.detail}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 16, padding: "8px 12px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 8 }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
          This is an estimate from your photo based on the visual features each acne type shows — not a medical diagnosis.
          Lighting, makeup, and camera quality affect it. For painful, scarring, or persistent acne, see a dermatologist.
        </p>
      </div>
    </GlassCard>
  );
}
