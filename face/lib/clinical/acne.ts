// Acne types and evidence-based treatments. Types are defined by the visual
// features dermatology uses to classify them, so a feature-based estimate from
// a photo can be matched to the closest clinical profile. Treatments favor
// OTC first-line options with a clear referral to a dermatologist for
// moderate-to-severe, cystic, or persistent acne.

export type AcneType = "comedonal" | "papular" | "pustular" | "nodulocystic" | "hormonal" | "marks";

export interface AcneTreatment {
  name: string;
  detail: string;
  evidence: "A" | "B" | "C"; // A=strong RCT evidence, B=moderate, C=expert opinion
}

export interface AcneTypeInfo {
  id: AcneType;
  name: string;        // plain-language name
  looksLike: string;   // the clinical features that define it
  treatments: AcneTreatment[];
  seeDerm: boolean;    // strongly recommend a professional
}

export const ACNE_TYPES: Record<AcneType, AcneTypeInfo> = {
  comedonal: {
    id: "comedonal",
    name: "Comedonal (blackheads & whiteheads)",
    looksLike: "Small clogged pores — blackheads (open) and whiteheads (closed) — usually with little redness, often on the forehead, nose, and chin.",
    seeDerm: false,
    treatments: [
      { name: "Adapalene 0.1% (topical retinoid)", detail: "First-line: unclogs pores and prevents new comedones. Apply a pea-size amount at night; expect 8–12 weeks.", evidence: "A" },
      { name: "Salicylic acid (BHA) 2%", detail: "Oil-soluble exfoliant that clears inside the pore. Use as a cleanser or leave-on a few times a week.", evidence: "B" },
      { name: "Benzoyl peroxide 2.5%", detail: "Keeps pores clear and curbs bacteria. Start low to limit dryness.", evidence: "A" },
      { name: "Azelaic acid 10–20%", detail: "Gentle option that unclogs pores and evens tone — good if retinoids irritate.", evidence: "B" },
    ],
  },
  papular: {
    id: "papular",
    name: "Inflammatory papules (red bumps)",
    looksLike: "Small, raised red bumps without a visible white head, tender to touch — a sign of inflammation.",
    seeDerm: false,
    treatments: [
      { name: "Benzoyl peroxide 2.5–5%", detail: "Reduces acne bacteria and inflammation. A cornerstone for inflammatory acne.", evidence: "A" },
      { name: "Adapalene + benzoyl peroxide", detail: "Combining a retinoid with BPO works better than either alone.", evidence: "A" },
      { name: "Azelaic acid 15–20%", detail: "Anti-inflammatory and helps fade the marks bumps leave behind.", evidence: "A" },
      { name: "Niacinamide 4–5%", detail: "Calms redness and supports the skin barrier alongside actives.", evidence: "B" },
    ],
  },
  pustular: {
    id: "pustular",
    name: "Pustules (whitehead-topped pimples)",
    looksLike: "Inflamed bumps with a visible white or yellow pus-filled center, surrounded by redness.",
    seeDerm: false,
    treatments: [
      { name: "Benzoyl peroxide 2.5–5%", detail: "First-line; antibacterial and reduces pustules. Can be combined with a topical antibiotic.", evidence: "A" },
      { name: "Topical clindamycin + BPO (Rx)", detail: "Prescription combo for inflammatory/pustular acne — BPO prevents antibiotic resistance.", evidence: "A" },
      { name: "Adapalene 0.1–0.3%", detail: "Normalizes pore turnover to prevent new lesions.", evidence: "A" },
      { name: "Don't squeeze or pop", detail: "Picking drives inflammation deeper and causes scarring and dark marks.", evidence: "C" },
    ],
  },
  nodulocystic: {
    id: "nodulocystic",
    name: "Nodules & cysts (deep, painful)",
    looksLike: "Large, deep, painful lumps under the skin (nodules) or pus-filled cysts. Most likely to scar.",
    seeDerm: true,
    treatments: [
      { name: "See a dermatologist", detail: "Deep nodulocystic acne usually needs prescription treatment to prevent scarring — don't rely on OTC alone.", evidence: "A" },
      { name: "Oral isotretinoin (Rx)", detail: "Most effective option for severe, scarring acne; requires medical supervision.", evidence: "A" },
      { name: "Oral antibiotics (Rx)", detail: "Short courses (with a topical) reduce inflammation in moderate-severe acne.", evidence: "A" },
      { name: "Cortisone injection for flares (Rx)", detail: "A dermatologist can inject a painful cyst to calm it within days.", evidence: "B" },
    ],
  },
  hormonal: {
    id: "hormonal",
    name: "Hormonal (jawline & chin)",
    looksLike: "Breakouts concentrated on the lower face — jawline, chin, and lower cheeks — often deeper and flaring on a monthly cycle in adults.",
    seeDerm: false,
    treatments: [
      { name: "Topical retinoid (adapalene)", detail: "Keeps pores clear and is the backbone of any acne routine.", evidence: "A" },
      { name: "Azelaic acid 15–20%", detail: "Calms inflammation and fades post-acne marks; safe long-term.", evidence: "A" },
      { name: "Spironolactone (Rx, for women)", detail: "Targets the hormonal driver of jawline acne — very effective; needs a prescription.", evidence: "A" },
      { name: "Consistent BHA + dermatologist eval", detail: "Salicylic acid helps; a clinician can check hormones if breakouts are cyclical and stubborn.", evidence: "B" },
    ],
  },
  marks: {
    id: "marks",
    name: "Post-acne marks (dark spots & redness)",
    looksLike: "Flat brown spots (post-inflammatory hyperpigmentation) or lingering pink/red marks where pimples have healed — not active acne.",
    seeDerm: false,
    treatments: [
      { name: "Daily broad-spectrum SPF 30+", detail: "Non-negotiable: sun makes dark marks darker and last longer.", evidence: "A" },
      { name: "Vitamin C 10–20% (morning)", detail: "Antioxidant that brightens and speeds fading of discoloration.", evidence: "B" },
      { name: "Azelaic acid 10–20%", detail: "Fades both brown spots and red marks while being gentle.", evidence: "A" },
      { name: "Topical retinoid (night)", detail: "Speeds cell turnover to clear marks faster.", evidence: "A" },
    ],
  },
};
