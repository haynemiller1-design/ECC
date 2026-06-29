"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useScan, CaptureAngle, TeethMetrics } from "@/lib/context/ScanContext";
import {
  loadFaceApiModels, detectLandmarks, detectLandmarksLive, sampleRegionStats, sampleVideoBrightness,
} from "@/lib/faceApi/loader";
import { computeFaceMetrics, checkTarget, POSE } from "@/lib/faceApi/pose";
import { assessLighting } from "@/lib/faceApi/quality";
import { computeTeethMetrics } from "@/lib/scoring/teeth";
import { LandmarkPoint } from "@/lib/scoring/goldenRatio";
import MeasurementLines from "./MeasurementLines";
import ScanLaser from "./ScanLaser";

type Phase = "loading" | "scanning" | "review" | "analyzing" | "done" | "error";
type TargetId = "front" | "profileA" | "profileB" | "smile";

interface Pending {
  angle: CaptureAngle;
  imageDataUrl: string;
  landmarks: LandmarkPoint[] | null;
  w: number; h: number;
  teeth?: TeethMetrics;
}

const TARGETS: { id: TargetId; title: string; emoji: string; required: number }[] = [
  { id: "front",    title: "Front",  emoji: "🙂", required: 16 }, // front: measure deliberately
  { id: "profileA", title: "Side 1", emoji: "🔄", required: 9 },
  { id: "profileB", title: "Side 2", emoji: "🔄", required: 9 },
  { id: "smile",    title: "Smile",  emoji: "😁", required: 9 },
];

const LOOP_MS = 130;
const FALLBACK_MS = 16000;

