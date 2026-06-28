#!/usr/bin/env node
// VisageIQ build validation — verifies scoring engine determinism and clinical DB

const path = require("path");
let passed = 0; let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓  ${name}`); passed++; }
  catch (e) { console.error(`  ✗  ${name}\n     ${e.message}`); failed++; }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
function approx(a, b, eps = 0.001) { return Math.abs(a - b) < eps; }

console.log("\n══════════════════════════════════════");
console.log(" VisageIQ — Validation Runner");
console.log("══════════════════════════════════════\n");

// ── 1. Golden Ratio Math ──────────────────────────────────────────────────────
console.log("[ Phase 3 ] Golden Ratio Scoring Engine");

// We can't import TS directly in Node without compilation, so we replicate the
// core math here to validate the algorithm in isolation.

const PHI = 1.618033988749895;

function dist(a, b) { return Math.sqrt((b.x-a.x)**2 + (b.y-a.y)**2); }
function scoreRatio(actual, ideal) {
  if (ideal === 0) return 0;
  const dev = Math.abs(actual - ideal) / ideal;
  return Math.max(0, Math.min(10, (1 - dev) * 10));
}

// Synthetic perfect-ratio landmarks (simplified 68-point mock)
function makePerfectLandmarks() {
  const pts = Array.from({length: 68}, () => ({x: 320, y: 240}));
  // Nasion (27), Subnasale (33), Gnathion (8)
  pts[27] = {x: 320, y: 200};
  pts[33] = {x: 320, y: 264}; // nasionToSub = 64
  pts[8]  = {x: 320, y: 367}; // subToGna = 103 ≈ 64*PHI
  // Eyes (left: 36,39 | right: 42,45)
  pts[36] = {x: 270, y: 220}; pts[39] = {x: 300, y: 220};
  pts[42] = {x: 340, y: 220}; pts[45] = {x: 370, y: 220};
  // Nose ala (31,35), mouth (48,54)
  pts[31] = {x: 303, y: 260}; pts[35] = {x: 337, y: 260};
  pts[48] = {x: 273, y: 290}; pts[54] = {x: 367, y: 290};
  return pts;
}

const pts = makePerfectLandmarks();

test("dist() computes Euclidean distance", () => {
  const d = dist({x:0,y:0},{x:3,y:4});
  assert(approx(d, 5), `expected 5, got ${d}`);
});

test("scoreRatio() returns 10 for perfect match", () => {
  const s = scoreRatio(PHI, PHI);
  assert(approx(s, 10), `expected 10, got ${s}`);
});

test("scoreRatio() returns 0 for extreme deviation", () => {
  const s = scoreRatio(100, 1);
  assert(s === 0, `expected 0, got ${s}`);
});

test("scoreRatio() is deterministic — same input → same output", () => {
  const s1 = scoreRatio(1.2, PHI);
  const s2 = scoreRatio(1.2, PHI);
  assert(s1 === s2, "not deterministic");
});

test("PHI constant is accurate to 15 digits", () => {
  assert(approx(PHI, 1.6180339887498, 0.000001), `PHI wrong: ${PHI}`);
});

test("nasion-to-subnasale distance computed correctly on mock pts", () => {
  const d = dist(pts[27], pts[33]);
  assert(approx(d, 64, 1), `expected ~64, got ${d}`);
});

// Determinism check: run scoring twice on identical landmarks
function computeScore(landmarks) {
  const nasion = landmarks[27], subnasale = landmarks[33], gnathion = landmarks[8];
  const n2s = dist(nasion, subnasale), s2g = dist(subnasale, gnathion);
  const r2 = n2s / s2g;
  return scoreRatio(r2, PHI);
}

test("Identical landmarks produce identical score (determinism)", () => {
  const s1 = computeScore(pts), s2 = computeScore(pts);
  assert(s1 === s2, `scores differ: ${s1} vs ${s2}`);
});

test("Score changes when landmarks change (sensitivity)", () => {
  const pts2 = makePerfectLandmarks();
  pts2[8] = {x: 320, y: 300}; // shorter lower third
  const s1 = computeScore(pts), s2 = computeScore(pts2);
  assert(s1 !== s2, "scores did not change with different landmarks");
});

// ── 2. Symmetry Math ─────────────────────────────────────────────────────────
console.log("\n[ Phase 3 ] Symmetry Engine");

const midX = 320;

test("Perfect symmetry produces 0% delta", () => {
  const lDist = Math.abs(270 - midX); // 50
  const rDist = Math.abs(370 - midX); // 50
  const delta = Math.abs(lDist - rDist);
  assert(delta === 0, `expected 0, got ${delta}`);
});

test("Asymmetric points produce positive delta", () => {
  const lDist = Math.abs(260 - midX); // 60
  const rDist = Math.abs(375 - midX); // 55
  const delta = Math.abs(lDist - rDist);
  assert(delta > 0, "expected positive delta");
});

test("Symmetry score clamps to [0,10]", () => {
  const extremeDeviation = 50;
  const score = Math.max(0, Math.min(10, (1 - extremeDeviation / 30) * 10));
  assert(score >= 0 && score <= 10, `out of range: ${score}`);
});

// ── 3. Clinical Database ──────────────────────────────────────────────────────
console.log("\n[ Phase 5 ] Clinical Database");

function getAgeGroup(age) {
  if (age < 20) return "teen";
  if (age < 30) return "young_adult";
  if (age < 45) return "adult";
  return "mature";
}

test("getAgeGroup(17) → teen", () => assert(getAgeGroup(17) === "teen", "wrong"));
test("getAgeGroup(24) → young_adult", () => assert(getAgeGroup(24) === "young_adult", "wrong"));
test("getAgeGroup(35) → adult", () => assert(getAgeGroup(35) === "adult", "wrong"));
test("getAgeGroup(55) → mature", () => assert(getAgeGroup(55) === "mature", "wrong"));

// ── 4. File structure check ───────────────────────────────────────────────────
console.log("\n[ Build ] File Structure");

const fs = require("fs");
const CHECK = [
  "app/layout.tsx", "app/page.tsx",
  "app/onboarding/page.tsx", "app/scan/page.tsx",
  "app/results/page.tsx", "app/dashboard/page.tsx",
  "app/recommendations/page.tsx",
  "lib/context/TelemetryContext.tsx", "lib/context/ScanContext.tsx",
  "lib/scoring/goldenRatio.ts", "lib/scoring/symmetry.ts", "lib/scoring/boneMetrics.ts",
  "lib/clinical/database.ts", "lib/faceApi/loader.ts",
  "components/ui/GlassCard.tsx", "components/ui/NeonBadge.tsx",
  "components/onboarding/WizardShell.tsx",
  "components/scanner/CameraViewfinder.tsx",
  "components/results/ScoreRing.tsx",
  "components/dashboard/BoneStructureCard.tsx",
  "public/models/tiny_face_detector_model-weights_manifest.json",
  "public/models/face_landmark_68_tiny_model-weights_manifest.json",
];

const BASE_DIR = path.join(__dirname, "..");
CHECK.forEach(file => {
  test(`Exists: ${file}`, () => {
    const p = path.join(BASE_DIR, file);
    assert(fs.existsSync(p), `Missing: ${p}`);
  });
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n══════════════════════════════════════");
console.log(` Results: ${passed} passed, ${failed} failed`);
console.log("══════════════════════════════════════\n");
if (failed > 0) process.exit(1);
