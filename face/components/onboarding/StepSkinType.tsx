"use client";
import { useTelemetry, SkinType } from "@/lib/context/TelemetryContext";

const TYPES: { value: SkinType; label: string; traits: string[]; color: string }[] = [
  {
    value: "oily",
    label: "Oily",
    traits: ["Enlarged pores", "Shine by midday", "Prone to blackheads"],
    color: "var(--accent-green)",
  },
  {
    value: "dry",
    label: "Dry",
    traits: ["Tight after cleansing", "Flaking", "Dull complexion"],
    color: "var(--accent-violet)",
  },
  {
    value: "combination",
    label: "Combination",
    traits: ["Oily T-zone", "Dry cheeks", "Variable pore size"],
    color: "var(--accent-cyan)",
  },
  {
    value: "sensitive",
    label: "Sensitive",
    traits: ["Redness easily triggered", "Reactive to products", "Burning/stinging"],
    color: "#F59E0B",
  },
];

export default function StepSkinType() {
  const { state, dispatch } = useTelemetry();

  return (
    <div className="fade-in-up">
      <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 20, letterSpacing: "0.06em" }}>
        SKIN TYPE
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {TYPES.map((t) => {
          const isSelected = state.skinType === t.value;
          return (
            <button
              key={t.value}
              onClick={() => dispatch({ type: "SET_SKIN_TYPE", payload: t.value })}
              style={{
                padding: "16px", borderRadius: 12, textAlign: "left",
                border: `1px solid ${isSelected ? t.color : "rgba(255,255,255,0.08)"}`,
                background: isSelected ? `${t.color}18` : "rgba(255,255,255,0.02)",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: isSelected ? t.color : "rgba(255,255,255,0.2)" }} />
                <span style={{ fontWeight: 600, color: isSelected ? "var(--text-primary)" : "var(--text-subtle)", fontSize: 14 }}>
                  {t.label}
                </span>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {t.traits.map((trait) => (
                  <li key={trait} style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                    · {trait}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
