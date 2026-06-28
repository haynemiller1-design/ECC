"use client";
import { useTelemetry, BiologicalSex } from "@/lib/context/TelemetryContext";

const OPTIONS: { value: BiologicalSex; label: string; desc: string }[] = [
  {
    value: "male",
    label: "Male",
    desc: "Assess against masculine dimorphic norms: wider bizygomatic, sharper gonial angle (~115°), stronger brow ridge.",
  },
  {
    value: "female",
    label: "Female",
    desc: "Assess against feminine dimorphic norms: narrower bizygomatic, softer gonial angle (~120°), refined chin taper.",
  },
];

export default function StepSex() {
  const { state, dispatch } = useTelemetry();

  return (
    <div className="fade-in-up">
      <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 20, letterSpacing: "0.06em" }}>
        BIOLOGICAL SEX
      </label>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {OPTIONS.map((opt) => {
          const isSelected = state.sex === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => dispatch({ type: "SET_SEX", payload: opt.value })}
              style={{
                padding: "20px", borderRadius: 12, textAlign: "left",
                border: `1px solid ${isSelected ? "var(--accent-violet)" : "rgba(255,255,255,0.08)"}`,
                background: isSelected ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.02)",
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: isSelected ? "0 0 20px rgba(139,92,246,0.15)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${isSelected ? "var(--accent-violet)" : "rgba(255,255,255,0.2)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isSelected && (
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-violet)" }} />
                  )}
                </div>
                <span style={{ fontWeight: 600, fontSize: 16, color: isSelected ? "var(--text-primary)" : "var(--text-subtle)" }}>
                  {opt.label}
                </span>
              </div>
              <p style={{ marginTop: 8, marginLeft: 32, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {opt.desc}
              </p>
            </button>
          );
        })}
      </div>
      <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Structural norms are highly sex-dimorphic. This sets the baseline reference model for all scoring.
        You may toggle this dynamically during scan analysis.
      </p>
    </div>
  );
}
