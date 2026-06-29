"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useScan } from "@/lib/context/ScanContext";
import { computeGoldenRatioScore } from "@/lib/scoring/goldenRatio";
import { computeSymmetry, HemifaceDelta } from "@/lib/scoring/symmetry";
import { computeBoneMetrics, BoneMetrics } from "@/lib/scoring/boneMetrics";
import GlassCard from "@/components/ui/GlassCard";
import BoneStructureCard from "@/components/dashboard/BoneStructureCard";
import SkinQualityCard from "@/components/dashboard/SkinQualityCard";
import ProportionCard from "@/components/dashboard/ProportionCard";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import NeonBadge from "@/components/ui/NeonBadge";

export default function DashboardPage() {
  const { state: scan, hydrated } = useScan();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bone, setBone] = useState<BoneMetrics | null>(null);
  const [sym, setSym] = useState<HemifaceDelta | null>(null);
  const [grScore, setGrScore] = useState(0);

  useEffect(() => {
    if (!hydrated) return; // wait for sessionStorage restore before deciding to redirect
    if (!scan.landmarks) { router.replace("/scan"); return; }
    const t = setTimeout(() => {
      setBone(computeBoneMetrics(scan.landmarks!, scan.dimorphismMode));
      setSym(computeSymmetry(scan.landmarks!));
      setGrScore(computeGoldenRatioScore(scan.landmarks!).aggregate);
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, [hydrated, scan.landmarks, scan.dimorphismMode, router]);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg-obsidian)",
      padding: "40px 24px", maxWidth: 720, margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => router.push("/results")}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>
          ← Back to Results
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
              VisageIQ · Category Breakdown
            </p>
            <h1 style={{
              fontSize: 26, fontWeight: 700,
              background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Detailed Breakdown
            </h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <NeonBadge label={`Balance ${grScore.toFixed(1)}`} color="violet" />
            <NeonBadge label={scan.dimorphismMode === "male" ? "Male reference" : "Female reference"} color="cyan" />
          </div>
        </div>
      </div>

      {/* 4-quadrant grid */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SkeletonLoader height={200} />
          <SkeletonLoader height={200} />
          <SkeletonLoader height={200} />
        </div>
      ) : (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {bone && <BoneStructureCard metrics={bone} />}
          <SkinQualityCard />
          {sym && <ProportionCard delta={sym} />}

          {/* Golden Ratio quick summary card */}
          <GlassCard>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>Proportions &amp; Balance</h3>
              <NeonBadge label={`${grScore.toFixed(1)} / 10`} color="violet" />
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>
              Based on 4 key facial ratios measured against φ = 1.618. Scores are pixel-vector deterministic
              — identical geometry always produces identical scores.
            </p>
          </GlassCard>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => router.push("/recommendations")}
        style={{
          width: "100%", marginTop: 32, padding: "16px 0", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))",
          color: "white", cursor: "pointer", fontSize: 15, fontWeight: 600,
          boxShadow: "0 4px 24px rgba(139,92,246,0.3)",
        }}
      >
        Get Clinical Recommendations →
      </button>
    </div>
  );
}
