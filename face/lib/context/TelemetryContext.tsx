"use client";
import { createContext, useContext, useReducer, ReactNode } from "react";

export type BiologicalSex = "male" | "female" | null;
export type SkinType = "oily" | "dry" | "combination" | "sensitive" | null;

export interface TelemetryState {
  age: number | null;
  sex: BiologicalSex;
  heightCm: number | null;
  weightKg: number | null;
  skinType: SkinType;
  step: number;
}

type Action =
  | { type: "SET_AGE"; payload: number }
  | { type: "SET_SEX"; payload: BiologicalSex }
  | { type: "SET_HEIGHT"; payload: number }
  | { type: "SET_WEIGHT"; payload: number }
  | { type: "SET_SKIN_TYPE"; payload: SkinType }
  | { type: "SET_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" };

const initial: TelemetryState = {
  age: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  skinType: null,
  step: 0,
};

function reducer(state: TelemetryState, action: Action): TelemetryState {
  switch (action.type) {
    case "SET_AGE": return { ...state, age: action.payload };
    case "SET_SEX": return { ...state, sex: action.payload };
    case "SET_HEIGHT": return { ...state, heightCm: action.payload };
    case "SET_WEIGHT": return { ...state, weightKg: action.payload };
    case "SET_SKIN_TYPE": return { ...state, skinType: action.payload };
    case "SET_STEP": return { ...state, step: action.payload };
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
