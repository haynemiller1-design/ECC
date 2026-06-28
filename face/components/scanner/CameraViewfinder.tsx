"use client";
import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useScan } from "@/lib/context/ScanContext";
import { loadFaceApiModels, detectLandmarks } from "@/lib/faceApi/loader";
import { LandmarkPoint } from "@/lib/scoring/goldenRatio";
import ScanLaser from "./ScanLaser";
import LandmarkOverlay from "./LandmarkOverlay";
import DimorphismToggle from "./DimorphismToggle";

type Phase = "loading" | "streaming" | "scanning" | "done" | "error";

export default function CameraViewfinder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { dispatch } = useScan();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [landmarks, setLandmarks] = useState<LandmarkPoint[]>([]);
  const [dimensions, setDimensions] = useState({ w: 480, h: 360 });
  const [error, setError] = useState<string>("");

  // Load models then start camera
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadFaceApiModels();
        if (cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          // Explicitly disable audio — this app only needs video for facial analysis.
          // Without audio: false some browser/OS combos may prompt for mic access.
          audio: false,
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            const v = videoRef.current!;
            setDimensions({ w: v.videoWidth || 480, h: v.videoHeight || 360 });
            setPhase("streaming");
          };
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Camera access denied.");
        setPhase("error");
      }
    })();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setPhase("scanning");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;
    ctx.drawImage(video, 0, 0, dimensions.w, dimensions.h);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    // Guard: only store genuine canvas-originated data: URLs (never http/blob from external source)
    if (!imageDataUrl.startsWith("data:image/")) return;
    // Size guard: reject suspiciously large captures (>4 MB base64 ≈ ~3 MB binary)
    if (imageDataUrl.length > 4_000_000) {
      setError("Captured image too large. Try again.");
      setPhase("error");
      return;
    }
    dispatch({ type: "SET_IMAGE", payload: imageDataUrl });

    // Detect landmarks on captured frame
    const result = await detectLandmarks(video);
    if (result) {
      const pts = result.landmarks.positions.map(p => ({ x: p.x, y: p.y }));
      setLandmarks(pts);
      dispatch({ type: "SET_LANDMARKS", payload: pts });
    }

    // Stop stream
    streamRef.current?.getTracks().forEach(t => t.stop());
    setPhase("done");
    setTimeout(() => router.push("/results"), 1800);
  }, [dimensions, dispatch, router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      {/* Dimorphism toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: dimensions.w }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Dimorphism Matrix</div>
        </div>
        <DimorphismToggle />
      </div>

      {/* Viewfinder */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: dimensions.w, height: dimensions.h,
          borderRadius: 16, overflow: "hidden",
          border: phase === "scanning" ? "2px solid var(--accent-cyan)" : "2px solid rgba(255,255,255,0.1)",
          boxShadow: phase === "scanning" ? "0 0 40px rgba(6,182,212,0.3)" : "none",
          transition: "box-shadow 0.3s, border-color 0.3s",
          background: "#000",
        }}
      >
        {/* Loading state */}
        {phase === "loading" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div className="skeleton" style={{ width: 60, height: 60, borderRadius: "50%" }} />
            <span style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading models…</span>
          </div>
        )}

        {/* Error state */}
        {phase === "error" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
            <span style={{ fontSize: 32 }}>⚠</span>
            <p style={{ color: "var(--accent-rose, #F43F5E)", textAlign: "center", fontSize: 14 }}>{error || "Camera unavailable"}</p>
          </div>
        )}

        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            display: phase === "streaming" || phase === "scanning" ? "block" : "none",
            transform: "scaleX(-1)", // mirror for selfie feel
          }}
        />

        {/* Landmark overlay */}
        {phase === "done" && landmarks.length > 0 && (
          <LandmarkOverlay landmarks={landmarks} width={dimensions.w} height={dimensions.h} />
        )}

        {/* Scan laser */}
        <ScanLaser active={phase === "scanning"} />

        {/* Corner brackets */}
        {(phase === "streaming" || phase === "scanning") && (
          <>
            {[["top:12px","left:12px","border-top:2px solid","border-left:2px solid"],
              ["top:12px","right:12px","border-top:2px solid","border-right:2px solid"],
              ["bottom:12px","left:12px","border-bottom:2px solid","border-left:2px solid"],
              ["bottom:12px","right:12px","border-bottom:2px solid","border-right:2px solid"]].map((corners, i) => {
              const s: Record<string, string> = { position: "absolute", width: "24px", height: "24px", borderColor: "var(--accent-cyan)" };
              corners.forEach(c => { const [k, v] = c.split(":"); s[k.replace(/-([a-z])/g, (_, l) => l.toUpperCase())] = v; });
              return <div key={i} style={s as React.CSSProperties} />;
            })}
          </>
        )}

        {/* Done checkmark */}
        {phase === "done" && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(6,182,212,0.1)" }}>
            <div style={{ fontSize: 48, color: "var(--accent-cyan)" }}>✓</div>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Status text */}
      <div style={{ textAlign: "center" }}>
        {phase === "loading" && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Initializing biometric engine…</p>}
        {phase === "streaming" && <p style={{ color: "var(--text-subtle)", fontSize: 14 }}>Center your face in the frame. Ensure even lighting.</p>}
        {phase === "scanning" && <p style={{ color: "var(--accent-cyan)", fontSize: 14 }}>Scanning landmark mesh…</p>}
        {phase === "done" && <p style={{ color: "var(--accent-green)", fontSize: 14 }}>Scan complete — computing metrics…</p>}
        {phase === "error" && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Grant camera permission and refresh.</p>}
      </div>

      {/* Capture button */}
      {phase === "streaming" && (
        <button
          onClick={handleCapture}
          style={{
            width: 72, height: 72, borderRadius: "50%",
            border: "3px solid var(--accent-cyan)",
            background: "rgba(6,182,212,0.1)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(6,182,212,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(6,182,212,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(6,182,212,0.3)"; }}
        >
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--accent-cyan)" }} />
        </button>
      )}
    </div>
  );
}