export default function CameraViewfinder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const runningRef = useRef(false);
  const busyRef = useRef(false);
  const stableRef = useRef(0);
  const targetIdxRef = useRef(0);
  const firstSignRef = useRef(0); // which way they turned for Side 1
  const loopRef = useRef<() => void>(() => {});
  const captureRef = useRef<(t: TargetId) => void>(() => {});

  const { dispatch } = useScan();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [targetIdx, setTargetIdx] = useState(0);
  const [dimensions, setDimensions] = useState({ w: 480, h: 360 });
  const [live, setLive] = useState<LandmarkPoint[] | null>(null);
  const [hint, setHint] = useState("Position your face in the frame");
  const [progress, setProgress] = useState(0); // measuring progress 0..1
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [analyzeMsg, setAnalyzeMsg] = useState("");

  const current = TARGETS[targetIdx];
  const captured = TARGETS.slice(0, targetIdx).map(t => t.id);

  // Evaluate whether the current frame satisfies the active target.
  const evaluate = useCallback((id: TargetId, m: ReturnType<typeof computeFaceMetrics>): { satisfied: boolean; hint: string } => {
    if (id === "front") return checkTarget("front", m, true);
    if (id === "smile") return checkTarget("smile", m, true);
    // Profiles: direction-agnostic — turn one way, then the other.
    if (!m.detected) return { satisfied: false, hint: "Position your face in the frame" };
    if (m.sizeRatio < POSE.SIZE_MIN * 0.75) return { satisfied: false, hint: "Move a little closer" };
    const turned = Math.abs(m.yaw) > POSE.PROFILE;
    if (id === "profileA") {
      return turned ? { satisfied: true, hint: "Hold still…" } : { satisfied: false, hint: "Slowly turn your head to one side — either way" };
    }
    // profileB: must be the opposite side to Side 1
    const sign = Math.sign(m.yaw);
    if (!turned) return { satisfied: false, hint: "Now slowly turn your head the other way" };
    if (firstSignRef.current !== 0 && sign === firstSignRef.current) {
      return { satisfied: false, hint: "That's the same side — turn the other way" };
    }
    return { satisfied: true, hint: "Hold still…" };
  }, []);

  const doCapture = useCallback(async (id: TargetId) => {
    runningRef.current = false;
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = dimensions.w, h = dimensions.h;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);

    const resume = () => { setProgress(0); stableRef.current = 0; runningRef.current = true; setPhase("scanning"); loopRef.current(); };
    if (!imageDataUrl.startsWith("data:image/") || imageDataUrl.length > 5_000_000) { resume(); return; }

    const lighting = assessLighting(sampleRegionStats(canvas, 0, 0, w, h).mean);
    if (!lighting.ok) { setHint(lighting.reason); resume(); return; }

    const result = await detectLandmarks(canvas);
    const pts: LandmarkPoint[] | null = result
      ? result.landmarks.positions.map(p => ({ x: p.x, y: p.y }))
      : (id === "front" ? null : live);
    if (id === "front" && !pts) { setHint("Couldn't lock the face — let's try again"); resume(); return; }

    // Resolve the stored angle + remember turn direction.
    let angle: CaptureAngle = "front";
    if (id === "smile") angle = "smile";
    else if (id === "profileA" || id === "profileB") {
      const yaw = pts ? computeFaceMetrics(pts, w, h).yaw : 0;
      const sign = Math.sign(yaw) || 1;
      if (id === "profileA") { firstSignRef.current = sign; angle = sign > 0 ? "right" : "left"; }
      else { angle = firstSignRef.current > 0 ? "left" : "right"; }
    }

    const next: Pending = { angle, imageDataUrl, landmarks: pts, w, h };

    if (id === "smile" && pts && pts.length >= 68) {
      const mouth = [60, 61, 62, 63, 64, 65, 66, 67].map(i => pts[i]);
      const minX = Math.min(...mouth.map(p => p.x)), maxX = Math.max(...mouth.map(p => p.x));
      const minY = Math.min(...mouth.map(p => p.y)), maxY = Math.max(...mouth.map(p => p.y));
      const teethStats = sampleRegionStats(canvas, minX, minY, maxX - minX, maxY - minY);
      const faceStats = sampleRegionStats(canvas, 0, 0, w, h);
      const faceWidth = Math.hypot(pts[15].x - pts[1].x, pts[15].y - pts[1].y);
      next.teeth = computeTeethMetrics(pts, teethStats.bright, faceStats.mean, faceWidth);
    }

    setPending(next);
    setProgress(0);
    setPhase("review");
  }, [dimensions, live]);

  const loop = useCallback(() => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    if (!video || busyRef.current) { setTimeout(() => loopRef.current(), LOOP_MS); return; }
    busyRef.current = true;

    const lighting = assessLighting(sampleVideoBrightness(video));
    if (!lighting.ok) {
      setHint(lighting.reason); stableRef.current = 0; setProgress(0);
      busyRef.current = false;
      if (runningRef.current) setTimeout(() => loopRef.current(), LOOP_MS);
      return;
    }

    detectLandmarksLive(video).then((res) => {
      const pts = res ? res.landmarks.positions.map(p => ({ x: p.x, y: p.y })) : null;
      setLive(pts);
      const id = TARGETS[targetIdxRef.current].id;
      const required = TARGETS[targetIdxRef.current].required;
      const m = computeFaceMetrics(pts, dimensions.w, dimensions.h);
      const ev = evaluate(id, m);
      setHint(ev.hint);
      if (ev.satisfied) {
        stableRef.current += 1;
        setProgress(Math.min(1, stableRef.current / required));
        if (stableRef.current >= required) { busyRef.current = false; captureRef.current(id); return; }
      } else {
        stableRef.current = 0; setProgress(0);
      }
    }).catch(() => { /* transient */ })
      .finally(() => { busyRef.current = false; if (runningRef.current) setTimeout(() => loopRef.current(), LOOP_MS); });
  }, [dimensions, evaluate]);

  useEffect(() => { loopRef.current = loop; captureRef.current = doCapture; }, [loop, doCapture]);

  const runDeepAnalysis = useCallback(() => {
    setPhase("analyzing");
    const steps = [
      "Reconstructing 3D facial model…",
      "Aligning front and profile geometry…",
      "Mapping bone structure across views…",
      "Measuring harmony, tilt & proportions…",
      "Analyzing smile & dental shade…",
      "Computing symmetry & golden-ratio metrics…",
    ];
    let i = 0; setAnalyzeMsg(steps[0]);
    const iv = setInterval(() => {
      i += 1;
      if (i < steps.length) setAnalyzeMsg(steps[i]);
      else { clearInterval(iv); setPhase("done"); setTimeout(() => router.push("/results"), 1100); }
    }, 800);
  }, [router]);

  // Confirm the reviewed capture and advance (or finish).
  const confirm = useCallback(() => {
    if (!pending) return;
    dispatch({ type: "ADD_CAPTURE", payload: { angle: pending.angle, imageDataUrl: pending.imageDataUrl, landmarks: pending.landmarks, w: pending.w, h: pending.h } });
    if (pending.teeth) dispatch({ type: "SET_TEETH", payload: pending.teeth });
    setPending(null);
    const next = targetIdxRef.current + 1;
    if (next < TARGETS.length) {
      targetIdxRef.current = next; setTargetIdx(next);
      stableRef.current = 0; setProgress(0); setShowManual(false);
      runningRef.current = true; setPhase("scanning"); loopRef.current();
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      runDeepAnalysis();
    }
  }, [pending, dispatch, runDeepAnalysis]);

  const retake = useCallback(() => {
    setPending(null);
    stableRef.current = 0; setProgress(0);
    runningRef.current = true; setPhase("scanning"); loopRef.current();
  }, []);

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
        setPhase("scanning"); runningRef.current = true; loopRef.current();
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied.");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    start();
    return () => { runningRef.current = false; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [start]);

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => setShowManual(true), FALLBACK_MS);
    return () => clearTimeout(t);
  }, [phase, targetIdx]);

  function retry() { setError(""); setShowManual(false); stableRef.current = 0; setPhase("loading"); start(); }

  const showVideo = phase === "scanning";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
      {/* Progress chips */}
      <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: dimensions.w }}>
        {TARGETS.map((t, i) => {
          const done = captured.includes(t.id);
          const active = i === targetIdx && phase !== "analyzing" && phase !== "done";
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
        border: phase === "review" ? "2px solid var(--accent-green)" : "2px solid rgba(6,182,212,0.4)",
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

        {/* Live video */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{ width: "100%", height: "100%", objectFit: "cover", display: showVideo ? "block" : "none", transform: "scaleX(-1)" }}
        />
        {phase === "scanning" && live && (
          <MeasurementLines landmarks={live} srcWidth={dimensions.w} srcHeight={dimensions.h} mirrored />
        )}
        <ScanLaser active={phase === "scanning" && progress > 0} />

        {/* Review still (mirrored to match the selfie preview) */}
        {phase === "review" && pending && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending.imageDataUrl} alt="Captured" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            {pending.landmarks && (
              <MeasurementLines landmarks={pending.landmarks} srcWidth={pending.w} srcHeight={pending.h} mirrored />
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Measuring progress bar */}
      {phase === "scanning" && (
        <div style={{ width: "100%", maxWidth: dimensions.w, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round(progress * 100)}%`, background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-green))", transition: "width 0.12s linear" }} />
        </div>
      )}

      {/* Guidance / review controls */}
      <div style={{ textAlign: "center", minHeight: 52 }}>
        {phase === "loading" && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading face engine…</p>}
        {phase === "scanning" && (
          <>
            <p style={{ color: "var(--accent-cyan)", fontSize: 15, fontWeight: 600 }}>{current.emoji} {current.title}</p>
            <p style={{ color: progress > 0 ? "var(--accent-green)" : "var(--text-subtle)", fontSize: 14, marginTop: 4, maxWidth: 320 }}>
              {progress > 0 ? "Measuring… hold still" : hint}
            </p>
          </>
        )}
        {phase === "review" && <p style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>Is this a good shot?</p>}
        {phase === "analyzing" && <p style={{ color: "var(--text-subtle)", fontSize: 13 }}>Deep multi-view analysis…</p>}
        {phase === "done" && <p style={{ color: "var(--accent-green)", fontSize: 14 }}>Scan complete — opening your report…</p>}
      </div>

      {/* Review buttons */}
      {phase === "review" && (
        <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: dimensions.w }}>
          <button onClick={retake} style={{ flex: 1, padding: "13px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "var(--text-subtle)", fontSize: 14, fontWeight: 600 }}>↺ Retake</button>
          <button onClick={confirm} style={{ flex: 2, padding: "13px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))", color: "white", fontSize: 14, fontWeight: 700 }}>✓ Use this photo</button>
        </div>
      )}

      {/* Manual fallback */}
      {phase === "scanning" && showManual && (
        <button
          onClick={() => { if (runningRef.current) captureRef.current(current.id); }}
          style={{ padding: "10px 22px", borderRadius: 999, border: "1px solid rgba(6,182,212,0.5)", background: "rgba(6,182,212,0.12)", color: "var(--accent-cyan)", fontSize: 13, fontWeight: 600 }}
        >
          Capture {current.title} now
        </button>
      )}
    </div>
  );
}
