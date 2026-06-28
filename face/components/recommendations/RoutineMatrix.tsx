"use client";

interface Props { steps: string[]; }

export default function RoutineMatrix({ steps }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {steps.map((step, i) => (
        <div key={step} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            minWidth: 28, height: 28, borderRadius: "50%",
            background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "var(--accent-cyan)",
          }}>{i + 1}</div>
          {i < steps.length - 1 && (
            <div style={{ position: "absolute", left: 14, width: 1, height: 8, background: "rgba(6,182,212,0.2)", marginTop: 28 }} />
          )}
          <span style={{ fontSize: 13, color: "var(--text-subtle)" }}>{step}</span>
        </div>
      ))}
    </div>
  );
}
