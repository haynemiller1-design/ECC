interface Props {
  value: number; // 0-100
  color?: "violet" | "cyan" | "green";
  label?: string;
  showValue?: boolean;
}

const colors = {
  violet: "linear-gradient(90deg, #8B5CF6, #6D28D9)",
  cyan:   "linear-gradient(90deg, #06B6D4, #0891B2)",
  green:  "linear-gradient(90deg, #10B981, #059669)",
};

export default function ProgressBar({ value, color = "violet", label, showValue = true }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ width: "100%" }}>
      {(label || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          {label && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{label}</span>}
          {showValue && <span style={{ fontSize: 13, color: "var(--text-subtle)", fontVariantNumeric: "tabular-nums" }}>{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div style={{
        width: "100%",
        height: 6,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 3,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`,
          height: "100%",
          background: colors[color],
          borderRadius: 3,
          transition: "width 1s ease-out",
        }} />
      </div>
    </div>
  );
}
