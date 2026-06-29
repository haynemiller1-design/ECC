"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTelemetry } from "@/lib/context/TelemetryContext";
import { getClinicalRecommendations, getBoneRecommendations, ClinicalEntry, BoneRecommendation, ConcernType, BoneTarget } from "@/lib/clinical/database";
import GlassCard from "@/components/ui/GlassCard";
import IngredientCard from "@/components/recommendations/IngredientCard";
import RoutineMatrix from "@/components/recommendations/RoutineMatrix";
import NeonBadge from "@/components/ui/NeonBadge";
import SkeletonLoader from "@/components/ui/SkeletonLoader";

function inferConcerns(skinType: string | null, age: number | null): ConcernType[] {
  const concerns: ConcernType[] = [];
  if (!skinType || !age) return ["comedonal"];
  if (skinType === "oily" && age < 30) concerns.push("comedonal", "inflammatory");
  else if (skinType === "oily") concerns.push("inflammatory", "hyperpigmentation");
  if (skinType === "dry" && age >= 40) concerns.push("volume_loss", "texture");
  if (skinType === "sensitive") concerns.push("sensitivity", "texture");
  if (age >= 40) concerns.push("volume_loss", "texture");
  if (age >= 30) concerns.push("hyperpigmentation");
  return concerns.length > 0 ? [...new Set(concerns)] : ["comedonal"];
}

function inferBoneTargets(/* future: pass bone score */): BoneTarget[] {
  return ["jawline", "symmetry", "bizygomatic"];
}

export default function RecommendationsPage() {
  const { state: tele } = useTelemetry();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [skinRecs, setSkinRecs] = useState<ClinicalEntry[]>([]);
  const [boneRecs, setBoneRecs] = useState<BoneRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<"skin" | "bone">("skin");

  useEffect(() => {
    const t = setTimeout(() => {
      const concerns = inferConcerns(tele.skinType, tele.age);
      const boneTargets = inferBoneTargets();
      setSkinRecs(getClinicalRecommendations(tele.skinType ?? "combination", tele.age ?? 25, concerns));
      setBoneRecs(getBoneRecommendations(boneTargets));
      setLoading(false);
    }, 900);
    return () => clearTimeout(t);
  }, [tele.skinType, tele.age]);

  const tabs = [
    { id: "skin" as const, label: "Skin Protocol", badge: skinRecs.reduce((s, r) => s + r.ingredients.length, 0) },
    { id: "bone" as const, label: "Bone & Structure", badge: boneRecs.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-obsidian)", padding: "40px 24px", maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => router.push("/dashboard")}
          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>
          ← Back to Dashboard
        </button>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
          VisageIQ · Clinical Intelligence
        </p>
        <h1 style={{
          fontSize: 26, fontWeight: 700,
          background: "linear-gradient(135deg, #10B981, #06B6D4)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          Personalized Recommendations
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14 }}>
          Evidence-based protocols derived from peer-reviewed literature.
          {tele.age && tele.skinType && ` Calibrated for ${tele.age}yr ${tele.skinType} skin.`}
        </p>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "10px 14px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: 8, marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
          For educational purposes only. Consult a board-certified dermatologist or physician before starting any skincare regimen or structural intervention.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, padding: "10px 16px", borderRadius: 9, border: "none", cursor: "pointer",
            background: activeTab === t.id ? "rgba(255,255,255,0.08)" : "transparent",
            color: activeTab === t.id ? "var(--text-primary)" : "var(--text-muted)",
            fontSize: 13, fontWeight: 600, transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {t.label}
            <span style={{
              padding: "1px 8px", borderRadius: 10, fontSize: 11,
              background: activeTab === t.id ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)",
              color: activeTab === t.id ? "var(--accent-violet)" : "var(--text-muted)",
            }}>{t.badge}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SkeletonLoader count={5} height={80} />
        </div>
      ) : activeTab === "skin" ? (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {skinRecs.length === 0 ? (
            <GlassCard>
              <p style={{ color: "var(--text-muted)", textAlign: "center", fontSize: 14 }}>
                Complete onboarding to unlock personalized skin protocols.
              </p>
            </GlassCard>
          ) : (
            skinRecs.map((entry, ei) => (
              <GlassCard key={ei} glow="cyan">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {entry.concerns.map(c => <NeonBadge key={c} label={c.replace("_", " ")} color="cyan" />)}
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  {entry.ingredients.map((ing, ii) => (
                    <IngredientCard key={ing.name} ingredient={ing} index={ii} />
                  ))}
                </div>

                {/* Routine matrix */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Routine Order
                  </div>
                  <RoutineMatrix steps={entry.routineOrder} />
                </div>

                {entry.notes && (
                  <div style={{ marginTop: 14, padding: "8px 12px", background: "rgba(6,182,212,0.06)", borderRadius: 8, border: "1px solid rgba(6,182,212,0.1)" }}>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>💡 {entry.notes}</p>
                  </div>
                )}
              </GlassCard>
            ))
          )}
        </div>
      ) : (
        <div className="stagger" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {boneRecs.map((rec, i) => {
            const typeColors = { exercise: "green", consultation: "violet", device: "cyan", lifestyle: "cyan" } as const;
            return (
              <GlassCard key={i} glow="violet">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{rec.intervention}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Target: {rec.target.replace("_", " ")}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
                    <NeonBadge label={rec.type} color={typeColors[rec.type]} />
                    <NeonBadge label={`Evidence ${rec.evidenceLevel}`} color="violet" />
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 10 }}>{rec.description}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>{rec.source}</p>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Start over */}
      <button
        onClick={() => router.push("/onboarding")}
        style={{
          width: "100%", marginTop: 32, padding: "14px 0", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
          color: "var(--text-muted)", cursor: "pointer", fontSize: 14,
        }}
      >
        New Analysis
      </button>
    </div>
  );
}
