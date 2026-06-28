"use client";
import { useTelemetry } from "@/lib/context/TelemetryContext";

export default function StepMeasurements() {
  const { state, dispatch } = useTelemetry();

  return (
    <div className="fade-in-up">
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.6 }}>
        Height and weight refine facial volume predictions and contextualize structural proportions.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Height */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.06em" }}>
            HEIGHT (cm)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="number" min={100} max={250}
              value={state.heightCm ?? ""}
              onChange={(e) => dispatch({ type: "SET_HEIGHT", payload: parseInt(e.target.value) || 0 })}
              placeholder="175"
              style={{
                flex: 1, padding: "14px 20px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-primary)", fontSize: 20, fontWeight: 600,
                outline: "none", textAlign: "center",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent-cyan)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>cm</span>
          </div>
          {/* Slider */}
          <input
            type="range" min={140} max={220} step={1}
            value={state.heightCm ?? 170}
            onChange={(e) => dispatch({ type: "SET_HEIGHT", payload: parseInt(e.target.value) })}
            style={{ width: "100%", marginTop: 12, accentColor: "var(--accent-cyan)" }}
          />
        </div>

        {/* Weight */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.06em" }}>
            WEIGHT (kg)
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="number" min={30} max={300}
              value={state.weightKg ?? ""}
              onChange={(e) => dispatch({ type: "SET_WEIGHT", payload: parseInt(e.target.value) || 0 })}
              placeholder="70"
              style={{
                flex: 1, padding: "14px 20px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-primary)", fontSize: 20, fontWeight: 600,
                outline: "none", textAlign: "center",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent-violet)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>kg</span>
          </div>
          <input
            type="range" min={40} max={200} step={1}
            value={state.weightKg ?? 70}
            onChange={(e) => dispatch({ type: "SET_WEIGHT", payload: parseInt(e.target.value) })}
            style={{ width: "100%", marginTop: 12, accentColor: "var(--accent-violet)" }}
          />
        </div>
      </div>
    </div>
  );
}
