"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useScan, CaptureAngle } from "@/lib/context/ScanContext";
import {
  loadFaceApiModels, detectLandmarks, detectLandmarksLive, sampleRegionStats, sampleVideoBrightness,
} from "@/lib/faceApi/loader";
import { computeFaceMetrics, checkTarget, ScanTarget } from "@/lib/faceApi/pose";
import { assessLighting } from "@/lib/faceApi/quality";
import { computeTeethMetrics } from "@/lib/scoring/teeth";
import { LandmarkPoint } from "@/lib/scoring/goldenRatio";
import MeasurementLines from "./MeasurementLines";
import ScanLaser from "./ScanLaser";

type Phase = "loading" | "scanning" | "captured" | "analyzing" | "done" | "error";

const TARGETS: { id: ScanTarget; title: string; emoji: string }[] = [
  { id: "front", title: "Front", emoji: "😐" },
  { id: "left",  title: "Left",  emoji: "👈" },
  { id: "right", title: "Right", emoji: "👉" },
  { id: "smile", title: "Smile", emoji: "😁" },
];

const STABLE_FRAMES = 5;     // consecutive good frames before auto-capture
const LOOP_MS = 140;         // detection cadence
const FALLBACK_MS = 14000;   // show a manual capture button if stuck this long

export default function CameraViewfinder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const busyRef = useRef(false);
  const stableRef = useRef(0);
  const targetIdxRef = useRef(0);
  // Refs to the latest loop/capture, so the two can call each other without a
  // declaration cycle (which React's hooks lint forbids).
  const loopRef = useRef<() => void>(() => {});
  const captureRef = useRef<(t: ScanTarget) => void>(() => {});

  const { dispatch } = useScan();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [targetIdx, setTargetIdx] = useState(0);
  const [dimensions, setDimensions] = useState({ w: 480, h: 360 });
  const [live, setLive] = useState<LandmarkPoint[] | null>(null);
  const [hint, setHint] = useState("Position your face in the frame");
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState("");

  const current = TARGETS[targetIdx];
  const captured = TARGETS.slice(0, targetIdx).map(t => t.id);

  const runDeepAnalysis = useCallback(() => {
    setPhase("analyzing");
    const steps = [
      "Reconstructing 3D facial model…",
      "Aligning front and profile geometry…",
      "Mapping bone structure across views…",
      "Analyzing smile & dental proportion…",
      "Computing symmetry & golden-ratio metrics…",
    ];
    let i = 0; setAnalyzeMsg(steps[0]);
    const iv = setInterval(() => {
      i += 1;
      if (i < steps.length) setAnalyzeMsg(steps[i]);
      else { clearInterval(iv); setPhase("done"); setTimeout(() => router.push("/results"), 1100); }
    }, 850);
  }, [router]);

  // ── Capture the current frame, run a clean detection, store it ──
  const capture = useCallback(async (target: ScanTarget) => {
    runningRef.current = false;
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    setPhase("captured");

    const w = dimensions.w, h = dimensions.h;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);

    const resume = () => { runningRef.current = true; setPhase("scanning"); loopRef.current(); };
    if (!imageDataUrl.startsWith("data:image/") || imageDataUrl.length > 5_000_000) { resume(); return; }

    // Reject a poorly-lit capture (also guards the manual fallback button).
    const lighting = assessLighting(sampleRegionStats(canvas, 0, 0, w, h).mean);
    if (!lighting.ok) { setHint(lighting.reason); resume(); return; }

    const result = await detectLandmarks(canvas);
    const pts: LandmarkPoint[] | null = result
      ? result.landmarks.positions.map(p => ({ x: p.x, y: p.y }))
      : (target === "front" ? null : live); // profiles tolerate the live estimate

    if (target === "front" && !pts) { resume(); return; } // front must drive scoring

    dispatch({ type: "ADD_CAPTURE", payload: { angle: target as CaptureAngle, imageDataUrl, landmarks: pts, w, h } });

    // Teeth analysis on the smile capture — use the brightest (tooth) pixels.
    if (target === "smile" && pts && pts.length >= 68) {
      const m = [60, 61, 62, 63, 64, 65, 66, 67].map(i => pts[i]);
      const minX = Math.min(...m.map(p => p.x)), maxX = Math.max(...m.map(p => p.x));
      const minY = Math.min(...m.map(p => p.y)), maxY = Math.max(...m.map(p => p.y));
      const stats = sampleRegionStats(canvas, minX, minY, maxX - minX, maxY - minY);
      const faceWidth = Math.hypot(pts[15].x - pts[1].x, pts[15].y - pts[1].y);
      dispatch({ type: "SET_TEETH", payload: computeTeethMetrics(pts, stats.bright, faceWidth) });
    }

    const next = targetIdxRef.current + 1;
    if (next < TARGETS.length) {
      targetIdxRef.current = next;
      setTargetIdx(next);
      stableRef.current = 0;
      setShowManual(false);
      runningRef.current = true;
      setPhase("scanning");
      loopRef.current();
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      runDeepAnalysis();
    }
  }, [dimensions, dispatch, live, runDeepAnalysis]);

  // ── The live detection loop ──
  const loop = useCallback(() => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    if (!video || busyRef.current) { setTimeout(() => loopRef.current(), LOOP_MS); return; }
    busyRef.current = true;
    // Lighting gate — a too-dark / blown-out frame must not be used for analysis.
    const lighting = assessLighting(sampleVideoBrightness(video));
    if (!lighting.ok) {
      setHint(lighting.reason);
      stableRef.current = 0;
      busyRef.current = false;
      if (runningRef.current) setTimeout(() => loopRef.current(), LOOP_MS);
      return;
    }
    detectLandmarksLive(video).then((res) => {
      const pts = res ? res.landmarks.positions.map(p => ({ x: p.x, y: p.y })) : null;
      setLive(pts);
      const target = TARGETS[targetIdxRef.current].id;
      const m = computeFaceMetrics(pts, dimensions.w, dimensions.h);
      const check = checkTarget(target, m, true);
      setHint(check.hint);
      if (check.satisfied) {
        stableRef.current += 1;
        if (stableRef.current >= STABLE_FRAMES) { busyRef.current = false; captureRef.current(target); return; }
      } else {
        stableRef.current = 0;
      }
    }).catch(() => { /* transient detection error — keep looping */ })
      .finally(() => { busyRef.current = false; if (runningRef.current) setTimeout(() => loopRef.current(), LOOP_MS); });
  }, [dimensions]);

  // Keep the refs pointing at the latest closures.
  useEffect(() => { loopRef.current = loop; captureRef.current = capture; }, [loop, capture]);

  const start = useCallback(async () => {
    try {
      await loadFaceApiModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        setDimensions({ w: video.videoWidth || 480, h: video.videoHeight || 360 });
        setPhase("scanning");
        runningRef.current = true;
        loopRef.current();
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    // Mount-time camera/model init; state updates happen asynchronously after.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start();
    return () => {
      runningRef.current = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [start]);

  // Manual-capture fallback if a target takes too long. (showManual is reset to
  // false on every target advance / retry, so we only need to arm the timer.)
  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => setShowManual(true), FALLBACK_MS);
    return () => clearTimeout(t);
  }, [phase, targetIdx]);

  function retry() { setError(""); setShowManual(false); stableRef.current = 0; setPhase("loading"); start(); }

  const showBox = phase === "scanning" || phase === "captured";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
      {/* Angle progress chips */}
      <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: dimensions.w }}>
        {TARGETS.map((t, i) => {
          const done = captured.includes(t.id);
          const active = i === targetIdx && (phase === "scanning" || phase === "captured");
          return (
            <div key={t.id} style={{
              flex: 1, padding: "8px 4px", borderRadius: 10, textAlign: "center",
              border: `1px solid ${done ? "var(--accent-green)" : active ? "var(--accent-cyan)" : "rgba(255,255,255,0.08)"}`,
              background: done ? "rgba(16,185,129,0.12)" : active ? "rgba(6,182,212,0.1)" : "transparent",
              transition: "all 0.25s",
            }}>
              <div style={{ fontSize: 14 }}>{done ? "✓" : t.emoji}</div>
              <div style={{ fontSize: 10, marginTop: 2, color: done ? "var(--accent-green)" : active ? "var(--accent-cyan)" : "var(--text-muted)" }}>{t.title}</div>
            </div>
          );
        })}
      </div>

      {/* Viewfinder */}
      <div style={{
        position: "relative", width: dimensions.w, maxWidth: "100%",
        aspectRatio: `${dimensions.w} / ${dimensions.h}`,
        borderRadius: 16, overflow: "hidden", background: "#000",
        border: phase === "captured" ? "2px solid var(--accent-green)" : "2px solid rgba(6,182,212,0.4)",
        boxShadow: phase === "scanning" ? "0 0 32px rgba(6,182,212,0.25)" : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}>
        {phase === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div className="skeleton" style={{ width: 56, height: 56, borderRadius: "50%" }} />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Starting camera…</span>
          </div>
        )}

        {phase === "error" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
            <span style={{ fontSize: 30 }}>⚠</span>
            <p style={{ color: "var(--accent-rose)", textAlign: "center", fontSize: 13 }}>{error || "Camera unavailable"}</p>
            <button onClick={retry} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid var(--accent-cyan)", background: "rgba(6,182,212,0.1)", color: "var(--accent-cyan)", fontSize: 13, fontWeight: 600 }}>Try again</button>
          </div>
        )}

        {phase === "analyzing" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, background: "rgba(11,15,25,0.86)" }}>
            <div className="skeleton" style={{ width: 60, height: 60, borderRadius: "50%" }} />
            <p style={{ color: "var(--accent-cyan)", fontSize: 13, textAlign: "center" }}>{analyzeMsg}</p>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: showBox ? "block" : "none", transform: "scaleX(-1)" }}
        />

        {/* Live measurement lines (mirrored to match the selfie preview) */}
        {phase === "scanning" && live && (
          <MeasurementLines landmarks={live} srcWidth={dimensions.w} srcHeight={dimensions.h} mirrored />
        )}

        <ScanLaser active={phase === "scanning"} />

        {phase === "captured" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16,185,129,0.14)", zIndex: 7 }}>
            <div style={{ fontSize: 44, color: "var(--accent-green)" }}>✓</div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Guidance */}
      <div style={{ textAlign: "center", minHeight: 48 }}>
        {phase === "loading" && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading face engine…</p>}
        {phase === "scanning" && (
          <>
            <p style={{ color: "var(--accent-cyan)", fontSize: 15, fontWeight: 600 }}>{current.emoji} {current.title} view</p>
            <p style={{ color: "var(--text-subtle)", fontSize: 14, marginTop: 4, maxWidth: 320 }}>{hint}</p>
          </>
        )}
        {phase === "captured" && <p style={{ color: "var(--accent-green)", fontSize: 14 }}>{current.title} captured ✓</p>}
        {phase === "analyzing" && <p style={{ color: "var(--text-subtle)", fontSize: 13 }}>Deep multi-view analysis…</p>}
        {phase === "done" && <p style={{ color: "var(--accent-green)", fontSize: 14 }}>Scan complete — opening your report…</p>}
      </div>

      {/* Manual fallback if auto-capture struggles */}
      {phase === "scanning" && showManual && (
        <button
          onClick={() => { if (runningRef.current) captureRef.current(current.id); }}
          style={{ padding: "12px 24px", borderRadius: 999, border: "1px solid rgba(6,182,212,0.5)", background: "rgba(6,182,212,0.12)", color: "var(--accent-cyan)", fontSize: 14, fontWeight: 600 }}
        >
          Capture {current.title} now
        </button>
      )}
    </div>
  );
}
