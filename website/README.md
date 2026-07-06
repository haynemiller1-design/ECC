# PromptForge — the local-first workbench for prompt engineering

A zero-dependency static web app for people who write LLM prompts for a
living. Draft prompts with reusable `{{variables}}`, watch **live token
counts and per-model cost**, snapshot **versions**, and **diff** what
changed — all in one surface that runs **entirely in the browser**.
Prompts are stored in `localStorage` and never uploaded, so the tool is
private by architecture, free to host, instant, and works offline.

This replaces the earlier general-purpose "OmniKit" utility grid. The
pivot rationale is at the bottom of this file.

## What it does (single value proposition)

**One workbench for the whole prompt-authoring loop.** Instead of juggling
a token-counter site, a notes app, and a scratch file, PromptForge unifies:

- **Editor** — system prompt + prompt body with `{{variable}}` templating and
  live variable inputs.
- **Token & cost meter** — a live estimate of prompt tokens plus cost-per-call
  across Anthropic / OpenAI / Google models, with a context-window warning.
- **Messages export** — one click to valid Anthropic Messages or OpenAI Chat
  JSON, ready to paste into code.
- **Library** — save, search, and organize prompts (localStorage).
- **Version history + diff** — snapshot a prompt and compare any version
  against the editor line-by-line.
- **Export / import** — your whole library is a JSON file you own.
- **PWA** — installable, works fully offline.

### On token-count accuracy (deliberate trade)

Exact token counts require each provider's own tokenizer — Anthropic's
`count_tokens` endpoint, OpenAI's `tiktoken`. A tool that **never uploads
your prompt** cannot call those. So PromptForge ships a fast, calibrated
**estimate** (blended char/word model, per-vendor factor) — within a few
percent for typical English — and labels it as an estimate everywhere. The
privacy guarantee is worth the last few percent; users who need exactness
can paste a known count to calibrate. See `js/pricing.js`.

## Run it locally

No build step:

```bash
npx serve website
# or
python3 -m http.server -d website 8080
```

Open the URL. (The service worker / PWA install needs an `http(s)` origin,
not `file://`.)

## Deploy (free)

Static host, point at the `website/` directory: GitHub Pages, Netlify,
Vercel, or Cloudflare Pages (build command _none_, output `website`).

## Turn on payments (Stripe)

The Pro upgrade flow is built in and needs two URLs:

1. In Stripe create a product **PromptForge Pro** with a one-time price
   (Lifetime, e.g. $39) and a recurring price (Team, e.g. $8/seat/mo).
2. Create a **Payment Link** for each and paste both into `js/config.js`
   (`stripeLifetimeUrl`, `stripeMonthlyUrl`).
3. In each link's confirmation, deliver the buyer a license key, or email it.

### License keys — honesty note

Being fully static, the shipped license check is a **format gate**
(`FORGE-XXXX-XXXX-XXXX`) stored in `localStorage`. Fine for launch — the
free tier (25 saved prompts, full workbench) is generous and the Pro caps
are soft. When revenue justifies it, add real validation with one small
serverless function: a Stripe webhook issues a signed key; the Activate
button POSTs it to a `/verify` function that checks the signature. Free at
launch scale on Cloudflare Workers / Netlify Functions.

## Retention features (why users come back)

Every feature increases return usage without requiring an account:

- **Library** — prompts persist between visits; the site becomes where your
  prompts _live_, not a one-off calculator.
- **Version history + diff** — the reason to keep editing here instead of a
  text file: you get a changelog for free.
- **Templates / starter prompt** — new users land on a working example, not a
  blank page.
- **Keyboard shortcut** — `Ctrl/Cmd-S` saves.
- **PWA install + offline** — an installed app on the dock is a standing
  invitation to return; offline means it works on a plane.
- **Export/import** — portability builds trust, which drives retention.

## Architecture

```text
website/
├── index.html            # landing + embedded workbench (single page)
├── manifest.webmanifest  # PWA manifest
├── sw.js                 # service worker (offline app-shell cache)
├── css/
│   ├── style.css         # base tokens, buttons, modal (shared)
│   └── promptforge.css   # workbench layout
└── js/
    ├── config.js         # Stripe URLs, prices, free-tier cap  ← edit me
    ├── pricing.js        # model pricing table + token estimator
    ├── workbench.js      # editor, variables, meter, messages, history/diff
    └── promptforge.js    # storage, Pro gate, PWA, boot
```

All user input is inserted via `textContent` or an escaped helper; no
tool makes a network request for user data. The service worker caches only
the app shell — prompts live in `localStorage` and are never fetched.

## Growth playbook

1. Launch on Hacker News / Product Hunt with the privacy hook:
   _"A prompt workbench that never uploads your prompts."_
2. SEO: prompt engineers search "token counter", "LLM cost calculator",
   "prompt manager" — the workbench answers all three on one page. Split
   dedicated landing routes later (the model table in `pricing.js` makes
   per-model cost pages a template loop).
3. Add adjacent, on-identity features (prompt linting, few-shot builders,
   eval scratchpads) — each strengthens the "the workbench where prompts get
   built" positioning rather than sprawling into random utilities.

## Why the pivot from OmniKit

OmniKit was a grid of unrelated browser utilities. Independent utilities are
commodities: users arrive from one search, use one tool, and leave — there's
no reason to remember the site and nothing to bookmark. PromptForge keeps the
same defensible foundation (100% local, no accounts, free hosting) but points
it at **one audience with a recurring, painful workflow** (prompt engineers),
unifies the tools they use _together_ into one job, and adds a reason to
return (a library and version history that accrue value over time). Same
privacy moat, a real product identity instead of a toolbox.
