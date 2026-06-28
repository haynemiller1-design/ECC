"use client";
import { createContext, useContext, useReducer, ReactNode } from "react";

export interface Landmark {
  x: number;
  y: number;
}

export interface ScanResult {
  landmarks: Landmark[] | null;
  imageDataUrl: string | null;
  capturedAt: number | null;
  dimorphismMode: "male" | "female";
}

type Action =
  | { type: "SET_IMAGE"; payload: string }
  | { type: "SET_LANDMARKS"; payload: Landmark[] }
  | { type: "SET_DIMORPHISM"; payload: "male" | "female" }
  | { type: "RESET" };

const initial: ScanResult = {
  landmarks: null,
  imageDataUrl: null,
  capturedAt: null,
  dimorphismMode: "male",
};

function reducer(state: ScanResult, action: Action): ScanResult {
  switch (action.type) {
    case "SET_IMAGE": return { ...state, imageDataUrl: action.payload, capturedAt: Date.now() };
    case "SET_LANDMARKS": return { ...state, landmarks: action.payload };
    case "SET_DIMORPHISM": return { ...state, dimorphismMode: action.payload };
    case "RESET": return { ...initial };
    default: return state;
  }
}

const ScanContext = createContext<{
  state: ScanResult;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <ScanContext.Provider value={{ state, dispatch }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used within ScanProvider");
  return ctx;
}
