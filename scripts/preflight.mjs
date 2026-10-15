#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// preflight · run against your LOCAL server before exposing it.
// It catches the silent killers that x402 sellers hit in production:
//   1. a challenge buyers cannot parse
//   2. a challenge too large for common proxy buffers (nginx: 4KB default)
//   3. metadata fields over the payment validator's length cap
//   4. HEAD requests bypassing the paywall (Content-Length / ETag leak)
//   5. a missing output schema (verifiers cannot check your delivery)
// Usage: node scripts/preflight.mjs [baseUrl] [paidPath]
// ═══════════════════════════════════════════════════════════════════
const BASE = process.argv[2] || `http://127.0.0.1:${process.env.X402_PORT || 4021}`;
const PAID = process.argv[3] || '/v1/hello';
let fail = 0;
const ok = (m) => console.log('  ✓', m);
const bad = (m) => { console.log('  ✗', m); fail = 1; };

const res = await fetch(BASE + PAID).catch((e) => {
  bad(`cannot reach ${BASE}${PAID} — ${e.message} (is the server running?)`);
  process.exit(1);
});

if (res.status !== 402) bad(`GET ${PAID} → ${res.status} (expected 402 with a payment challenge)`);
else ok('paid route answers 402');

const hdr = res.headers.get('payment-required');
if (!hdr) bad('missing PAYMENT-REQUIRED header — buyers cannot construct a payment');
else {
  const bytes = Buffer.byteLength(hdr, 'utf8');
  if (bytes > 3800) bad(`challenge header is ${bytes}B — common proxy defaults (nginx 4KB) TRUNCATE it; see deploy/nginx.conf.example`);
  else ok(`challenge header ${bytes}B (safe under a 4KB proxy buffer)`);
  let ch = null;
  try { ch = JSON.parse(Buffer.from(hdr, 'base64').toString('utf8')); ok('challenge parses as JSON'); }
  catch { bad('challenge header is not valid base64-encoded JSON'); }
  if (ch) {
    const desc = (ch.resource && ch.resource.description) || '';
    if (desc.length > 480) bad(`description is ${desc.length} chars — payment validators cap challenge metadata (~500 chars observed); keep it ≤480`);
    else ok(`description ${desc.length} chars (≤480)`);
    const br = ch.extensions && ch.extensions.bazaar;
    const required = br && br.schema && br.schema.properties && br.schema.properties.output && br.schema.properties.output.properties && br.schema.properties.output.properties.example && br.schema.properties.output.properties.example.required;
    if (Array.isArray(required) && required.length) ok(`output schema present (${required.length} required keys)`);
    else console.log('  – output schema not declared (recommended: pre-payment verifiers read it; see src/server.mjs)');
    const body = await res.text();
    if (body.length > 400) console.log(`  – 402 body is ${body.length}B; a 2-byte "{}" keeps bandwidth trivial (optional)`);
    else ok(`402 body is minimal (${body.length}B)`);
  }
}

const hr = await fetch(BASE + PAID, { method: 'HEAD' });
if (hr.status === 402) ok('HEAD is paywalled (no size / ETag leak)');
else bad(`HEAD ${PAID} → ${hr.status} — bypasses the paywall and leaks size/ETag; add an app.head() 402 handler (see src/server.mjs)`);

const hh = await fetch(BASE + '/health');
if (hh.status === 200) ok('/health answers 200 (free)');
else bad(`/health → ${hh.status}`);

console.log(fail ? '\npreflight: FAIL — fix the ✗ items before going public.' : '\npreflight: PASS — payment surface looks production-ready.');
process.exit(fail);
