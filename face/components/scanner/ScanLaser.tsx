"use client";

interface Props {
  active: boolean;
}

export default function ScanLaser({ active }: Props) {
  if (!active) return null;
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, pointerEvents: "none",
      zIndex: 10,
    }} className="scan-laser">
      {/* Main beam */}
      <div style={{
        height: 2,
        background: "linear-gradient(90deg, transparent, var(--accent-cyan), var(--accent-green), var(--accent-cyan), transparent)",
        boxShadow: "0 0 8px var(--accent-cyan), 0 0 24px rgba(6,182,212,0.4)",
      }} />
      {/* Glow trail */}
      <div style={{
        height: 40, marginTop: -20,
        background: "linear-gradient(180deg, transparent, rgba(6,182,212,0.06), transparent)",
      }} />
    </div>
  );
}
