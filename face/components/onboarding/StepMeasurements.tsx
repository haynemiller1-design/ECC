"use client";
import { useState, useEffect } from "react";
import { useTelemetry, UnitSystem } from "@/lib/context/TelemetryContext";

// Conversion helpers
const lbsToKg = (lbs: number) => Math.round(lbs * 0.453592 * 10) / 10;
const kgToLbs = (kg: number) => Math.round(kg / 0.453592);
const ftInToCm = (ft: number, inches: number) => Math.round((ft * 30.48) + (inches * 2.54));
const cmToFt = (cm: number) => Math.floor(cm / 30.48);
const cmToInRemainder = (cm: number) => Math.round((cm % 30.48) / 2.54);

function inputStyle(accentColor: string) {
  return {
    flex: 1, padding: "14px 12px", borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--text-primary)", fontSize: 20, fontWeight: 600,
    outline: "none", textAlign: "center" as const, width: "100%",
    // store accent in data attr for focus handlers
    "--focus-color": accentColor,
  } as React.CSSProperties;
}

function UnitToggle({ value, onChange }: { value: UnitSystem; onChange: (v: UnitSystem) => void }) {
  return (
    <div style={{
      display: "inline-flex", borderRadius: 10, overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.1)", marginBottom: 24,
    }}>
      {(["metric", "imperial"] as UnitSystem[]).map((u) => (
        <button
          key={u}
          onClick={() => onChange(u)}
          style={{
            padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: value === u
              ? "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))"
              : "transparent",
            color: value === u ? "white" : "var(--text-muted)",
            transition: "all 0.2s",
          }}
        >
          {u === "metric" ? "Metric (cm / kg)" : "Imperial (ft·in / lbs)"}
        </button>
      ))}
    </div>
  );
}

