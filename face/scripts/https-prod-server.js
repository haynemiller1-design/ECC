// Serves the PRODUCTION Next.js build over HTTPS for on-device (phone) testing.
//
// Why this exists: `npm run dev:phone` serves large, development-mode bundles
// that can fail to hydrate over Wi-Fi with a self-signed certificate — when
// hydration doesn't finish, onClick buttons (like "Continue") silently do
// nothing while the page still renders. A production build is much smaller and
// hydrates reliably. `next start` has no HTTPS flag and the production proxy
// redirects http→https, so we wrap the production handler in our own HTTPS
// server (reusing the cert that `dev:phone` generated) and tell Next the
// request is already secure so the redirect doesn't fire.
//
// Usage:  npm run start:phone   (runs `next build` then this server)

const { createServer } = require("https");
const { parse } = require("url");
const fs = require("fs");
const path = require("path");
const next = require("next");

const dir = path.join(__dirname, "..");
const certDir = path.join(dir, "certificates");
const keyPath = path.join(certDir, "localhost-key.pem");
const certPath = path.join(certDir, "localhost.pem");

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error("\n[start:phone] No HTTPS certificate found in ./certificates");
  console.error("[start:phone] Run `npm run dev:phone` once first — it generates the cert — then stop it and run `npm run start:phone` again.\n");
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    // Mark the request as secure so the production proxy doesn't 301 to https.
    req.headers["x-forwarded-proto"] = "https";
    // Never let a phone browser cache HTML documents (avoids stale bundles).
    const accept = req.headers["accept"] || "";
    if (accept.includes("text/html")) {
      res.setHeader("Cache-Control", "no-store, must-revalidate");
    }
    handle(req, res, parse(req.url, true));
  }).listen(port, "0.0.0.0", () => {
    console.log(`\n> VisageIQ production server ready: https://0.0.0.0:${port}`);
    console.log("> On your phone (same Wi-Fi) open: https://<your-computer-ip>:" + port + "\n");
  });
});
