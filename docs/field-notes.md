# Field notes — ten lessons from a real launch

These come from building and launching an x402 seller that went from zero to
its first external, unattended agent payments in 72 hours. Each note maps to
a guard baked into this starter.

Full writeup (architecture, timeline, the whole bill):
**English:** https://deskfeed.dev/writing/agent-economy-retro/ · **中文:** https://deskfeed.dev/zh/writing/agent-economy-retro/

---

**1. Metadata is part of the payment surface.**
Descriptions and discovery metadata travel inside every 402 challenge and
through payment validation. Treat them as protocol fields, not copy: change
one, re-run preflight. A description past a validator's length cap (~500
chars observed) silently breaks checkout for every buyer.

**2. Rich challenges outgrow default proxy buffers.**
A metadata-rich 402 challenge can exceed 4KB. nginx's default
`proxy_buffer_size` truncates it — buyers get an unparseable challenge while
direct-to-origin tests keep passing. Raise the buffers (see
`deploy/nginx.conf.example`) and let preflight watch the size.

**3. Express auto-HEAD bypasses paywalls.**
HTTP HEAD is auto-answered from the GET handler — skipping payment
middleware and leaking `Content-Length` plus a content-derived `ETag`.
"Nobody gets data" is true; "nobody learns anything" is not. Add an explicit
`app.head()` 402 handler per paid route (included here).

**4. "No body" is not "no leak."**
The leak surface of an unpaid request lives in headers: response size,
ETag fingerprints that change when your data changes. Audit headers, not
just bodies.

**5. Indexing is asynchronous.**
Agent directories index you on their own schedule (hours, not seconds).
Re-check with a script; never conclude "not listed" from a single look.
See `docs/discovery-checklist.md`.

**6. Debug payment failures with a control purchase.**
When your own purchase fails, immediately buy a *different* seller with the
same client. If that succeeds, the problem is your server — 15 minutes of
bisection beats hours of log staring.

**7. Keep two ledgers.**
Self-test purchases and real buyer revenue are different facts. Record them
separately, reconcile both against the chain to the cent. Mixed books do not
survive third-party inspection.

**8. Show only verifiable numbers.**
For agent-facing services, every displayed figure may be independently
checked on-chain. Honesty is not a virtue here — it is an asset.

**9. Supervise your processes; automate certificates.**
A proxy started by hand dies at the first reboot. Put services under a
supervisor (systemd), automate TLS renewal, and treat "it survived a restart"
as a test you actually run.

**10. Ship the smallest real loop first.**
One real service, one real payment, one real reconciliation. The loop is the
asset; everything else is scaling.
