"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Persistent "Home" button fixed to the top-left of every screen.
 * Lets the user return to the landing page from any point in the flow.
 * Hidden on the landing page itself (pathname "/") to avoid redundancy.
 * Rendered as a real link so it works even before React hydrates.
 */
export default function HomeButton() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Link
      href="/"
      aria-label="Back to home"
      style={{
        position: "fixed",
        top: 16,
        left: 16,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 16px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(11,15,25,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "var(--text-subtle)",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.02em",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        textDecoration: "none",
      }}
    >
      <span style={{ fontSize: 15, lineHeight: 1 }}>⌂</span>
      <span>Home</span>
    </Link>
  );
}
