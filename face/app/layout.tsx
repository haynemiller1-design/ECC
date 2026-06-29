import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { TelemetryProvider } from "@/lib/context/TelemetryContext";
import { ScanProvider } from "@/lib/context/ScanContext";
import HomeButton from "@/components/ui/HomeButton";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VisageIQ — Facial Metrics Intelligence",
  description: "Premium AI-powered biometric facial analysis. Golden ratio scoring, bone structure mapping, and clinical-grade skin assessment.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body style={{ background: "var(--bg-obsidian)", minHeight: "100vh" }}>
        <TelemetryProvider>
          <ScanProvider>
            <HomeButton />
            {children}
          </ScanProvider>
        </TelemetryProvider>
      </body>
    </html>
  );
}
