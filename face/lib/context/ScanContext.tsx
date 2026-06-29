"use client";
import { createContext, useContext, useReducer, useEffect, useState, ReactNode } from "react";

const SESSION_KEY = "visageiq_scan";

export interface Landmark {
  x: number;
  y: number;
}

export type CaptureAngle = "front" | "left" | "right";

export interface AngleCapture {
  angle: CaptureAngle;
  imageDataUrl: string;
  landmarks: Landmark[] | null;
}

export interface ScanResult {
  // Primary front-facing capture — drives all scoring on the results page.
  landmarks: Landmark[] | null;
  imageDataUrl: string | null;
  capturedAt: number | null;
  dimorphismMode: "male" | "female";
  // Full multi-angle capture set (front / left / right) for the in-depth scan.
  captures: AngleCapture[];
}

type Action =
  | { type: "SET_IMAGE"; payload: string }
  | { type: "SET_LANDMARKS"; payload: Landmark[] }
  | { type: "ADD_CAPTURE"; payload: AngleCapture }
  | { type: "SET_DIMORPHISM"; payload: "male" | "female" }
  | { type: "HYDRATE"; payload: ScanResult }
  | { type: "RESET" };

const initial: ScanResult = {
  landmarks: null,
  imageDataUrl: null,
  capturedAt: null,
  dimorphismMode: "male",
  captures: [],
};

function reducer(state: ScanResult, action: Action): ScanResult {
  switch (action.type) {
    case "SET_IMAGE": return { ...state, imageDataUrl: action.payload, capturedAt: Date.now() };
    case "SET_LANDMARKS": return { ...state, landmarks: action.payload };
    case "ADD_CAPTURE": {
      // Replace any existing capture for the same angle, then append.
      const others = state.captures.filter(c => c.angle !== action.payload.angle);
      const captures = [...others, action.payload];
      // Mirror the front capture into the primary scoring fields.
      if (action.payload.angle === "front") {
        return {
          ...state,
          captures,
          imageDataUrl: action.payload.imageDataUrl,
          landmarks: action.payload.landmarks,
          capturedAt: Date.now(),
        };
      }
      return { ...state, captures };
    }
    case "SET_DIMORPHISM": return { ...state, dimorphismMode: action.payload };
    case "HYDRATE": return { ...initial, ...action.payload };
    case "RESET": return { ...initial };
    default: return state;
  }
}

const ScanContext = createContext<{
  state: ScanResult;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
} | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  // Start from `initial` to match SSR, then restore from storage after mount so
  // an accidental refresh on /results doesn't bounce the user back to /scan.
  const [state, dispatch] = useReducer(reducer, initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) dispatch({ type: "HYDRATE", payload: JSON.parse(raw) as ScanResult });
    } catch { /* corrupt or blocked storage */ }
    // Intentional: flag hydration in the same effect as the HYDRATE dispatch so
    // they batch — consumers never observe hydrated=true with stale state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); }
    catch { /* quota exceeded (large captures) or storage blocked — non-fatal */ }
  }, [state, hydrated]);

  return (
    <ScanContext.Provider value={{ state, dispatch, hydrated }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error("useScan must be used within ScanProvider");
  return ctx;
}
