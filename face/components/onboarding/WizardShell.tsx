"use client";
import { ReactNode } from "react";
import GlassCard from "@/components/ui/GlassCard";

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}

export default function WizardShell({
  step, totalSteps, title, subtitle, children,
  onNext, onBack, nextLabel = "Continue", nextDisabled = false,
}: Props) {
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "var(--bg-obsidian)",
    }}>
      {/* Brand header */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--accent-cyan)",
            boxShadow: "0 0 12px var(--accent-cyan)",
          }} />
          <span style={{ fontSize: 13, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase" }}>
            VisageIQ
          </span>
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 700,
          background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          {title}
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 15 }}>{subtitle}</p>
      </div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 480, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Step {step + 1} of {totalSteps}</span>
          <span style={{ fontSize: 12, color: "var(--accent-cyan)" }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg, var(--accent-violet), var(--accent-cyan))",
            borderRadius: 1, transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8,
            height: 8, borderRadius: 4,
            background: i <= step ? "var(--accent-violet)" : "rgba(255,255,255,0.1)",
            transition: "all 0.3s ease",
          }} />
        ))}
      </div>

      {/* Card */}
      <GlassCard style={{ width: "100%", maxWidth: 480, padding: 32 }} glow="violet">
        {children}
      </GlassCard>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12, marginTop: 24, width: "100%", maxWidth: 480 }}>
        {onBack && (
          <button onClick={onBack} style={{
            flex: 1, padding: "14px 0", borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent", color: "var(--text-muted)",
            cursor: "pointer", fontSize: 15, transition: "all 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            Back
          </button>
        )}
        <button
          onClick={onNext}
          disabled={nextDisabled}
          style={{
            flex: 2, padding: "14px 0", borderRadius: 12,
            border: "none",
            background: nextDisabled
              ? "rgba(139,92,246,0.2)"
              : "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))",
            color: nextDisabled ? "rgba(255,255,255,0.3)" : "white",
            cursor: nextDisabled ? "not-allowed" : "pointer",
            fontSize: 15, fontWeight: 600,
            boxShadow: nextDisabled ? "none" : "0 4px 20px rgba(139,92,246,0.3)",
            transition: "all 0.2s",
          }}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
