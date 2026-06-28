"use client";
import { useScan } from "@/lib/context/ScanContext";

export default function DimorphismToggle() {
  const { state, dispatch } = useScan();
  const isMale = state.dimorphismMode === "male";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 40, padding: "6px 8px",
    }}>
      <button
        onClick={() => dispatch({ type: "SET_DIMORPHISM", payload: "male" })}
        style={{
          padding: "6px 16px", borderRadius: 32, border: "none", cursor: "pointer",
          background: isMale ? "linear-gradient(135deg, #8B5CF6, #6D28D9)" : "transparent",
          color: isMale ? "white" : "var(--text-muted)", fontSize: 13, fontWeight: 600,
          transition: "all 0.25s",
        }}
      >
        ♂ Male
      </button>
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
      <button
        onClick={() => dispatch({ type: "SET_DIMORPHISM", payload: "female" })}
        style={{
          padding: "6px 16px", borderRadius: 32, border: "none", cursor: "pointer",
          background: !isMale ? "linear-gradient(135deg, #F43F5E, #BE185D)" : "transparent",
          color: !isMale ? "white" : "var(--text-muted)", fontSize: 13, fontWeight: 600,
          transition: "all 0.25s",
        }}
      >
        ♀ Female
      </button>
    </div>
  );
}