export default function StepMeasurements() {
  const { state, dispatch } = useTelemetry();
  const unit = state.unitSystem;

  // Local display state for imperial inputs (derived from stored metric values)
  const [feet, setFeet] = useState<number>(state.heightCm ? cmToFt(state.heightCm) : 5);
  const [inches, setInches] = useState<number>(state.heightCm ? cmToInRemainder(state.heightCm) : 9);
  const [lbs, setLbs] = useState<number>(state.weightKg ? kgToLbs(state.weightKg) : 154);

  // Keep display fields in sync if unit flips
  useEffect(() => {
    if (unit === "imperial" && state.heightCm) {
      setFeet(cmToFt(state.heightCm));
      setInches(cmToInRemainder(state.heightCm));
    }
    if (unit === "imperial" && state.weightKg) {
      setLbs(kgToLbs(state.weightKg));
    }
  }, [unit, state.heightCm, state.weightKg]);

  function handleUnitChange(v: UnitSystem) {
    dispatch({ type: "SET_UNIT_SYSTEM", payload: v });
  }

  // Imperial height: commit to context whenever feet or inches changes
  function handleFeetChange(v: number) {
    const clamped = Math.max(3, Math.min(8, v || 0));
    setFeet(clamped);
    dispatch({ type: "SET_HEIGHT", payload: ftInToCm(clamped, inches) });
  }
  function handleInchesChange(v: number) {
    const clamped = Math.max(0, Math.min(11, v || 0));
    setInches(clamped);
    dispatch({ type: "SET_HEIGHT", payload: ftInToCm(feet, clamped) });
  }

  // Imperial weight
  function handleLbsChange(v: number) {
    const clamped = Math.max(66, Math.min(440, v || 0));
    setLbs(clamped);
    dispatch({ type: "SET_WEIGHT", payload: lbsToKg(clamped) });
  }

  const displayHeightCm = state.heightCm ?? 175;
  const displayWeightKg = state.weightKg ?? 70;

  return (
    <div className="fade-in-up">
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
        Height and weight refine facial volume predictions and contextualize structural proportions.
      </p>

      <UnitToggle value={unit} onChange={handleUnitChange} />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── HEIGHT ── */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.06em" }}>
            HEIGHT
          </label>

          {unit === "metric" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="number" min={100} max={250}
                  value={displayHeightCm || ""}
                  onChange={(e) => dispatch({ type: "SET_HEIGHT", payload: parseInt(e.target.value) || 0 })}
                  placeholder="175"
                  style={inputStyle("var(--accent-cyan)")}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent-cyan)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <span style={{ color: "var(--text-muted)", fontSize: 15, minWidth: 24 }}>cm</span>
              </div>
              <input
                type="range" min={140} max={220} step={1}
                value={displayHeightCm}
                onChange={(e) => { const v = parseInt(e.target.value); if (Number.isFinite(v)) dispatch({ type: "SET_HEIGHT", payload: v }); }}
                style={{ width: "100%", marginTop: 12, accentColor: "var(--accent-cyan)" }}
              />
              {state.heightCm && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                  ≈ {cmToFt(state.heightCm)}′ {cmToInRemainder(state.heightCm)}″
                </p>
              )}
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Feet */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <input
                    type="number" min={3} max={8}
                    value={feet || ""}
                    onChange={(e) => handleFeetChange(parseInt(e.target.value))}
                    placeholder="5"
                    style={inputStyle("var(--accent-cyan)")}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent-cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>feet</span>
                </div>
                <span style={{ fontSize: 22, color: "var(--text-muted)", paddingBottom: 20 }}>′</span>
                {/* Inches */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <input
                    type="number" min={0} max={11}
                    value={inches === 0 ? "0" : (inches || "")}
                    onChange={(e) => handleInchesChange(parseInt(e.target.value))}
                    placeholder="9"
                    style={inputStyle("var(--accent-cyan)")}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent-cyan)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>inches</span>
                </div>
                <span style={{ fontSize: 22, color: "var(--text-muted)", paddingBottom: 20 }}>″</span>
              </div>
              <input
                type="range" min={54} max={96} step={1}
                value={feet * 12 + inches}
                onChange={(e) => {
                  const totalIn = parseInt(e.target.value);
                  const f = Math.floor(totalIn / 12);
                  const i = totalIn % 12;
                  setFeet(f); setInches(i);
                  dispatch({ type: "SET_HEIGHT", payload: ftInToCm(f, i) });
                }}
                style={{ width: "100%", marginTop: 12, accentColor: "var(--accent-cyan)" }}
              />
              {state.heightCm && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                  ≈ {state.heightCm} cm
                </p>
              )}
            </>
          )}
        </div>

        {/* ── WEIGHT ── */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 10, letterSpacing: "0.06em" }}>
            WEIGHT
          </label>

          {unit === "metric" ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="number" min={30} max={300}
                  value={displayWeightKg || ""}
                  onChange={(e) => dispatch({ type: "SET_WEIGHT", payload: parseFloat(e.target.value) || 0 })}
                  placeholder="70"
                  style={inputStyle("var(--accent-violet)")}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent-violet)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <span style={{ color: "var(--text-muted)", fontSize: 15, minWidth: 24 }}>kg</span>
              </div>
              <input
                type="range" min={40} max={200} step={1}
                value={displayWeightKg}
                onChange={(e) => { const v = parseInt(e.target.value); if (Number.isFinite(v)) dispatch({ type: "SET_WEIGHT", payload: v }); }}
                style={{ width: "100%", marginTop: 12, accentColor: "var(--accent-violet)" }}
              />
              {state.weightKg && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                  ≈ {kgToLbs(state.weightKg)} lbs
                </p>
              )}
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="number" min={66} max={440}
                  value={lbs || ""}
                  onChange={(e) => handleLbsChange(parseInt(e.target.value))}
                  placeholder="154"
                  style={inputStyle("var(--accent-violet)")}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent-violet)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <span style={{ color: "var(--text-muted)", fontSize: 15, minWidth: 28 }}>lbs</span>
              </div>
              <input
                type="range" min={88} max={440} step={1}
                value={lbs}
                onChange={(e) => handleLbsChange(parseInt(e.target.value))}
                style={{ width: "100%", marginTop: 12, accentColor: "var(--accent-violet)" }}
              />
              {state.weightKg && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                  ≈ {state.weightKg} kg
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
