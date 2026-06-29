"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useScan } from "@/lib/context/ScanContext";
import { useTelemetry } from "@/lib/context/TelemetryContext";
import { computeGoldenRatioScore, GoldenRatioScore } from "@/lib/scoring/goldenRatio";
import { computeSymmetry, HemifaceDelta } from "@/lib/scoring/symmetry";
import { computeBoneMetrics, BoneMetrics } from "@/lib/scoring/boneMetrics";
import { computeFacialMetrics, FacialMetrics } from "@/lib/scoring/facialMetrics";
import GlassCard from "@/components/ui/GlassCard";
import ScoreRing from "@/components/results/ScoreRing";
import RatioBreakdown from "@/components/results/RatioBreakdown";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import NeonBadge from "@/components/ui/NeonBadge";
import MeasurementLines from "@/components/scanner/MeasurementLines";

export default function ResultsPage() {
  const { state: scan, hydrated } = useScan();
  const { state: tele } = useTelemetry();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [grScore, setGrScore] = useState<GoldenRatioScore | null>(null);
  const [symScore, setSymScore] = useState<HemifaceDelta | null>(null);
  const [boneScore, setBoneScore] = useState<BoneMetrics | null>(null);
  const [harmony, setHarmony] = useState<FacialMetrics | null>(null);

  useEffect(() => {
    if (!hydrated) return; // wait for sessionStorage restore before deciding to redirect
    if (!scan.landmarks) { router.replace("/scan"); return; }
    // Simulate metric processing delay for UX
    const t = setTimeout(() => {
      setGrScore(computeGoldenRatioScore(scan.landmarks!));
      setSymScore(computeSymmetry(scan.landmarks!));
      setBoneScore(computeBoneMetrics(scan.landmarks!, scan.dimorphismMode));
      setHarmony(computeFacialMetrics(scan.landmarks!));
      setLoading(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [hydrated, scan.landmarks, scan.dimorphismMode, router]);

  // Overall score blends every available measure (teeth folded in when present).
  const aggregate = (() => {
    if (!grScore || !symScore || !boneScore || !harmony) return 0;
    const parts: [number, number][] = [
      [grScore.aggregate, 0.25],
      [harmony.aggregate, 0.20],
      [symScore.symmetryScore, 0.20],
      [boneScore.aggregateBoneScore, 0.20],
    ];
    if (scan.teeth) parts.push([scan.teeth.aggregate, 0.15]);
    const wSum = parts.reduce((s, [, w]) => s + w, 0);
    return Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / wSum * 10) / 10;
  })();

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-obsidian)",
      padding: "40px 24px", maxWidth: 680, margin: "0 auto",
    }}>
      <div className="stagger">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
            VisageIQ · Analysis Complete
          </p>
          <h1 style={{
            fontSize: 28, fontWeight: 700,
            background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Biometric Report
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14 }}>
            Deterministic golden ratio analysis · {tele.sex === "male" ? "♂ Male" : "♀ Female"} reference model
          </p>
        </div>

        {/* Aggregate score + face preview */}
        <GlassCard glow="violet" style={{ display: "flex", gap: 32, alignItems: "center", marginBottom: 24 }}>
          {loading ? (
            <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="skeleton" style={{ width: 180, height: 180, borderRadius: "50%" }} />
            </div>
          ) : (
            <ScoreRing score={aggregate} size={180} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>Aggregate Score</div>
            {loading ? (
              <SkeletonLoader count={3} height={16} />
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  <NeonBadge label={`φ ${grScore!.aggregate.toFixed(1)}`} color="violet" />
                  <NeonBadge label={`⊕ ${symScore!.symmetryScore.toFixed(1)}`} color="cyan" />
                  <NeonBadge label={`◻ ${boneScore!.aggregateBoneScore.toFixed(1)}`} color="green" />
                  {harmony && <NeonBadge label={`✶ ${harmony.aggregate.toFixed(1)}`} color="violet" />}
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  {boneScore?.dimorphismNote}
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  style={{
                    marginTop: 16, padding: "10px 20px", borderRadius: 8,
                    background: "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))",
                    border: "none", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  }}
                >
                  Full Drilldown →
                </button>
              </>
            )}
          </div>
        </GlassCard>

        {/* Captured face with landmark overlay.
            src is validated to be a data:image/ URI set by our own canvas capture — never user input. */}
        {scan.imageDataUrl && scan.imageDataUrl.startsWith("data:image/") && !loading && (
          <GlassCard style={{ marginBottom: 24, padding: 0, overflow: "hidden" }}>
            <div style={{ position: "relative", display: "block", width: "100%", lineHeight: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scan.imageDataUrl} alt="Captured face" style={{ width: "100%", display: "block", borderRadius: 16 }} />
              {scan.landmarks && scan.frameW && scan.frameH && (
                <MeasurementLines
                  landmarks={scan.landmarks}
                  srcWidth={scan.frameW}
                  srcHeight={scan.frameH}
                />
              )}
            </div>
            {/* Multi-angle capture set from the in-depth scan */}
            {scan.captures.length > 1 && (
              <div style={{ display: "flex", gap: 8, padding: 16, justifyContent: "center", flexWrap: "wrap" }}>
                {scan.captures.map(c => (
                  <div key={c.angle} style={{ textAlign: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.imageDataUrl} alt={`${c.angle} view`}
                      style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)" }} />
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4, textTransform: "capitalize" }}>{c.angle}</div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* Golden ratio breakdown */}
        <GlassCard style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Golden Ratio Analysis</h2>
            <NeonBadge label={`φ = 1.618`} color="violet" />
          </div>
          {loading ? <SkeletonLoader count={4} height={40} /> : <RatioBreakdown ratios={grScore!.ratios} />}
        </GlassCard>

        {/* Symmetry — rated out of 10 per feature */}
        <GlassCard style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Facial Symmetry</h2>
            {!loading && <NeonBadge label={`⊕ ${symScore!.symmetryScore.toFixed(1)}`} color="cyan" />}
          </div>
          {loading ? <SkeletonLoader count={2} height={40} /> : (
            <>
              <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                {symScore!.deltaMap.slice(0, 5).map((d) => {
                  const s = Math.round(Math.max(0, Math.min(10, (1 - d.percentDiff / 30) * 10)) * 10) / 10;
                  return (
                    <div key={d.feature} style={{ flex: "1 1 60px", textAlign: "center", minWidth: 56 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s >= 8 ? "var(--accent-green)" : s >= 6 ? "var(--accent-cyan)" : "var(--accent-violet)" }}>
                        {s.toFixed(1)}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{d.feature}</div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Left vs right balance, rated out of 10 per feature. Higher = more symmetric.
              </p>
            </>
          )}
        </GlassCard>

        {/* Facial Harmony — additional aesthetic measures */}
        <GlassCard style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Facial Harmony</h2>
            {!loading && harmony && <NeonBadge label={`✶ ${harmony.aggregate.toFixed(1)}`} color="violet" />}
          </div>
          {loading || !harmony ? <SkeletonLoader count={3} height={36} /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {harmony.items.map((it) => (
                <div key={it.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{it.detail}</div>
                  </div>
                  <div style={{ width: 84, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${it.score * 10}%`, background: it.score >= 8 ? "var(--accent-green)" : it.score >= 6 ? "var(--accent-cyan)" : "var(--accent-violet)" }} />
                  </div>
                  <div style={{ width: 30, textAlign: "right", fontSize: 14, fontWeight: 700, color: it.score >= 8 ? "var(--accent-green)" : it.score >= 6 ? "var(--accent-cyan)" : "var(--accent-violet)" }}>
                    {it.score.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Smile / teeth */}
        {!loading && scan.teeth && (
          <GlassCard style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Smile & Teeth</h2>
              <NeonBadge label={`☺ ${scan.teeth.aggregate.toFixed(1)}`} color="green" />
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { label: "Alignment", val: scan.teeth.alignment, show: true },
                { label: "Symmetry", val: scan.teeth.symmetry, show: true },
                { label: "Whiteness", val: scan.teeth.whiteness, show: scan.teeth.whitenessConfident },
                { label: "Proportion", val: scan.teeth.proportion, show: true },
              ].map((d) => (
                <div key={d.label} style={{ flex: "1 1 60px", textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: !d.show ? "var(--text-muted)" : d.val >= 8 ? "var(--accent-green)" : d.val >= 6 ? "var(--accent-cyan)" : "var(--accent-violet)" }}>
                    {d.show ? d.val.toFixed(1) : "—"}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{d.label}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {scan.teeth.note} Aesthetic estimate from your smile capture — not a dental diagnosis.
            </p>
          </GlassCard>
        )}

        {/* Nav */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => router.push("/scan")}
            style={{
              flex: 1, padding: "14px 0", borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
              color: "var(--text-muted)", cursor: "pointer", fontSize: 14,
            }}
          >
            Rescan
          </button>
          <button
            onClick={() => router.push("/recommendations")}
            style={{
              flex: 2, padding: "14px 0", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))",
              color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600,
            }}
          >
            View Recommendations →
          </button>
        </div>
      </div>
    </div>
  );
}
