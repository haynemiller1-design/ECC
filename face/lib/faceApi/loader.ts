"use client";

// face-api.js model loader. Models are served from /public/models/.
// Returns a boolean indicating whether models are loaded.

let modelsLoaded = false;

export async function loadFaceApiModels(): Promise<void> {
  if (modelsLoaded) return;

  // Dynamic import so face-api.js doesn't load server-side
  const faceapi = await import("face-api.js");

  const MODEL_URL = "/models";
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
}

export async function detectLandmarks(
  videoEl: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
) {
  const faceapi = await import("face-api.js");
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
  const result = await faceapi
    .detectSingleFace(videoEl, options)
    .withFaceLandmarks(true);
  return result ?? null;
}

// Lighter, faster detection for the real-time scanning loop (smaller input size).
export async function detectLandmarksLive(
  videoEl: HTMLVideoElement | HTMLCanvasElement
) {
  const faceapi = await import("face-api.js");
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
  const result = await faceapi
    .detectSingleFace(videoEl, options)
    .withFaceLandmarks(true);
  return result ?? null;
}

export interface RegionStats {
  mean: number;     // mean luma 0-255
  bright: number;   // mean of the brightest ~25% of pixels (≈ the teeth)
  count: number;    // pixels sampled
}

// Luma statistics of a rectangular region of a canvas. `bright` isolates the
// lightest pixels (the teeth) rather than averaging in lips/shadows/gums.
export function sampleRegionStats(
  canvas: HTMLCanvasElement,
  x: number, y: number, w: number, h: number
): RegionStats {
  const ix = Math.max(0, Math.floor(x)), iy = Math.max(0, Math.floor(y));
  const iw = Math.max(1, Math.min(canvas.width - ix, Math.floor(w)));
  const ih = Math.max(1, Math.min(canvas.height - iy, Math.floor(h)));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { mean: 0, bright: 0, count: 0 };
  let data: Uint8ClampedArray;
  try { data = ctx.getImageData(ix, iy, iw, ih).data; } catch { return { mean: 0, bright: 0, count: 0 }; }
  const lumas: number[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lumas.push(l); sum += l;
  }
  const n = lumas.length || 1;
  lumas.sort((a, b) => a - b);
  const topStart = Math.floor(lumas.length * 0.75);
  let bsum = 0, bn = 0;
  for (let i = topStart; i < lumas.length; i++) { bsum += lumas[i]; bn++; }
  return { mean: sum / n, bright: bn ? bsum / bn : sum / n, count: n };
}

import type { LandmarkPoint } from "@/lib/scoring/goldenRatio";
import type { RegionSignal, NamedRegion } from "@/lib/scoring/skinAnalysis";

// Extract skin signals (redness, lesion/spot density, dark marks, oil shine)
// from a rectangular skin patch of the captured photo.
export function sampleSkinSignal(canvas: HTMLCanvasElement, x: number, y: number, w: number, h: number): RegionSignal {
  const empty: RegionSignal = { redness: 0, spotDensity: 0, darkSpots: 0, shine: 0 };
  const ix = Math.max(0, Math.floor(x)), iy = Math.max(0, Math.floor(y));
  const iw = Math.floor(Math.min(canvas.width - ix, w)), ih = Math.floor(Math.min(canvas.height - iy, h));
  if (iw < 6 || ih < 6) return empty;
  const ctx = canvas.getContext("2d");
  if (!ctx) return empty;
  let data: Uint8ClampedArray;
  try { data = ctx.getImageData(ix, iy, iw, ih).data; } catch { return empty; }

  const n = data.length / 4;
  const lumas = new Float32Array(n), reds = new Float32Array(n);
  let rSum = 0, shine = 0;
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const R = data[i], G = data[i + 1], B = data[i + 2];
    const luma = 0.299 * R + 0.587 * G + 0.114 * B;
    const redness = R - (G + B) / 2;
    lumas[j] = luma; reds[j] = redness; rSum += Math.max(0, redness);
    if (luma > 235) shine++;
  }
  const sortedL = Float32Array.from(lumas).sort();
  const sortedR = Float32Array.from(reds).sort();
  const medL = sortedL[Math.floor(n / 2)], medR = sortedR[Math.floor(n / 2)];

  let spot = 0, dark = 0;
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const R = data[i], G = data[i + 1], B = data[i + 2];
    const inflamed = reds[j] > medR + 16 && reds[j] > 8;
    const bump = lumas[j] < medL - 26 && lumas[j] < 235;
    if (inflamed || bump) spot++;
    if (lumas[j] < medL - 18 && R > G && G >= B && reds[j] < medR + 14) dark++;
  }
  return {
    redness: Math.max(0, Math.min(1, (rSum / n) / 40)),
    spotDensity: spot / n,
    darkSpots: dark / n,
    shine: shine / n,
  };
}

// Build the named skin regions (forehead, cheeks, nose, chin) from landmarks and
// sample each — ready to hand to analyzeSkin().
export function sampleSkinRegions(canvas: HTMLCanvasElement, p: LandmarkPoint[]): NamedRegion[] {
  if (!p || p.length < 68) return [];
  const browTop = Math.min(p[19].y, p[24].y);
  const faceH = Math.max(40, p[8].y - browTop);
  const out: NamedRegion[] = [];
  const add = (name: string, x1: number, y1: number, x2: number, y2: number) => {
    const x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.abs(x2 - x1), hh = Math.abs(y2 - y1);
    if (w >= 6 && hh >= 6) out.push({ name, signal: sampleSkinSignal(canvas, x, y, w, hh) });
  };
  add("forehead", p[19].x, browTop - faceH * 0.34, p[24].x, browTop - faceH * 0.06);
  add("left cheek", p[2].x, p[41].y + 4, p[31].x - 4, p[48].y);
  add("right cheek", p[35].x + 4, p[46].y + 4, p[14].x, p[54].y);
  add("nose", p[31].x, p[28].y, p[35].x, p[33].y);
  add("chin", p[48].x, p[57].y + 6, p[54].x, p[8].y);
  return out;
}

// Mean luma (0-255) of a downscaled video frame — a cheap lighting probe for the
// live loop. Reuses one small offscreen canvas.
let probeCanvas: HTMLCanvasElement | null = null;
export function sampleVideoBrightness(video: HTMLVideoElement, w = 64, h = 48): number {
  if (typeof document === "undefined") return 0;
  if (!probeCanvas) probeCanvas = document.createElement("canvas");
  probeCanvas.width = w; probeCanvas.height = h;
  const ctx = probeCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;
  try {
    ctx.drawImage(video, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    return sum / (data.length / 4);
  } catch { return 0; }
}
