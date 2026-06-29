"use client";
import { useState, useEffect } from "react";
import { useTelemetry, UnitSystem } from "@/lib/context/TelemetryContext";

// Conversion helpers
const lbsToKg = (lbs: number) => Math.round(lbs * 0.453592 * 10) / 10;
const kgToLbs = (kg: number) => Math.round(kg / 0.453592);
const ftInToCm = (ft: number, inches: number) => Math.round((ft * 30.48) + (inches * 2.54));
// Convert cm to feet+inches, carrying 12″ up to the next foot so we never
// display a nonsensical value like 5′ 12″.
function cmToFtIn(cm: number): { ft: number; inch: number } {
  let totalIn = Math.round(cm / 2.54);
  const ft = Math.floor(totalIn / 12);
  const inch = totalIn - ft * 12;
  return { ft, inch };
}
const cmToFt = (cm: number) => cmToFtIn(cm).ft;
const cmToInRemainder = (cm: number) => cmToFtIn(cm).inch;

const inputStyle: React.CSSProperties = {
  flex: 1, padding: "14px 12px", borderRadius: 12,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "var(--text-primary)", fontSize: 20, fontWeight: 600,
  outline: "none", textAlign: "center", width: "100%",
};

// Keep only digits (height/weight are whole-number inputs in the UI).
const digitsOnly = (s: string, maxLen: number) => s.replace(/[^0-9]/g, "").slice(0, maxLen);

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
            padding: "8px 20px", border: "none", fontSize: 13, fontWeight: 600,
            background: value === u
              ? "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))"
              : "transparent",
            color: value === u ? "white" : "var(--text-muted)",
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

  // ── Local string state for every typed field ──
  // Decoupling the text from the committed number is what makes typing smooth:
  // the user can clear the field, type partial values, etc., without the input
  // snapping back to a default. Valid numbers are committed to context onChange.
  const [cmStr, setCmStr] = useState(state.heightCm ? String(state.heightCm) : "");
  const [kgStr, setKgStr] = useState(state.weightKg ? String(state.weightKg) : "");
  const [feetStr, setFeetStr] = useState(state.heightCm ? String(cmToFt(state.heightCm)) : "");
  const [inchStr, setInchStr] = useState(state.heightCm ? String(cmToInRemainder(state.heightCm)) : "");
  const [lbsStr, setLbsStr] = useState(state.weightKg ? String(kgToLbs(state.weightKg)) : "");

  // When the unit system flips, refill the newly-shown fields from stored metric values.
  useEffect(() => {
    if (unit === "imperial") {
      if (state.heightCm) { setFeetStr(String(cmToFt(state.heightCm))); setInchStr(String(cmToInRemainder(state.heightCm))); }
      if (state.weightKg) setLbsStr(String(kgToLbs(state.weightKg)));
    } else {
      if (state.heightCm) setCmStr(String(state.heightCm));
      if (state.weightKg) setKgStr(String(state.weightKg));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit]);

  // ── Metric handlers ──
  function handleCm(v: string) {
    const d = digitsOnly(v, 3);
    setCmStr(d);
    const n = parseInt(d, 10);
    if (Number.isFinite(n) && n > 0) dispatch({ type: "SET_HEIGHT", payload: n });
  }
  function handleKg(v: string) {
    const d = digitsOnly(v, 3);
    setKgStr(d);
    const n = parseInt(d, 10);
    if (Number.isFinite(n) && n > 0) dispatch({ type: "SET_WEIGHT", payload: n });
  }

  // ── Imperial handlers ──
  function commitImperialHeight(f: string, i: string) {
    const ft = parseInt(f, 10);
    const inch = i === "" ? 0 : parseInt(i, 10);
    if (Number.isFinite(ft) && ft > 0) dispatch({ type: "SET_HEIGHT", payload: ftInToCm(ft, Number.isFinite(inch) ? inch : 0) });
  }
  function handleFeet(v: string) { const d = digitsOnly(v, 1); setFeetStr(d); commitImperialHeight(d, inchStr); }
  function handleInch(v: string) { const d = digitsOnly(v, 2); setInchStr(d); commitImperialHeight(feetStr, d); }
  function handleLbs(v: string) {
    const d = digitsOnly(v, 3);
    setLbsStr(d);
    const n = parseInt(d, 10);
    if (Number.isFinite(n) && n > 0) dispatch({ type: "SET_WEIGHT", payload: lbsToKg(n) });
  }

  // ── Slider handlers (commit directly + keep the text field in sync) ──
  function sliderCm(n: number) { setCmStr(String(n)); dispatch({ type: "SET_HEIGHT", payload: n }); }
  function sliderKg(n: number) { setKgStr(String(n)); dispatch({ type: "SET_WEIGHT", payload: n }); }
  function sliderImpHeight(totalIn: number) {
    const f = Math.floor(totalIn / 12), i = totalIn % 12;
    setFeetStr(String(f)); setInchStr(String(i));
    dispatch({ type: "SET_HEIGHT", payload: ftInToCm(f, i) });
  }
  function sliderLbs(n: number) { setLbsStr(String(n)); dispatch({ type: "SET_WEIGHT", payload: lbsToKg(n) }); }

  const focusOn = (e: React.FocusEvent<HTMLInputElement>, c: string) => (e.target.style.borderColor = c);
  const focusOff = (e: React.FocusEvent<HTMLInputElement>) => (e.target.style.borderColor = "rgba(255,255,255,0.1)");

  const sliderHeightVal = state.heightCm ?? 175;
  const sliderWeightVal = state.weightKg ?? 70;
  const impTotalIn = state.heightCm ? Math.round(state.heightCm / 2.54) : 69;

  return (
    <div className="fade-in-up">
      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
        Height and weight refine facial volume predictions and contextualize structural proportions.
      </p>

      <UnitToggle value={unit} onChange={(v) => dispatch({ type: "SET_UNIT_SYSTEM", payload: v })} />

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
                  type="text" inputMode="numeric" pattern="[0-9]*"
                  value={cmStr}
                  onChange={(e) => handleCm(e.target.value)}
                  placeholder="175"
                  style={inputStyle}
                  onFocus={(e) => focusOn(e, "var(--accent-cyan)")}
                  onBlur={focusOff}
                />
                <span style={{ color: "var(--text-muted)", fontSize: 15, minWidth: 24 }}>cm</span>
              </div>
              <input
                type="range" min={140} max={220} step={1}
                value={sliderHeightVal}
                onChange={(e) => sliderCm(parseInt(e.target.value, 10))}
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
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    value={feetStr}
                    onChange={(e) => handleFeet(e.target.value)}
                    placeholder="5"
                    style={inputStyle}
                    onFocus={(e) => focusOn(e, "var(--accent-cyan)")}
                    onBlur={focusOff}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>feet</span>
                </div>
                <span style={{ fontSize: 22, color: "var(--text-muted)", paddingBottom: 20 }}>′</span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    value={inchStr}
                    onChange={(e) => handleInch(e.target.value)}
                    placeholder="9"
                    style={inputStyle}
                    onFocus={(e) => focusOn(e, "var(--accent-cyan)")}
                    onBlur={focusOff}
                  />
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>inches</span>
                </div>
                <span style={{ fontSize: 22, color: "var(--text-muted)", paddingBottom: 20 }}>″</span>
              </div>
              <input
                type="range" min={54} max={96} step={1}
                value={impTotalIn}
                onChange={(e) => sliderImpHeight(parseInt(e.target.value, 10))}
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
                  type="text" inputMode="numeric" pattern="[0-9]*"
                  value={kgStr}
                  onChange={(e) => handleKg(e.target.value)}
                  placeholder="70"
                  style={inputStyle}
                  onFocus={(e) => focusOn(e, "var(--accent-violet)")}
                  onBlur={focusOff}
                />
                <span style={{ color: "var(--text-muted)", fontSize: 15, minWidth: 24 }}>kg</span>
              </div>
              <input
                type="range" min={40} max={200} step={1}
                value={sliderWeightVal}
                onChange={(e) => sliderKg(parseInt(e.target.value, 10))}
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
                  type="text" inputMode="numeric" pattern="[0-9]*"
                  value={lbsStr}
                  onChange={(e) => handleLbs(e.target.value)}
                  placeholder="154"
                  style={inputStyle}
                  onFocus={(e) => focusOn(e, "var(--accent-violet)")}
                  onBlur={focusOff}
                />
                <span style={{ color: "var(--text-muted)", fontSize: 15, minWidth: 28 }}>lbs</span>
              </div>
              <input
                type="range" min={88} max={440} step={1}
                value={state.weightKg ? kgToLbs(state.weightKg) : 154}
                onChange={(e) => sliderLbs(parseInt(e.target.value, 10))}
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
