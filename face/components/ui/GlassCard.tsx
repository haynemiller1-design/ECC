import { ReactNode, CSSProperties } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  glow?: "violet" | "cyan" | "green" | "none";
}

export default function GlassCard({ children, className = "", style, glow = "none" }: Props) {
  const glowClass = glow !== "none" ? `glow-${glow}` : "";
  return (
    <div
      className={`glass-card ${glowClass} ${className}`}
      style={{ padding: "24px", ...style }}
    >
      {children}
    </div>
  );
}
