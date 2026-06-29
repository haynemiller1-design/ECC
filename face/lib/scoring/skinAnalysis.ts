import type { AcneType } from "@/lib/clinical/acne";

// Per-region skin signals sampled from the captured photo (all roughly 0..1).
export interface RegionSignal {
  redness: number;     // inflammation (red dominance)
  spotDensity: number; // fraction of pixels that look like lesions/bumps
  darkSpots: number;   // fraction of brown post-acne marks
  shine: number;       // specular oil highlights
}

export interface NamedRegion { name: string; signal: RegionSignal; }

export interface SkinAnalysis {
  hasAcne: boolean;
  severity: "clear" | "mild" | "moderate" | "severe";
  clarityScore: number;                 // 0-10 (10 = clearest)
  types: { type: AcneType; confidence: number }[]; // sorted desc, prominent first
  regions: NamedRegion[];
  note: string;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const mean = (xs: number[]) => xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 0;

// Tunable thresholds (exported for on-device calibration).
export const SKIN = {
  ACNE_SPOT: 0.06,   // spot density above this suggests active breakouts
  ACNE_RED: 0.13,    // redness above this suggests inflammation
  MARK_DARK: 0.05,   // dark-spot fraction above this = visible marks
  PROMINENT: 0.34,   // min confidence to surface an acne type
};

function region(regions: NamedRegion[], name: string): RegionSignal | null {
  const r = regions.find(x => x.name === name);
  return r ? r.signal : null;
}

export function analyzeSkin(regions: NamedRegion[], age: number, sex: "male" | "female" | null): SkinAnalysis {
  if (!regions.length) {
    return { hasAcne: false, severity: "clear", clarityScore: 0, types: [], regions, note: "No skin capture available." };
  }

  const redness = mean(regions.map(r => r.signal.redness));
  const spotDensity = mean(regions.map(r => r.signal.spotDensity));
  const darkSpots = mean(regions.map(r => r.signal.darkSpots));
  const shine = mean(regions.map(r => r.signal.shine));

  // Distribution: lower face (chin) vs T-zone (forehead/nose) lesion load.
  const chin = region(regions, "chin");
  const forehead = region(regions, "forehead");
  const nose = region(regions, "nose");
  const lowerLoad = chin ? chin.spotDensity + chin.redness : spotDensity;
  const tzoneLoad = mean([forehead, nose].filter(Boolean).map(r => (r as RegionSignal).spotDensity + (r as RegionSignal).redness)) || spotDensity;

  // Lesion load drives severity / clarity.
  const lesionLoad = spotDensity + redness * 0.6;
  const clarityScore = Math.round(clamp01(1 - lesionLoad / 0.5) * 10 * 10) / 10;
  const hasAcne = spotDensity >= SKIN.ACNE_SPOT || redness >= SKIN.ACNE_RED;

  const severity: SkinAnalysis["severity"] =
    !hasAcne ? "clear" :
    lesionLoad > 0.34 || (redness > 0.30 && spotDensity > 0.18) ? "severe" :
    lesionLoad > 0.18 ? "moderate" : "mild";

  // ── Match to clinical type profiles (confidence 0..1) ──
  const conf: Record<AcneType, number> = {
    comedonal: 0, papular: 0, pustular: 0, nodulocystic: 0, hormonal: 0, marks: 0,
  };
  if (hasAcne) {
    // Comedonal: clogged pores + oily, little inflammation.
    conf.comedonal = clamp01((spotDensity - 0.04) / 0.18 * 0.7 + shine * 0.5 + (0.15 - redness) / 0.15 * 0.3);
    // Papular: red bumps, moderate density, not much pus/shine.
    conf.papular = clamp01((redness - 0.10) / 0.18 * 0.7 + (spotDensity - 0.04) / 0.16 * 0.4);
    // Pustular: strong redness AND density with bright (pus) centers.
    conf.pustular = clamp01((redness - 0.16) / 0.18 * 0.6 + (spotDensity - 0.08) / 0.16 * 0.5 + shine * 0.2);
    // Nodulocystic: very high inflammation + severe load.
    conf.nodulocystic = clamp01((redness - 0.26) / 0.16 * 0.7 + (severity === "severe" ? 0.4 : 0));
    // Hormonal: lower face clearly worse than T-zone, in adults.
    const lowerBias = clamp01((lowerLoad - tzoneLoad) / 0.2);
    conf.hormonal = clamp01(lowerBias * 0.8 + (age >= 20 ? 0.3 : 0) + (sex === "female" ? 0.15 : 0)) * (spotDensity >= 0.04 ? 1 : 0);
  }
  // Marks can show with or without active acne.
  conf.marks = clamp01((darkSpots - 0.03) / 0.12);

  const types = (Object.keys(conf) as AcneType[])
    .map(type => ({ type, confidence: Math.round(conf[type] * 100) / 100 }))
    .filter(t => t.confidence >= SKIN.PROMINENT)
    .sort((a, b) => b.confidence - a.confidence);

  // If acne is present but nothing crossed the bar, surface the single best match.
  if (hasAcne && types.length === 0) {
    const best = (Object.keys(conf) as AcneType[])
      .filter(t => t !== "marks")
      .map(type => ({ type, confidence: Math.round(conf[type] * 100) / 100 }))
      .sort((a, b) => b.confidence - a.confidence)[0];
    if (best && best.confidence > 0) types.push(best);
  }

  const note = !hasAcne
    ? (darkSpots >= SKIN.MARK_DARK ? "Skin looks largely clear of active breakouts, with some post-acne marks to fade." : "Skin looks largely clear of active acne.")
    : severity === "severe"
      ? "Signs of significant inflammatory acne — a dermatologist visit is strongly recommended."
      : "Visible breakouts detected. Estimated from your photo — see a dermatologist if it's painful, scarring, or not improving.";

  return { hasAcne, severity, clarityScore, types, regions, note };
}
