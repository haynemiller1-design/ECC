"use client";
import { createContext, useContext, useReducer, ReactNode } from "react";

export type BiologicalSex = "male" | "female" | null;
export type SkinType = "oily" | "dry" | "combination" | "sensitive" | null;
export type UnitSystem = "metric" | "imperial";

export interface TelemetryState {
  age: number | null;
  sex: BiologicalSex;
  heightCm: number | null;  // always stored in cm regardless of unit system
  weightKg: number | null;  // always stored in kg regardless of unit system
  skinType: SkinType;
  unitSystem: UnitSystem;
  step: number;
}

type Action =
  | { type: "SET_AGE"; payload: number }
  | { type: "SET_SEX"; payload: BiologicalSex }
  | { type: "SET_HEIGHT"; payload: number }
  | { type: "SET_WEIGHT"; payload: number }
  | { type: "SET_SKIN_TYPE"; payload: SkinType }
  | { type: "SET_UNIT_SYSTEM"; payload: UnitSystem }
  | { type: "SET_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" };

const initial: TelemetryState = {
  age: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  skinType: null,
  unitSystem: "metric",
  step: 0,
};

// Clamp a value to [min, max] and reject NaN
function clamp(v: number, min: number, max: number): number | null {
  if (!Number.isFinite(v)) return null;
  return Math.max(min, Math.min(max, Math.round(v * 10) / 10));
}

const VALID_SEX = new Set<string>(["male", "female"]);
const VALID_SKIN = new Set<string>(["oily", "dry", "combination", "sensitive"]);
const VALID_UNIT = new Set<string>(["metric", "imperial"]);

function reducer(state: TelemetryState, action: Action): TelemetryState {
  switch (action.type) {
    case "SET_AGE": {
      const age = clamp(action.payload, 13, 120);
      return age !== null ? { ...state, age } : state;
    }
    case "SET_SEX":
      return action.payload && VALID_SEX.has(action.payload)
        ? { ...state, sex: action.payload }
        : state;
    case "SET_HEIGHT": {
      const h = clamp(action.payload, 50, 280); // cm bounds: ~20in to ~9ft
      return h !== null ? { ...state, heightCm: h } : state;
    }
    case "SET_WEIGHT": {
      const w = clamp(action.payload, 15, 500); // kg bounds: ~33lbs to ~1100lbs
      return w !== null ? { ...state, weightKg: w } : state;
    }
    case "SET_SKIN_TYPE":
      return action.payload && VALID_SKIN.has(action.payload)
        ? { ...state, skinType: action.payload }
        : state;
    case "SET_UNIT_SYSTEM":
      return action.payload && VALID_UNIT.has(action.payload)
        ? { ...state, unitSystem: action.payload }
        : state;
    case "SET_STEP": {
      const s = clamp(action.payload, 0, 10);
      return s !== null ? { ...state, step: s } : state;
    }
    case "NEXT_STEP": return { ...state, step: state.step + 1 };
    case "PREV_STEP": return { ...state, step: Math.max(0, state.step - 1) };
    default: return state;
  }
}

const TelemetryContext = createContext<{
  state: TelemetryState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <TelemetryContext.Provider value={{ state, dispatch }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const ctx = useContext(TelemetryContext);
  if (!ctx) throw new Error("useTelemetry must be used within TelemetryProvider");
  return ctx;
}
