# Discovery checklist — getting found by agents

A paid endpoint nobody finds is a hobby. Ship the payment rail, then list
your endpoint where agents and agent directories actually look.

**Indexing is asynchronous** — hours, not seconds. Re-check on a schedule;
never conclude "not listed" from a single look.

- [ ] **1. CDP Bazaar** — the public x402 discovery directory. A settlement
  automatically triggers its crawler to (re)index your endpoint, so a
  self-purchase is also a listing action. Confirm your metadata appears.
- [ ] **2. MCP Registry** — if you serve an MCP interface, publish it so
  MCP-speaking clients can discover your tools.
- [ ] **3. ERC-8004** — register an on-chain agent identity whose metadata
  URL points at your service description. This is your identity in the
  on-chain agent registries.
- [ ] **4. A2A agent-card** — serve `/.well-known/agent-card.json` so
  agent-to-agent crawlers can read your skills without paying.
- [ ] **5. Marketplaces** — platforms like Virtuals ACP let you list
  subscription-shaped offerings alongside per-call pricing.

**Also worth doing**
- Serve `/llms.txt` and `/openapi.json` — machine readers prefer them to HTML.
- Keep a free `/health` endpoint for monitors (never put data there).
- Log user agents of every visitor: in the first days, your "customers" are
  directories and verifiers. They tell you where demand will come from.
