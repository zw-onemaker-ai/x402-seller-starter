# x402-seller-starter

**A production-hardened starter for selling APIs to AI agents — pay-per-call in USDC on Base via x402.**

Most x402 examples stop at "hello world with a 402 response". This starter
bakes in the lessons from a real launch — an API that went from zero to its
first external, unattended agent payments in 72 hours — so you don't
rediscover them in production.

## What's inside

| Path | Purpose |
|---|---|
| `src/server.mjs` | Express + x402 skeleton: a demo paid route, rich discovery metadata (with an output schema), a HEAD paywall guard |
| `scripts/preflight.mjs` | Run against your local server **before going public** — catches challenge truncation, metadata length caps, HEAD leaks, missing schema |
| `deploy/nginx.conf.example` | Reverse-proxy config with the buffer sizes a rich x402 challenge actually needs |
| `docs/discovery-checklist.md` | The five places agents and directories look — get listed |
| `docs/field-notes.md` | Ten lessons from the launch, each mapped to a guard in this repo |

## Quickstart

```bash
npm install
cp .env.example .env      # fill in X402_PAY_TO + your CDP keys
npm start                 # node --env-file=.env src/server.mjs
npm run preflight         # all green before you ship
```

Facilitator credentials come from a (free) Coinbase CDP account. Replace the
demo route with your own service — and keep every description ≤480 chars.

## Why "hardened"?

The failure modes of a paid API are silent:

- a 402 challenge silently truncated at the proxy (buyers see a broken checkout; direct tests look fine)
- a metadata field crossing a validator's length cap (every settlement fails)
- HEAD requests answering 200 — leaking response size and an ETag fingerprint
- a service that is live but unlisted, so paying customers never arrive

Each of those has a guard here and a note in `docs/field-notes.md`.

## Field report

The full 72-hour launch writeup (architecture, timeline, every pitfall):
- **English** — https://deskfeed.dev/writing/agent-economy-retro/
- **中文** — https://deskfeed.dev/zh/writing/agent-economy-retro/

## 中文速览

- **这是什么**：面向 AI Agent 的付费 API 生产级骨架 —— Express + x402，Base 主网 USDC 按次收款
- **为什么用它**：把一次真实上线踩过的坑做成了开箱闸门 —— 预检脚本（账单截断 / 字段长度 / HEAD 泄漏 / 输出 schema）、代理缓冲样板、发现层入册清单
- **快速开始**：`npm install` → 复制 `.env.example` 填入收款地址与 CDP 密钥 → `npm start` → `npm run preflight` 全绿后再公开
- **深入**：`docs/field-notes.md`（十条实战笔记）+ 完整复盘文章（见上）

## License

MIT
