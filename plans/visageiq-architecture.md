# VisageIQ — Architecture Blueprint

**Location:** `ECC/face/` (Next.js 14 App Router)  
**Branch:** `claude/visageiq-build-4ijwvo`

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS + custom CSS variables |
| State | React Context + useReducer |
| Camera/CV | WebRTC (getUserMedia) + HTML5 Canvas + face-api.js (TinyFaceDetector + 68-point landmarks) |
| Math | Pure JS golden-ratio engine (deterministic, pixel-vector based) |
| Recommendations | Static JSON clinical database (mocked PubMed/JDS structure) |
| Deployment | Vercel-ready (Next.js serverless) |

---

## Directory Layout

```
face/
├── app/
│   ├── layout.tsx               # Root layout — obsidian theme, fonts
│   ├── page.tsx                 # Entry → redirect to /onboarding
│   ├── onboarding/
│   │   └── page.tsx             # Phase 1: Multi-step telemetry wizard
│   ├── scan/
│   │   └── page.tsx             # Phase 2: WebRTC camera + landmark mesh
│   ├── results/
│   │   └── page.tsx             # Phase 3: Golden ratio score display
│   ├── dashboard/
│   │   └── page.tsx             # Phase 4: 4-way drilldown
│   └── recommendations/
│       └── page.tsx             # Phase 5: Clinical advice engine
├── components/
│   ├── onboarding/
│   │   ├── StepAge.tsx
│   │   ├── StepSex.tsx
│   │   ├── StepMeasurements.tsx
│   │   ├── StepSkinType.tsx
│   │   └── WizardShell.tsx
│   ├── scanner/
│   │   ├── CameraViewfinder.tsx  # WebRTC feed + canvas overlay
│   │   ├── ScanLaser.tsx         # Animated neon scan line
│   │   ├── LandmarkOverlay.tsx   # SVG mesh on detected face
│   │   └── DimorphismToggle.tsx  # Male/Female metrics switch
│   ├── results/
│   │   ├── ScoreRing.tsx         # Animated 0-10 ring
│   │   └── RatioBreakdown.tsx    # Per-ratio bars
│   ├── dashboard/
│   │   ├── BoneStructureCard.tsx
│   │   ├── SkinQualityCard.tsx
│   │   ├── ProportionCard.tsx
│   │   └── DrilldownGrid.tsx
│   ├── recommendations/
│   │   ├── IngredientCard.tsx
│   │   └── RoutineMatrix.tsx
│   └── ui/
│       ├── GlassCard.tsx
│       ├── NeonBadge.tsx
│       ├── SkeletonLoader.tsx
│       └── ProgressBar.tsx
├── lib/
│   ├── context/
│   │   ├── TelemetryContext.tsx  # Age, sex, height, weight, skin type
│   │   └── ScanContext.tsx       # Captured image + landmark data
│   ├── scoring/
│   │   ├── goldenRatio.ts        # Core deterministic scoring engine
│   │   ├── symmetry.ts           # Hemi-face delta calculation
│   │   └── boneMetrics.ts        # Gonial angle, bizygomatic scoring
│   ├── clinical/
│   │   ├── database.ts           # Mocked clinical recommendation DB
│   │   └── advisor.ts            # Cross-reference engine
│   └── faceApi/
│       └── loader.ts             # face-api.js model loader + inference
├── public/
│   └── models/                   # face-api.js TinyFaceDetector weights
└── styles/
    └── globals.css               # Obsidian palette + neon variables
```

---

## Phase Execution Order

1. **Phase 1** — Telemetry onboarding wizard (4 steps)
2. **Phase 2** — Camera viewfinder + face-api.js landmark detection
3. **Phase 3** — Golden ratio scoring engine (deterministic)
4. **Phase 4** — Drilldown dashboard (Bone / Skin / Proportion)
5. **Phase 5** — Clinical recommendation engine
6. **Phase 6** — Global UI/UX polish (glassmorphism, animations)

---

## Golden Ratio Scoring — Math Spec

```
φ = 1.618033988749895

Ratios measured (pixel-coordinate vectors):
  R1: (nasion_y - trichion_y) / (subnasale_y - nasion_y)        → ideal φ
  R2: (subnasale_y - nasion_y) / (gnathion_y - subnasale_y)     → ideal φ
  R3: intercanthal_distance / eye_width_single                   → ideal 1.0 (equal)
  R4: nose_width / mouth_width                                   → ideal 0.618

Score per ratio = max(0, 1 - |actual - ideal| / ideal) * 10
Aggregate score = weighted mean (R1×0.3, R2×0.3, R3×0.2, R4×0.2)
```

---

## Color Palette

```css
--bg-obsidian:    #0B0F19
--bg-card:        rgba(255,255,255,0.04)
--border-glass:   rgba(255,255,255,0.08)
--accent-violet:  #8B5CF6
--accent-cyan:    #06B6D4
--accent-green:   #10B981
--text-primary:   #F1F5F9
--text-muted:     #64748B
```
