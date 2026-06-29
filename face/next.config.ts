import type { NextConfig } from "next";

// Security headers applied to every response.
// Sources: OWASP Secure Headers Project, Next.js docs, MDN.
const securityHeaders = [
  // Prevent MIME-type sniffing attacks
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Block clickjacking — no framing of this app by any external site
  { key: "X-Frame-Options", value: "DENY" },

  // Modern referrer policy: send origin only on same-origin, nothing cross-origin
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Force HTTPS for 1 year (preload-ready). Disable in dev via the conditional below.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },

  // DNS prefetch control — allow prefetch for performance, but only to named origins
  { key: "X-DNS-Prefetch-Control", value: "on" },

  // Permissions Policy — explicitly allow only what this app needs:
  //   camera=(self)  → camera access only on same origin (scan page)
  //   All other sensitive APIs are denied
  {
    key: "Permissions-Policy",
    value: [
      "camera=(self)",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "accelerometer=()",
      "gyroscope=()",
      "magnetometer=()",
      "interest-cohort=()",
    ].join(", "),
  },

  // Cross-Origin policies for SharedArrayBuffer / performance isolation
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },

  // Content Security Policy.
  // face-api.js + TensorFlow.js WebGL require 'unsafe-eval' for shader compilation.
  // Inline styles are used throughout (style prop on JSX); 'unsafe-inline' for style-src.
  // data: URIs are used for canvas.toDataURL() image capture.
  // blob: URIs are used by the WebRTC camera stream and face-api workers.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval: TF.js/face-api WebGL; unsafe-inline: Next.js hydration bootstrap scripts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",               // data: for canvas capture, blob: for object URLs
      "media-src 'self' blob:",                   // blob: for WebRTC MediaStream
      "connect-src 'self'",                       // no external API calls
      "worker-src 'self' blob:",                  // face-api.js web workers
      "child-src 'self' blob:",
      "frame-ancestors 'none'",                   // belt-and-suspenders with X-Frame-Options
      "base-uri 'self'",                           // block <base> tag injection
      "form-action 'self'",                        // block form hijacking
      "object-src 'none'",                         // block Flash/plugin execution
      "upgrade-insecure-requests",                 // auto-upgrade http: sub-resources to https:
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Remove X-Powered-By header to avoid fingerprinting
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Restrict which domains can be used in <Image> src (defense against open redirect)
  images: {
    // We use canvas data: URLs rendered as plain <img>, no external image domains needed
    remotePatterns: [],
  },
};

export default nextConfig;
