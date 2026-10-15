#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// x402-seller-starter · a production-hardened starter for paid APIs
// Express + x402 — agents pay per call in USDC on Base.
//
// The annotations marked HARDENING encode real production lessons —
// why each guard exists is documented in docs/field-notes.md.
// After ANY metadata change, run: node scripts/preflight.mjs
// ═══════════════════════════════════════════════════════════════════
import express from 'express';
import { createX402Server } from '@coinbase/cdp-sdk/x402';
import { paymentMiddlewareFromHTTPServer } from '@x402/express';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';

const PORT = Number(process.env.X402_PORT || 4021);
const HOST = process.env.X402_HOST || '127.0.0.1';
const ENVIRONMENT = process.env.X402_ENV_MODE || 'production';
const payTo = process.env.X402_PAY_TO;
const NETWORK = 'eip155:8453'; // Base mainnet · USDC

if (!payTo) {
  console.error('[starter] missing X402_PAY_TO — set your receiving address in .env');
  process.exit(1);
}

// ── Discovery metadata ─────────────────────────────────────────────
// HARDENING: keep `description` SHORT (≤480 chars). Payment validators
// enforce a length cap on metadata embedded in the 402 challenge
// (~500 chars observed); exceeding it breaks checkout for every buyer
// while direct cURL probes still look fine.
// HARDENING: declare `output.schema` — pre-payment verifiers and agent
// directories read the required top-level keys to check that you deliver.
const HELLO = declareDiscoveryExtension({
  method: 'GET',
  input: {},
  inputSchema: { properties: {} },
  output: {
    example: {
      as_of: '2026-01-01T00:00:00Z',
      hello: 'world',
      echo: null,
      disclaimer: 'Demo endpoint — descriptive data only.',
    },
    schema: {
      type: 'object',
      required: ['as_of', 'hello', 'echo', 'disclaimer'],
      properties: {
        as_of: { type: 'string', description: 'Response build time (ISO 8601 UTC)' },
        hello: { type: 'string' },
        echo: { description: 'Echoes the ?echo= query parameter (string or null)' },
        disclaimer: { type: 'string' },
      },
    },
  },
});

// ── What is for sale (the x402 server) ─────────────────────────────
const x402 = await createX402Server({
  environment: ENVIRONMENT,
  payToConfig: { type: 'address', evm: payTo },
  routes: {
    'GET /v1/hello': {
      accepts: { scheme: 'exact', price: '$0.005', network: NETWORK, payTo, maxTimeoutSeconds: 300 },
      description: 'Demo paid endpoint: a timestamped greeting. Replace with your own data service (keep this description ≤480 chars).',
      serviceName: 'Starter API: Hello',
      tags: ['demo', 'starter'],
      mimeType: 'application/json',
      extensions: HELLO,
    },
    // Add your real routes here. Keep each `description` ≤480 chars.
  },
});

const app = express();
app.set('trust proxy', true); // recommended: run behind a reverse proxy

app.use(paymentMiddlewareFromHTTPServer(x402));

// ── HARDENING: paywall HEAD requests ───────────────────────────────
// Express answers HEAD from the GET handler automatically — which BYPASSES
// the payment middleware and leaks response size (Content-Length) plus a
// content-derived ETag without anyone paying. Make HEAD hit the same wall.
const head402 = (req, res) => res.status(402).json({ error: 'PAYMENT_REQUIRED' });
app.head('/v1/hello', head402);

// ── Your actual service ────────────────────────────────────────────
app.get('/v1/hello', (req, res) => {
  res.json({
    as_of: new Date().toISOString(),
    hello: 'world',
    echo: typeof req.query.echo === 'string' ? req.query.echo : null,
    disclaimer: 'Demo endpoint from x402-seller-starter — descriptive data only, not financial advice.',
  });
});

// Free health check — for uptime monitors only. Never expose data here.
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'x402-seller-starter' }));

app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND' }));

app.listen(PORT, HOST, () => {
  console.log(`[starter] listening on http://${HOST}:${PORT} · env=${ENVIRONMENT}`);
  console.log('[starter] next: node scripts/preflight.mjs   (run before exposing publicly)');
});
