"use client";
import { ClinicalIngredient } from "@/lib/clinical/database";
import NeonBadge from "@/components/ui/NeonBadge";

interface Props { ingredient: ClinicalIngredient; index: number; }

const evidenceColors = { A: "green", B: "cyan", C: "violet" } as const;

export default function IngredientCard({ ingredient, index }: Props) {
  return (
    <div style={{
      padding: "16px", borderRadius: 12,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 24, height: 24, borderRadius: "50%",
            background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "var(--accent-violet)", fontWeight: 700,
          }}>{index + 1}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{ingredient.name}</div>
            <div style={{ fontSize: 12, color: "var(--accent-cyan)", marginTop: 2 }}>{ingredient.concentration}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexDirection: "column", alignItems: "flex-end" }}>
          <NeonBadge label={`Evidence ${ingredient.evidenceLevel}`} color={evidenceColors[ingredient.evidenceLevel]} />
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{ingredient.productType}</span>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 8 }}>{ingredient.mechanism}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", fontStyle: "italic" }}>{ingredient.source}</span>
      </div>

      {ingredient.contraindications && (
        <div style={{ marginTop: 8, padding: "6px 10px", background: "rgba(244,63,94,0.06)", borderRadius: 6, border: "1px solid rgba(244,63,94,0.15)" }}>
          <p style={{ fontSize: 11, color: "#FB7185" }}>
            ⚠ {ingredient.contraindications.join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
