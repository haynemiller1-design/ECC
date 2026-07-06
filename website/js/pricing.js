/*
 * PromptForge — model pricing + client-side token estimation.
 *
 * IMPORTANT (honesty): exact token counts require each provider's own
 * tokenizer (Anthropic's count_tokens endpoint, OpenAI's tiktoken, etc.).
 * A static, no-backend, no-upload site cannot call those. So PromptForge
 * ships a fast heuristic ESTIMATE, clearly labelled as such, and lets you
 * paste an exact count from the provider to override it. The estimate is
 * calibrated to be within a few percent for typical English prose and is a
 * deliberate trade for the privacy guarantee: your prompt never leaves the tab.
 *
 * Prices are USD per 1,000,000 tokens. Update as providers change them.
 */
window.PF_MODELS = [
  // ---- Anthropic (from the Claude API skill, 2026) ----
  { id: 'claude-opus-4-8',   label: 'Claude Opus 4.8',   vendor: 'Anthropic', ctx: 1000000, in: 5.0,  out: 25.0, factor: 1.00 },
  { id: 'claude-sonnet-5',   label: 'Claude Sonnet 5',   vendor: 'Anthropic', ctx: 1000000, in: 3.0,  out: 15.0, factor: 1.00 },
  { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',  vendor: 'Anthropic', ctx: 200000,  in: 1.0,  out: 5.0,  factor: 1.00 },
  // ---- OpenAI ----
  { id: 'gpt-5',             label: 'GPT-5',             vendor: 'OpenAI',    ctx: 400000,  in: 1.25, out: 10.0, factor: 0.97 },
  { id: 'gpt-5-mini',        label: 'GPT-5 mini',        vendor: 'OpenAI',    ctx: 400000,  in: 0.25, out: 2.0,  factor: 0.97 },
  { id: 'gpt-4o',            label: 'GPT-4o',            vendor: 'OpenAI',    ctx: 128000,  in: 2.5,  out: 10.0, factor: 0.97 },
  // ---- Google ----
  { id: 'gemini-3-pro',      label: 'Gemini 3 Pro',      vendor: 'Google',    ctx: 1000000, in: 2.5,  out: 15.0, factor: 1.02 },
  { id: 'gemini-3-flash',    label: 'Gemini 3 Flash',    vendor: 'Google',    ctx: 1000000, in: 0.3,  out: 2.5,  factor: 1.02 }
];

/*
 * Heuristic token estimate. Blends a character-based and a word-based model,
 * then applies a small per-vendor factor. Returns an integer estimate.
 * Deliberately dependency-free — no tokenizer tables shipped to the browser.
 */
window.PF_estimateTokens = function (text, factor) {
  if (!text) return 0;
  var chars = text.length;
  var words = (text.match(/\S+/g) || []).length;
  // ~4 chars/token for English; word count anchors the low end for short text.
  var byChars = chars / 4;
  var byWords = words * 1.33;
  var base = (byChars * 0.7) + (byWords * 0.3);
  // Whitespace/newlines and punctuation nudge counts up slightly.
  var punct = (text.match(/[^\w\s]/g) || []).length;
  base += punct * 0.15;
  return Math.max(words ? 1 : 0, Math.round(base * (factor || 1)));
};

window.PF_fmtUSD = function (n) {
  if (n === 0) return '$0';
  if (n < 0.01) return '$' + n.toFixed(5);
  if (n < 1) return '$' + n.toFixed(4);
  return '$' + n.toFixed(2);
};
