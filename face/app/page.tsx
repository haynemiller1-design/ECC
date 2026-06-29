"use client";
import Link from "next/link";
import ScoreRing from "@/components/results/ScoreRing";

const FEATURES = [
  {
    icon: "φ",
    title: "Golden Ratio Score",
    desc: "Your face measured against nature's perfect ratio — the same standard used in classical art and modern aesthetics.",
    color: "var(--accent-violet)",
  },
  {
    icon: "⊕",
    title: "Symmetry Analysis",
    desc: "68-point facial landmark mesh maps left-to-right balance across eyes, nose, cheekbones, and jaw.",
    color: "var(--accent-cyan)",
  },
  {
    icon: "◻",
    title: "Bone Structure Map",
    desc: "Bizygomatic ratio, gonial angle, and chin projection scored against sex-specific reference norms.",
    color: "var(--accent-green)",
  },
  {
    icon: "✦",
    title: "Skin Protocol",
    desc: "Evidence-based ingredient stacks and routine ordering calibrated to your age and skin type.",
    color: "var(--accent-violet)",
  },
];

const STEPS = [
  { n: "1", label: "Answer 4 quick questions", sub: "Age, sex, measurements, skin type — takes under a minute." },
  { n: "2", label: "Take a selfie", sub: "No account. No upload. Your photo never leaves your device." },
  { n: "3", label: "Get your full report", sub: "Golden ratio score, symmetry map, bone metrics, and skincare plan." },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-obsidian)", color: "var(--text-primary)", overflowX: "hidden" }}>

      {/* Nav bar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        background: "rgba(11,15,25,0.8)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-cyan)", boxShadow: "0 0 10px var(--accent-cyan)" }} />
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "0.04em" }}>VisageIQ</span>
        </div>
        <Link
          href="/onboarding"
          style={{
            padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(139,92,246,0.3)", cursor: "pointer",
            background: "rgba(139,92,246,0.15)", color: "var(--accent-violet)",
            fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-block",
          } as React.CSSProperties}
        >
          Get Started
        </Link>
      </nav>

      {/* Hero */}
      <section style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "80px 24px 64px", textAlign: "center", position: "relative",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none",
        }} />

        {/* Trust pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 28,
          padding: "6px 14px", borderRadius: 100,
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
        }}>
          <span style={{ fontSize: 11, color: "var(--accent-green)" }}>🔒</span>
          <span style={{ fontSize: 12, color: "var(--accent-green)", fontWeight: 500 }}>
            Camera data never leaves your device
          </span>
        </div>

        <h1 style={{
          fontSize: "clamp(36px, 7vw, 64px)", fontWeight: 800, lineHeight: 1.1,
          marginBottom: 20, maxWidth: 720, letterSpacing: "-0.02em",
          background: "linear-gradient(135deg, #F1F5F9 20%, #8B5CF6 60%, #06B6D4 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          Your Face,<br />Measured by Science
        </h1>

        <p style={{ fontSize: 18, color: "var(--text-subtle)", maxWidth: 500, lineHeight: 1.7, marginBottom: 40 }}>
          Golden ratio scoring, bone structure mapping, and personalized skincare — free, instant, and 100% private.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/onboarding"
            style={{
              padding: "16px 36px", borderRadius: 12, border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))",
              color: "white", fontSize: 16, fontWeight: 700,
              boxShadow: "0 8px 32px rgba(139,92,246,0.4)",
              transition: "transform 0.15s, box-shadow 0.15s",
              textDecoration: "none", display: "inline-block",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(139,92,246,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(139,92,246,0.4)"; }}
          >
            Analyze My Face →
          </Link>
          <a
            href="#how-it-works"
            style={{
              padding: "16px 28px", borderRadius: 12, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
              color: "var(--text-muted)", fontSize: 16, fontWeight: 500,
              textDecoration: "none", transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-muted)"; }}
          >
            See how it works
          </a>
        </div>

        <Link href="/rate" style={{ marginTop: 18, fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
          or <span style={{ color: "var(--accent-cyan)", borderBottom: "1px solid rgba(6,182,212,0.4)" }}>rate someone from a photo →</span>
        </Link>

        {/* Score preview */}
        <div style={{
          marginTop: 64, display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap", justifyContent: "center",
          padding: "32px 40px", borderRadius: 20,
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
        }}>
          <ScoreRing score={8.3} size={140} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>Sample Report</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Golden Ratio", val: "8.6", color: "var(--accent-violet)" },
                { label: "Symmetry", val: "7.9", color: "var(--accent-cyan)" },
                { label: "Bone Structure", val: "8.4", color: "var(--accent-green)" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 100, height: 4, borderRadius: 2,
                    background: "rgba(255,255,255,0.06)", overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${parseFloat(item.val) * 10}%`, height: "100%",
                      background: item.color, borderRadius: 2,
                      boxShadow: `0 0 8px ${item.color}`,
                    }} />
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: item.color, fontWeight: 700, marginLeft: "auto" }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "64px 24px", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.16em", textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
          What you get
        </p>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", marginBottom: 48, color: "var(--text-primary)" }}>
          Four reports. One scan.
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              padding: "24px 20px", borderRadius: 16,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              transition: "border-color 0.2s, transform 0.2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = f.color.replace("var(", "").replace(")", "") === "--accent-violet" ? "rgba(139,92,246,0.3)" : f.color === "var(--accent-cyan)" ? "rgba(6,182,212,0.3)" : "rgba(16,185,129,0.3)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ fontSize: 24, marginBottom: 12, color: f.color }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{f.title}</div>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: "64px 24px", maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>
          Simple as 1-2-3
        </p>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 48 }}>How it works</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: "flex", gap: 24, textAlign: "left", position: "relative" }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: "absolute", left: 19, top: 48, width: 2, height: "calc(100% - 8px)",
                  background: "rgba(139,92,246,0.15)",
                }} />
              )}
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 16, color: "white",
                  boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
                }}>{s.n}</div>
              </div>
              <div style={{ paddingBottom: 40 }}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{s.label}</div>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy section */}
      <section style={{
        margin: "0 24px 64px", maxWidth: 680, marginLeft: "auto", marginRight: "auto",
        padding: "32px", borderRadius: 20,
        background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)",
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ fontSize: 28, flexShrink: 0 }}>🔒</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6, color: "var(--accent-green)" }}>
              Your privacy is non-negotiable
            </div>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
              All face analysis runs locally in your browser using WebAssembly and WebGL. Your photo is drawn to a canvas, scored, and discarded — it is never encoded, uploaded, or transmitted to any server. We have no backend, no database, and no accounts.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: "64px 24px 96px", textAlign: "center" }}>
        <h2 style={{
          fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, marginBottom: 16,
          background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          Ready to see your score?
        </h2>
        <p style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 36 }}>
          Free. No account. Under 2 minutes.
        </p>
        <Link
          href="/onboarding"
          style={{
            padding: "18px 48px", borderRadius: 12, border: "none", cursor: "pointer",
            background: "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))",
            color: "white", fontSize: 17, fontWeight: 700,
            boxShadow: "0 8px 40px rgba(139,92,246,0.4)",
            transition: "transform 0.15s, box-shadow 0.15s",
            textDecoration: "none", display: "inline-block",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 48px rgba(139,92,246,0.55)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(139,92,246,0.4)"; }}
        >
          Analyze My Face →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "24px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-cyan)" }} />
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>VisageIQ</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          For educational use only. Not a medical device.
        </span>
      </footer>
    </div>
  );
}
