// Mocked clinical recommendation database
// Structure mirrors PubMed Central / Journal of Dermatological Science taxonomy

export type SkinType = "oily" | "dry" | "combination" | "sensitive";
export type AgeGroup = "teen" | "young_adult" | "adult" | "mature";
export type ConcernType = "comedonal" | "inflammatory" | "hyperpigmentation" | "volume_loss" | "texture" | "sensitivity";
export type BoneTarget = "jawline" | "gonial_angle" | "symmetry" | "bizygomatic";

export interface ClinicalIngredient {
  name: string;
  concentration: string;
  mechanism: string;
  productType: string;
  evidenceLevel: "A" | "B" | "C"; // A=RCT, B=cohort, C=expert opinion
  source: string;
  contraindications?: string[];
}

export interface BoneRecommendation {
  target: BoneTarget;
  intervention: string;
  type: "exercise" | "consultation" | "device" | "lifestyle";
  description: string;
  evidenceLevel: "A" | "B" | "C";
  source: string;
}

export interface ClinicalEntry {
  skinType: SkinType[];
  ageGroups: AgeGroup[];
  concerns: ConcernType[];
  ingredients: ClinicalIngredient[];
  routineOrder: string[];
  notes: string;
}

function getAgeGroup(age: number): AgeGroup {
  if (age < 20) return "teen";
  if (age < 30) return "young_adult";
  if (age < 45) return "adult";
  return "mature";
}

export const CLINICAL_DB: ClinicalEntry[] = [
  {
    skinType: ["oily", "combination"],
    ageGroups: ["teen", "young_adult"],
    concerns: ["comedonal"],
    ingredients: [
      {
        name: "Salicylic Acid",
        concentration: "0.5%–2%",
        mechanism: "Beta-hydroxy acid; dissolves sebum plugs via keratolysis and comedolysis",
        productType: "Cleanser / Exfoliant Toner",
        evidenceLevel: "A",
        source: "Journal of Clinical & Aesthetic Dermatology, 2019",
        contraindications: ["Aspirin allergy", "Pregnancy (high conc.)"],
      },
      {
        name: "Niacinamide",
        concentration: "5%–10%",
        mechanism: "Reduces sebum excretion via PPAR-α pathway; anti-inflammatory",
        productType: "Serum / Moisturizer",
        evidenceLevel: "A",
        source: "Int J Dermatol 2007; 46(11):1161–1167",
      },
      {
        name: "Benzoyl Peroxide",
        concentration: "2.5%–5%",
        mechanism: "Bactericidal against C. acnes; reduces comedonal load",
        productType: "Spot Treatment / Wash",
        evidenceLevel: "A",
        source: "Cochrane Review: Acne vulgaris, 2020",
        contraindications: ["Sensitive skin", "Bleaches fabric"],
      },
    ],
    routineOrder: ["Salicylic Acid Cleanser", "Niacinamide Serum", "Oil-Free Moisturizer", "SPF 30+"],
    notes: "Avoid over-stripping: limit exfoliation to 3×/week maximum.",
  },
  {
    skinType: ["oily", "combination"],
    ageGroups: ["young_adult", "adult"],
    concerns: ["inflammatory"],
    ingredients: [
      {
        name: "Adapalene",
        concentration: "0.1%–0.3%",
        mechanism: "Synthetic retinoid; normalizes follicular keratinization, anti-inflammatory",
        productType: "Topical Gel (Rx or OTC 0.1%)",
        evidenceLevel: "A",
        source: "J Am Acad Dermatol 2014;71(1):26–36",
        contraindications: ["Pregnancy (Pregnancy Category C)", "Eczema-active skin"],
      },
      {
        name: "Azelaic Acid",
        concentration: "15%–20%",
        mechanism: "Inhibits P. acnes, reduces PIH, anti-keratinizing",
        productType: "Cream / Gel",
        evidenceLevel: "A",
        source: "Dermatology 2003;206(2):93–98",
      },
    ],
    routineOrder: ["Gentle Cleanser", "Azelaic Acid (AM)", "Adapalene (PM)", "Non-comedogenic Moisturizer", "SPF 50"],
    notes: "Introduce adapalene slowly (2×/week) to minimize purge response.",
  },
  {
    skinType: ["oily", "dry", "combination", "sensitive"],
    ageGroups: ["adult", "mature"],
    concerns: ["hyperpigmentation"],
    ingredients: [
      {
        name: "Alpha-Arbutin",
        concentration: "2%",
        mechanism: "Competitive tyrosinase inhibitor; reduces melanin synthesis",
        productType: "Serum",
        evidenceLevel: "B",
        source: "J Cosmet Dermatol 2019;18(2):631–636",
      },
      {
        name: "Vitamin C (L-Ascorbic Acid)",
        concentration: "10%–20%",
        mechanism: "Antioxidant; inhibits tyrosinase, photodamage protection",
        productType: "AM Serum",
        evidenceLevel: "B",
        source: "Dermatol Surg 2005;31(7 Pt 2):814–818",
        contraindications: ["Oxidizes rapidly; discard if yellow/brown"],
      },
    ],
    routineOrder: ["Vitamin C Serum (AM)", "Alpha-Arbutin Serum", "Moisturizer", "SPF 50+"],
    notes: "Sunscreen is mandatory — UV exposure reverses depigmentation gains.",
  },
  {
    skinType: ["dry", "combination", "sensitive"],
    ageGroups: ["mature"],
    concerns: ["volume_loss", "texture"],
    ingredients: [
      {
        name: "Retinol",
        concentration: "0.025%–0.1% (OTC) / Tretinoin 0.025%–0.1% (Rx)",
        mechanism: "Upregulates collagen I/III synthesis, promotes cellular turnover, reduces MMP activity",
        productType: "PM Serum / Cream",
        evidenceLevel: "A",
        source: "Arch Dermatol 2007;143(5):606–612",
        contraindications: ["Pregnancy", "Nursing", "Active eczema"],
      },
      {
        name: "Peptides (Matrixyl 3000 / Argireline)",
        concentration: "≥5% palmitoyl peptide complex",
        mechanism: "Signal peptides stimulate fibroblast collagen production",
        productType: "PM Serum",
        evidenceLevel: "B",
        source: "Int J Cosmet Sci 2009;31(5):327–345",
      },
      {
        name: "Hyaluronic Acid",
        concentration: "1%–2% (multi-molecular weight)",
        mechanism: "Humectant; draws moisture to dermis and epidermis",
        productType: "Serum / Essence",
        evidenceLevel: "A",
        source: "J Drugs Dermatol 2011;10(9):990–1000",
      },
    ],
    routineOrder: ["Gentle Cleanser", "HA Serum", "Peptide Serum (AM)", "Rich Moisturizer", "SPF 50", "Retinol (PM only)"],
    notes: "Clinical consultation recommended for Rx tretinoin. Introduce retinol over 8 weeks.",
  },
  {
    skinType: ["sensitive"],
    ageGroups: ["teen", "young_adult", "adult", "mature"],
    concerns: ["sensitivity", "texture"],
    ingredients: [
      {
        name: "Ceramides (CER1, CER3, CER6-II)",
        concentration: "Ceramide complex",
        mechanism: "Restores skin barrier lipid bilayer; reduces TEWL",
        productType: "Moisturizer / Cleanser",
        evidenceLevel: "A",
        source: "J Invest Dermatol 2012;132(9):2128–2137",
      },
      {
        name: "Centella Asiatica Extract (CICA)",
        concentration: "Titrated extract",
        mechanism: "Anti-inflammatory via NF-κB suppression; promotes wound healing",
        productType: "Serum / Cream",
        evidenceLevel: "B",
        source: "J Ethnopharmacol 2001;76(3):299–306",
      },
    ],
    routineOrder: ["Cream Cleanser", "CICA Serum", "Ceramide Moisturizer", "Mineral SPF 30"],
    notes: "Patch test all actives. Avoid fragrance, alcohol denat., and sulfates.",
  },
];

