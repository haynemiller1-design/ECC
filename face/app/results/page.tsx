"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useScan } from "@/lib/context/ScanContext";
import { useTelemetry } from "@/lib/context/TelemetryContext";
import { computeGoldenRatioScore, GoldenRatioScore } from "@/lib/scoring/goldenRatio";
import { computeSymmetry, HemifaceDelta } from "@/lib/scoring/symmetry";
import { computeBoneMetrics, BoneMetrics } from "@/lib/scoring/boneMetrics";
import GlassCard from "@/components/ui/GlassCard";
import ScoreRing from "@/components/results/ScoreRing";
import RatioBreakdown from "@/components/results/RatioBreakdown";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import NeonBadge from "@/components/ui/NeonBadge";
import LandmarkOverlay from "@/components/scanner/LandmarkOverlay";

export default function ResultsPage() {
  const { state: scan, hydrated } = useScan();
  const { state: tele } = useTelemetry();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [grScore, setGrScore] = useState<GoldenRatioScore | null>(null);
  const [symScore, setSymScore] = useState<HemifaceDelta | null>(null);
  const [boneScore, setBoneScore] = useState<BoneMetrics | null>(null);

  useEffect(() => {
    if (!hydrated) return; // wait for sessionStorage restore before deciding to redirect
    if (!scan.landmarks) { router.replace("/scan"); return; }
    // Simulate metric processing delay for UX
    const t = setTimeout(() => {
      const gr = computeGoldenRatioScore(scan.landmarks!);
      const sym = computeSymmetry(scan.landmarks!);
      const bone = computeBoneMetrics(scan.landmarks!, scan.dimorphismMode);
      setGrScore(gr);
      setSymScore(sym);
      setBoneScore(bone);
      setLoading(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [hydrated, scan.landmarks, scan.dimorphismMode, router]);

  const aggregate = grScore && symScore && boneScore
    ? Math.round((grScore.aggregate * 0.4 + symScore.symmetryScore * 0.3 + boneScore.aggregateBoneScore * 0.3) * 10) / 10
    : 0;

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
            <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={scan.imageDataUrl} alt="Captured face" style={{ width: "100%", display: "block", borderRadius: 16 }} />
              {scan.landmarks && (
                <LandmarkOverlay
                  landmarks={scan.landmarks}
                  width={640}
                  height={480}
                />
              )}
            </div>
            {/* Multi-angle capture set from the in-depth scan */}
            {scan.captures.length > 1 && (
              <div style={{ display: "flex", gap: 8, padding: 16, justifyContent: "center" }}>
                {scan.captures.map(c => (
                  <div key={c.angle} style={{ textAlign: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.imageDataUrl} alt={`${c.angle} view`}
                      style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", transform: "scaleX(-1)" }} />
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

        {/* Symmetry */}
        <GlassCard style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Facial Symmetry</h2>
          {loading ? <SkeletonLoader count={2} height={40} /> : (
            <>
              <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
                {symScore!.deltaMap.slice(0, 5).map((d) => (
                  <div key={d.feature} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: d.percentDiff < 5 ? "var(--accent-green)" : d.percentDiff < 15 ? "var(--accent-cyan)" : "var(--accent-violet)" }}>
                      {d.percentDiff.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>{d.feature}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Left-hemiface vs right-hemiface delta tracking. Lower % = higher bilateral symmetry.
              </p>
            </>
          )}
        </GlassCard>

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
