interface Props {
  label: string;
  color?: "violet" | "cyan" | "green" | "rose";
}

const colorMap = {
  violet: { bg: "rgba(139,92,246,0.15)", border: "rgba(139,92,246,0.4)", text: "#A78BFA" },
  cyan:   { bg: "rgba(6,182,212,0.15)", border: "rgba(6,182,212,0.4)", text: "#22D3EE" },
  green:  { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#34D399" },
  rose:   { bg: "rgba(244,63,94,0.15)", border: "rgba(244,63,94,0.4)", text: "#FB7185" },
};

export default function NeonBadge({ label, color = "cyan" }: Props) {
  const c = colorMap[color];
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      border: `1px solid ${c.border}`,
      background: c.bg,
      color: c.text,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}>
      {label}
    </span>
  );
}
