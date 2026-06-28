#!/usr/bin/env node
// Downloads face-api.js TinyFaceDetector + FaceLandmark68Tiny weights
// to public/models/ for local serving.
// Run: node scripts/download-models.js

const https = require("https");
const fs = require("fs");
const path = require("path");

const BASE = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
const OUT = path.join(__dirname, "../public/models");

const FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_landmark_68_tiny_model-weights_manifest.json",
  "face_landmark_68_tiny_model-shard1",
];

function download(file) {
  return new Promise((resolve, reject) => {
    const dest = path.join(OUT, file);
    if (fs.existsSync(dest)) { console.log(`  skip  ${file}`); return resolve(); }
    const out = fs.createWriteStream(dest);
    https.get(`${BASE}/${file}`, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${file}`));
      res.pipe(out);
      out.on("finish", () => { out.close(); console.log(`  ✓     ${file}`); resolve(); });
    }).on("error", reject);
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  console.log("Downloading face-api.js model weights...");
  for (const file of FILES) await download(file);
  console.log("Done. Models in public/models/");
})();
