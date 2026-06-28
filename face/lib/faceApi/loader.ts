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
