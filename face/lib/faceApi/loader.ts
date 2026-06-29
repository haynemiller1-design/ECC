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

// Mean luminance (0-255) of a rectangular region of a canvas — used to estimate
// tooth shade/brightness from the inner-mouth area of the smile capture.
export function sampleRegionBrightness(
  canvas: HTMLCanvasElement,
  x: number, y: number, w: number, h: number
): number {
  const ix = Math.max(0, Math.floor(x)), iy = Math.max(0, Math.floor(y));
  const iw = Math.max(1, Math.min(canvas.width - ix, Math.floor(w)));
  const ih = Math.max(1, Math.min(canvas.height - iy, Math.floor(h)));
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  let data: Uint8ClampedArray;
  try { data = ctx.getImageData(ix, iy, iw, ih).data; } catch { return 0; }
  let sum = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    // Rec. 601 luma
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    n++;
  }
  return n ? sum / n : 0;
}