export const BONE_RECOMMENDATIONS: BoneRecommendation[] = [
  {
    target: "jawline",
    intervention: "Mewing / Myofunctional Therapy",
    type: "exercise",
    description: "Correct tongue resting posture against palate; activates masseter and suprahyoid muscles. Peer literature supports structural influence during growth phases.",
    evidenceLevel: "C",
    source: "Am J Orthod Dentofacial Orthop 2017;152(1):12–22",
  },
  {
    target: "jawline",
    intervention: "Jaw Resistance Training",
    type: "exercise",
    description: "Soft-resistance chew training (mastic gum, jaw exerciser devices) 10 min/day increases masseter hypertrophy and visual jaw definition.",
    evidenceLevel: "B",
    source: "J Oral Rehabil 2018;45(11):857–865",
  },
  {
    target: "gonial_angle",
    intervention: "Orthodontic Consultation",
    type: "consultation",
    description: "Skeletal Class II/III discrepancies affecting gonial angle are addressable via orthognathic surgery or functional appliance therapy. Refer to maxillofacial specialist.",
    evidenceLevel: "A",
    source: "J Craniofac Surg 2020;31(4):938–942",
  },
  {
    target: "symmetry",
    intervention: "Postural Optimization Protocol",
    type: "lifestyle",
    description: "Forward head posture and cervical misalignment contribute to asymmetric temporalis/masseter loading. Physical therapy targeting cervical neutral position reduces progressive asymmetry.",
    evidenceLevel: "B",
    source: "J Phys Ther Sci 2016;28(1):269–273",
  },
  {
    target: "bizygomatic",
    intervention: "Body Composition Optimization",
    type: "lifestyle",
    description: "Sub-12% body fat (male) / sub-20% (female) reveals bizygomatic structure and reduces buccal fat prominence without surgical intervention.",
    evidenceLevel: "B",
    source: "Aesthet Surg J 2021;41(4):NP148–NP158",
  },
  {
    target: "bizygomatic",
    intervention: "Maxillofacial / Filler Consultation",
    type: "consultation",
    description: "For adults, zygomatic arch augmentation or judicious hyaluronic acid filler placement can address bizygomatic width deficiency. Board-certified plastic surgeon required.",
    evidenceLevel: "A",
    source: "Plast Reconstr Surg 2019;143(3):723–732",
  },
];

export function getClinicalRecommendations(
  skinType: SkinType,
  age: number,
  concerns: ConcernType[]
): ClinicalEntry[] {
  const ageGroup = getAgeGroup(age);
  return CLINICAL_DB.filter(
    (entry) =>
      entry.skinType.includes(skinType) &&
      entry.ageGroups.includes(ageGroup) &&
      entry.concerns.some((c) => concerns.includes(c))
  );
}

export function getBoneRecommendations(targets: BoneTarget[]): BoneRecommendation[] {
  return BONE_RECOMMENDATIONS.filter((r) => targets.includes(r.target));
}
