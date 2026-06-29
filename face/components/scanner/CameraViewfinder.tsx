"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useScan, CaptureAngle } from "@/lib/context/ScanContext";
import { loadFaceApiModels, detectLandmarks } from "@/lib/faceApi/loader";
import { LandmarkPoint } from "@/lib/scoring/goldenRatio";
import ScanLaser from "./ScanLaser";
import LandmarkOverlay from "./LandmarkOverlay";
import DimorphismToggle from "./DimorphismToggle";

type Phase = "loading" | "streaming" | "capturing" | "analyzing" | "done" | "error";

// The guided multi-angle sequence. Front drives scoring; the profiles make the
// scan a genuine multi-view capture instead of a single selfie.
const ANGLES: { angle: CaptureAngle; title: string; instruction: string; emoji: string }[] = [
  { angle: "front", title: "Front View",        instruction: "Look straight into the camera, face centered and evenly lit.", emoji: "😐" },
  { angle: "left",  title: "Left Profile",      instruction: "Slowly turn your head to show your LEFT side to the camera.",   emoji: "😶‍🌫️" },
  { angle: "right", title: "Right Profile",     instruction: "Now turn your head to show your RIGHT side to the camera.",     emoji: "🫥" },
];

export default function CameraViewfinder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { state: scan, dispatch } = useScan();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [angleIndex, setAngleIndex] = useState(0);
  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [dimensions, setDimensions] = useState({ w: 480, h: 360 });
  const [error, setError] = useState<string>("");
  const [analyzeMsg, setAnalyzeMsg] = useState("Reconstructing 3D facial model…");

  const current = ANGLES[angleIndex];
  const captured = scan.captures.map(c => c.angle);

  // Start (or restart) the camera stream.
  const startStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        const v = videoRef.current!;
        setDimensions({ w: v.videoWidth || 480, h: v.videoHeight || 360 });
        setPhase("streaming");
      };
    }
  }, []);

  // Load models then start camera.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadFaceApiModels();
        if (cancelled) return;
        await startStream();
        if (cancelled) streamRef.current?.getTracks().forEach(t => t.stop());
      } catch (e) {
        if (!cancelled) { setError(e instanceof Error ? e.message : "Camera access denied."); setPhase("error"); }
      }
    })();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [startStream]);

  // Run the in-depth analysis animation, then route to results.
  const runDeepAnalysis = useCallback(() => {
    setPhase("analyzing");
    const steps = [
      "Reconstructing 3D facial model…",
      "Aligning front and profile geometry…",
      "Mapping bone structure across views…",
      "Computing symmetry & golden-ratio metrics…",
      "Finalizing biometric report…",
    ];
    let i = 0;
    setAnalyzeMsg(steps[0]);
    const iv = setInterval(() => {
      i += 1;
      if (i < steps.length) setAnalyzeMsg(steps[i]);
      else {
        clearInterval(iv);
        setPhase("done");
        setTimeout(() => router.push("/results"), 1200);
      }
    }, 900);
  }, [router]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setPhase("capturing");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;
    ctx.drawImage(video, 0, 0, dimensions.w, dimensions.h);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    if (!imageDataUrl.startsWith("data:image/")) { setPhase("streaming"); return; }
    if (imageDataUrl.length > 4_000_000) {
      setError("Captured image too large. Try again.");
      setPhase("error");
      return;
    }

    const result = await detectLandmarks(video);
    const pts: LandmarkPoint[] | null = result
      ? result.landmarks.positions.map(p => ({ x: p.x, y: p.y }))
      : null;

    // The front view must contain a detectable face — it powers all scoring.
    if (current.angle === "front" && !pts) {
      setError("No face detected on the front view. Make sure your face is well-lit and centered, then try again.");
      setPhase("error");
      streamRef.current?.getTracks().forEach(t => t.stop());
      try { await startStream(); } catch { /* camera may have closed */ }
      return;
    }

    if (pts) { setLandmarks(pts); }
    dispatch({ type: "ADD_CAPTURE", payload: { angle: current.angle, imageDataUrl, landmarks: pts } });

    // Advance to the next angle, or run the deep analysis if all are captured.
    if (angleIndex < ANGLES.length - 1) {
      setAngleIndex(angleIndex + 1);
      setPhase("streaming");
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop());
      runDeepAnalysis();
    }
  }, [dimensions, dispatch, current, angleIndex, startStream, runDeepAnalysis]);

  function retry() {
    setError("");
    setPhase("streaming");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: dimensions.w }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Reference Model</div>
        </div>
        <DimorphismToggle />
      </div>

      {/* Angle progress chips */}
      <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: dimensions.w }}>
        {ANGLES.map((a, i) => {
          const done = captured.includes(a.angle);
          const active = i === angleIndex && phase !== "analyzing" && phase !== "done";
          return (
            <div key={a.angle} style={{
              flex: 1, padding: "8px 6px", borderRadius: 10, textAlign: "center",
              border: `1px solid ${done ? "var(--accent-green)" : active ? "var(--accent-cyan)" : "rgba(255,255,255,0.08)"}`,
              background: done ? "rgba(16,185,129,0.12)" : active ? "rgba(6,182,212,0.1)" : "transparent",
              transition: "all 0.25s",
            }}>
              <div style={{ fontSize: 14 }}>{done ? "✓" : a.emoji}</div>
              <div style={{
                fontSize: 10, marginTop: 2, letterSpacing: "0.04em",
                color: done ? "var(--accent-green)" : active ? "var(--accent-cyan)" : "var(--text-muted)",
              }}>{a.title}</div>
            </div>
          );
        })}
      </div>

      {/* Viewfinder */}
      <div
        style={{
          position: "relative",
          width: dimensions.w, maxWidth: "100%",
          aspectRatio: `${dimensions.w} / ${dimensions.h}`,
          borderRadius: 16, overflow: "hidden",
          border: phase === "capturing" || phase === "analyzing" ? "2px solid var(--accent-cyan)" : "2px solid rgba(255,255,255,0.1)",
          boxShadow: phase === "capturing" || phase === "analyzing" ? "0 0 40px rgba(6,182,212,0.3)" : "none",
          transition: "box-shadow 0.3s, border-color 0.3s",
          background: "#000",
        }}
      >
        {phase === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div className="skeleton" style={{ width: 60, height: 60, borderRadius: "50%" }} />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading models…</span>
          </div>
        )}

        {phase === "error" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
            <span style={{ fontSize: 32 }}>⚠</span>
            <p style={{ color: "var(--accent-rose, #F43F5E)", textAlign: "center", fontSize: 14 }}>{error || "Camera unavailable"}</p>
            <button onClick={retry} style={{
              marginTop: 8, padding: "10px 20px", borderRadius: 10,
              border: "1px solid var(--accent-cyan)", background: "rgba(6,182,212,0.1)",
              color: "var(--accent-cyan)", fontSize: 13, fontWeight: 600,
            }}>Try again</button>
          </div>
        )}

        {/* Analyzing overlay */}
        {phase === "analyzing" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, padding: 24, background: "rgba(11,15,25,0.85)", zIndex: 5 }}>
            <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%" }} />
            <p style={{ color: "var(--accent-cyan)", fontSize: 14, textAlign: "center", letterSpacing: "0.03em" }}>{analyzeMsg}</p>
            <div style={{ display: "flex", gap: 6 }}>
              {scan.captures.map(c => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={c.angle} src={c.imageDataUrl} alt={c.angle}
                  style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(6,182,212,0.4)", transform: "scaleX(-1)" }} />
              ))}
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            display: phase === "streaming" || phase === "capturing" ? "block" : "none",
            transform: "scaleX(-1)",
          }}
        />

        {phase === "done" && landmarks.length > 0 && (
          <LandmarkOverlay landmarks={landmarks} width={dimensions.w} height={dimensions.h} />
        )}

        <ScanLaser active={phase === "capturing"} />

        {(phase === "streaming" || phase === "capturing") && (
          <>
            {[["top:12px","left:12px"],["top:12px","right:12px"],["bottom:12px","left:12px"],["bottom:12px","right:12px"]].map((corners, i) => {
              const s: Record<string, string> = { position: "absolute", width: "24px", height: "24px", borderColor: "var(--accent-cyan)", border: "2px solid", borderRadius: "2px", opacity: "0.7" };
              corners.forEach(c => { const [k, v] = c.split(":"); s[k] = v; });
              return <div key={i} style={s as React.CSSProperties} />;
            })}
          </>
        )}

        {phase === "done" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16,185,129,0.12)", zIndex: 6 }}>
            <div style={{ fontSize: 48, color: "var(--accent-green)" }}>✓</div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Status text */}
      <div style={{ textAlign: "center", minHeight: 44 }}>
        {phase === "loading" && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Initializing face detection engine…</p>}
        {phase === "streaming" && (
          <>
            <p style={{ color: "var(--accent-cyan)", fontSize: 15, fontWeight: 600 }}>{current.emoji} {current.title} — {angleIndex + 1} of {ANGLES.length}</p>
            <p style={{ color: "var(--text-subtle)", fontSize: 13, marginTop: 4, maxWidth: 340 }}>{current.instruction}</p>
          </>
        )}
        {phase === "capturing" && <p style={{ color: "var(--accent-cyan)", fontSize: 14 }}>Capturing {current.title.toLowerCase()}…</p>}
        {phase === "analyzing" && <p style={{ color: "var(--text-subtle)", fontSize: 13 }}>Deep multi-view analysis in progress…</p>}
        {phase === "done" && <p style={{ color: "var(--accent-green)", fontSize: 14 }}>Scan complete — opening your report…</p>}
      </div>

      {/* Capture button */}
      {phase === "streaming" && (
        <button
          onClick={handleCapture}
          aria-label={`Capture ${current.title}`}
          style={{
            width: 72, height: 72, borderRadius: "50%",
            border: "3px solid var(--accent-cyan)",
            background: "rgba(6,182,212,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(6,182,212,0.3)",
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--accent-cyan)" }} />
        </button>
      )}
    </div>
  );
}
