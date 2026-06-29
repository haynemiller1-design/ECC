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
