# OmniKit — pro tools that run entirely in the browser

A zero-dependency static website offering 15 professional-grade tools
(image compression, JSON formatting, hashing, diffing, generators,
converters) that run **entirely in the visitor's browser**. No backend, no uploads, no accounts — which means zero hosting
cost, instant speed, and a privacy story competitors with servers cannot
match.

## Run it locally

No build step. Open `website/index.html` in a browser, or serve the folder:

```bash
npx serve website
# or
python3 -m http.server -d website 8080
```

## Deploy (free)

Any static host works. Point it at the `website/` directory:

- **GitHub Pages** — Settings → Pages → deploy from branch, folder `/website`
  (or copy the folder to a dedicated repo).
- **Netlify / Vercel** — drag-and-drop the folder, or connect the repo with
  publish directory `website`.
- **Cloudflare Pages** — connect repo, build command _none_, output `website`.

## Turn on payments (Stripe)

The Pro upgrade flow is built in and needs only two URLs:

1. In Stripe, create a product **OmniKit Pro** with two prices:
   a one-time price (lifetime, e.g. $29) and a recurring monthly price
   (e.g. $4/mo).
2. Create a **Payment Link** for each price
   (Stripe Dashboard → Payment links).
3. Paste both URLs into `js/config.js`
   (`stripeLifetimeUrl`, `stripeMonthlyUrl`).
4. In each Payment Link's confirmation settings, show a custom message
   telling the buyer their license key, or use an order-fulfillment email.

### License keys — important honesty note

This site is fully static, so the shipped license check is a **format gate**
(`OMNI-XXXX-XXXX-XXXX`) stored in `localStorage`. That is fine for launch —
the free tier is generous and Pro limits are soft — but a determined user
can bypass it. When revenue justifies it, add real validation with one tiny
serverless function:

1. Generate keys with a signature (e.g. HMAC of a random ID with a secret).
2. A Stripe webhook (serverless function) emails the key on purchase.
3. The `Activate` button POSTs the key to a `/verify` function that checks
   the signature and returns a signed token cached in `localStorage`.

Total cost: one function on Cloudflare Workers / Netlify Functions, free at
launch scale. Until then, treat Pro as pay-what-honesty-allows — common and
effective for tools priced under $30.

## Why this can make real money

- **Zero marginal cost.** Static hosting is free; every visitor costs nothing.
- **SEO surface.** "compress image online", "json formatter", "diff checker"
  etc. are high-volume, high-intent searches. The privacy angle
  ("never uploaded") is a genuine differentiator in every meta description.
- **Honest freemium.** Free tier is genuinely useful (habit-forming);
  Pro sells convenience (batch, bulk, exports) to professionals.
- **Lifetime pricing converts.** $29-once beats subscriptions for utilities;
  the monthly tier anchors the lifetime price.

### Growth playbook

1. Launch on Product Hunt / Hacker News with the privacy hook:
   _"15 pro tools, zero uploads — everything runs in your tab."_
2. Split each tool onto its own URL later (`/json-formatter`, `/compress-image`)
   for SEO — the tool registry in `js/tools.js` makes this a template loop.
3. Add tools where search demand exists (CSV↔JSON, favicon generator,
   regex tester). Every new tool strengthens the lifetime-deal pitch.
4. Add a PWA manifest + service worker so "works offline" becomes an
   install prompt — installs drive retention and word of mouth.

## Architecture

```text
website/
├── index.html      # landing page + modals (single page)
├── css/style.css   # dark SaaS theme, CSS variables, no framework
└── js/
    ├── config.js   # Stripe URLs, prices, free-tier limits  ← edit me
    ├── tools.js    # the 15 tool implementations (self-contained)
    └── app.js      # grid, modals, Pro gating, session stats
```

Adding a tool = appending one object (`id`, `icon`, `name`, `desc`,
`render(body)`) to `OMNIKIT_TOOLS` in `js/tools.js`. Everything else —
card, modal, Pro tagging — is automatic.

All user input is inserted with `textContent` or escaped via `OK.esc()`;
the Markdown previewer escapes before parsing and only allows
`http(s)` links. No external requests are made by any tool.
