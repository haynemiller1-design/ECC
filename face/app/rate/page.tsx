"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useScan } from "@/lib/context/ScanContext";
import { loadFaceApiModels, detectLandmarks, sampleRegionStats } from "@/lib/faceApi/loader";
import { computeFaceMetrics } from "@/lib/faceApi/pose";
import { computeTeethMetrics } from "@/lib/scoring/teeth";
import GlassCard from "@/components/ui/GlassCard";

type Phase = "intro" | "analyzing" | "error";

const CAVEATS = [
  "A single photo can't capture the side and angle views a live scan uses, so structural scores are rough.",
  "If the teeth aren't clearly visible (no smile), the smile/teeth analysis is skipped.",
  "Poor or uneven lighting, filters, low resolution, or a tilted head all reduce accuracy.",
  "This is an aesthetic estimate for fun — not a medical, dental, or psychological assessment.",
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

export default function RatePhotoPage() {
  const router = useRouter();
  const { dispatch } = useScan();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("intro");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [msg, setMsg] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg("Please choose an image file."); setPhase("error"); return; }

    setPhase("analyzing"); setMsg("Loading face engine…");
    try {
      await loadFaceApiModels();
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      URL.revokeObjectURL(url);

      const maxDim = 1024;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("canvas unavailable");
      ctx.drawImage(img, 0, 0, w, h);

      setMsg("Detecting face…");
      const result = await detectLandmarks(canvas);
      if (!result) {
        setMsg("No face detected. Use a clear, front-facing photo where the whole face is visible.");
        setPhase("error"); return;
      }
      const pts = result.landmarks.positions.map(p => ({ x: p.x, y: p.y }));
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);

      // Store as the primary capture (clears any prior scan first).
      dispatch({ type: "RESET" });
      dispatch({ type: "SET_DIMORPHISM", payload: sex });
      dispatch({ type: "ADD_CAPTURE", payload: { angle: "front", imageDataUrl, landmarks: pts, w, h } });

      // Teeth only when a smile actually shows teeth.
      const m = computeFaceMetrics(pts, w, h);
      const faceStats = sampleRegionStats(canvas, 0, 0, w, h);
      if (m.mouthOpenRatio > 0.1 && m.smileCurve > 0.03) {
        const mouth = [60, 61, 62, 63, 64, 65, 66, 67].map(i => pts[i]);
        const minX = Math.min(...mouth.map(p => p.x)), maxX = Math.max(...mouth.map(p => p.x));
        const minY = Math.min(...mouth.map(p => p.y)), maxY = Math.max(...mouth.map(p => p.y));
        const stats = sampleRegionStats(canvas, minX, minY, maxX - minX, maxY - minY);
        const faceWidth = Math.hypot(pts[15].x - pts[1].x, pts[15].y - pts[1].y);
        dispatch({ type: "SET_TEETH", payload: computeTeethMetrics(pts, stats.bright, faceStats.mean, faceWidth) });
      }

      router.push("/results");
    } catch {
      setMsg("Couldn't analyze that photo. Try a different, clearer one.");
      setPhase("error");
    }
  }

  return (
    <div style={{
      minHeight: "100dvh", width: "100%", maxWidth: "100%", overflowX: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "72px 20px 40px", background: "var(--bg-obsidian)", boxSizing: "border-box",
    }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
          VisageIQ · Photo Rating
        </p>
        <h1 style={{
          fontSize: 26, fontWeight: 700,
          background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
        }}>
          Rate a Photo
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: 8, fontSize: 14, maxWidth: 380 }}>
          Analyze a photo of someone (or yourself). Works best with a clear, well-lit, front-facing face.
        </p>
      </div>

      <GlassCard style={{ width: "100%", maxWidth: 460, padding: 24 }} glow="violet">
        {phase === "analyzing" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 0" }}>
            <div className="skeleton" style={{ width: 56, height: 56, borderRadius: "50%" }} />
            <p style={{ color: "var(--accent-cyan)", fontSize: 14 }}>{msg}</p>
          </div>
        ) : phase === "error" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "8px 0" }}>
            <span style={{ fontSize: 30 }}>⚠</span>
            <p style={{ color: "var(--accent-rose)", fontSize: 14, textAlign: "center", lineHeight: 1.6 }}>{msg}</p>
            <button onClick={() => setPhase("intro")} style={btnPrimary}>Back</button>
          </div>
        ) : (
          <>
            {/* Accuracy disclaimer — shown before any analysis */}
            <div style={{ padding: "12px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 10, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#F59E0B", marginBottom: 8 }}>
                Heads up — accuracy may be limited
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {CAVEATS.map((c, i) => (
                  <li key={i} style={{ fontSize: 12, color: "var(--text-subtle)", lineHeight: 1.5, display: "flex", gap: 8 }}>
                    <span style={{ color: "#F59E0B" }}>•</span><span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Reference model */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.04em" }}>REFERENCE MODEL</div>
              <div style={{ display: "inline-flex", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                {(["male", "female"] as const).map(s => (
                  <button key={s} onClick={() => setSex(s)} style={{
                    padding: "8px 20px", border: "none", fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                    background: sex === s ? "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))" : "transparent",
                    color: sex === s ? "white" : "var(--text-muted)",
                  }}>{s}</button>
                ))}
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
            <button onClick={() => fileRef.current?.click()} style={{ ...btnPrimary, width: "100%" }}>
              I understand — choose a photo
            </button>
          </>
        )}
      </GlassCard>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  padding: "14px 24px", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))",
  color: "white", fontSize: 15, fontWeight: 600,
};
