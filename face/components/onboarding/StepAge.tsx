"use client";
import { useTelemetry } from "@/lib/context/TelemetryContext";

export default function StepAge() {
  const { state, dispatch } = useTelemetry();

  return (
    <div className="fade-in-up">
      <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 16, letterSpacing: "0.06em" }}>
        YOUR AGE
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <input
          type="number"
          min={13}
          max={99}
          value={state.age ?? ""}
          onChange={(e) => { const v = parseInt(e.target.value); if (Number.isFinite(v) && v >= 13 && v <= 120) dispatch({ type: "SET_AGE", payload: v }); }}
          placeholder="e.g. 24"
          style={{
            flex: 1, padding: "16px 20px", borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-primary)", fontSize: 24, fontWeight: 700,
            outline: "none", textAlign: "center",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent-cyan)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        <span style={{ fontSize: 16, color: "var(--text-muted)" }}>yrs</span>
      </div>

      {/* Quick-pick buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {[18, 22, 25, 30, 35, 40, 50].map((age) => (
          <button
            key={age}
            onClick={() => dispatch({ type: "SET_AGE", payload: age })}
            style={{
              padding: "8px 16px", borderRadius: 8,
              border: `1px solid ${state.age === age ? "var(--accent-violet)" : "rgba(255,255,255,0.08)"}`,
              background: state.age === age ? "rgba(139,92,246,0.2)" : "transparent",
              color: state.age === age ? "var(--accent-violet)" : "var(--text-muted)",
              cursor: "pointer", fontSize: 13,
            }}
          >
            {age}
          </button>
        ))}
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Age calibrates facial volume expectations and structural norms. Scoring scales differ across developmental stages.
      </p>
    </div>
  );
}
