"use client";
import { useState } from "react";
import { useTelemetry } from "@/lib/context/TelemetryContext";

export default function StepAge() {
  const { state, dispatch } = useTelemetry();

  // Local string state so the field can be freely typed and cleared.
  // Only valid numbers are committed to the telemetry context.
  const [raw, setRaw] = useState<string>(state.age != null ? String(state.age) : "");

  function handleChange(value: string) {
    // Allow only digits, max 3 chars — lets the user clear and retype freely.
    const digits = value.replace(/[^0-9]/g, "").slice(0, 3);
    setRaw(digits);
    const n = parseInt(digits, 10);
    if (Number.isFinite(n) && n >= 13 && n <= 120) {
      dispatch({ type: "SET_AGE", payload: n });
    } else {
      dispatch({ type: "SET_AGE", payload: null });
    }
  }

  return (
    <div className="fade-in-up">
      <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 16, letterSpacing: "0.06em" }}>
        YOUR AGE
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={raw}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="e.g. 24"
          autoFocus
          style={{
            flex: 1, minWidth: 0, padding: "16px 20px", borderRadius: 12,
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

      {raw !== "" && (parseInt(raw, 10) < 13 || parseInt(raw, 10) > 120) && (
        <p style={{ marginTop: 12, fontSize: 12, color: "var(--accent-rose)" }}>
          Please enter an age between 13 and 120.
        </p>
      )}

      <p style={{ marginTop: 20, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Age calibrates facial volume expectations and structural norms. Scoring scales differ across developmental stages.
      </p>
    </div>
  );
}
