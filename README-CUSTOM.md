# Homer live customizations (luoqing94)

Upstream Vue app: bastienwirtz/homer (fork `main` tracks upstream).

This branch packs **deployment customizations** used in production (EdgeOne native + OTP gate). Secrets and personal hosts come from **platform env vars** at request time. Repo fallbacks are `CHANGE_ME_*` / `you@example.com` only — do **not** commit real secrets, emails, or zone hosts.

## Layout
- `static/` — built Homer assets + `assets/config.yml` (service links use host placeholder `CHANGE_ME.example.com`)
- `edgeone-native/` — EdgeOne project with auth gate edge function (password + email OTP)
- `edgeone-proxy/` — older CF Pages proxy variant (also gated; legacy, not the main-domain deploy)
- `otp-worker/` — Cloudflare Worker that sends OTP email (Brevo)

## EdgeOne native (`edgeone-native` / edge functions)

Set these in the EdgeOne console (or equivalent `process.env` for Node-shaped runtimes). Values are read inside `onRequest` from `context.env`, then `process.env`, then fallbacks.

| Env var | Purpose | Fallback if unset |
| --- | --- | --- |
| `GATE_PASSWORD` | Login passphrase | `CHANGE_ME_GATE_PASSWORD` |
| `SESSION_SECRET` | HMAC secret for session/OTP cookies | `CHANGE_ME_SESSION_SECRET` |
| `OTP_MAILER_URL` | OTP worker URL | `CHANGE_ME_OTP_MAILER_URL` |
| `OTP_MAILER_SECRET` | Shared secret sent as `x-homer-otp-secret` | `CHANGE_ME_OTP_MAILER_SECRET` |
| `ALLOWED_EMAILS` | Comma-separated OTP whitelist (lowercased) | `you@example.com` |
| `PUBLIC_ZONE` | Hostname/zone only (no scheme). When serving `/assets/config.yml` (and config-demo), rewrites `CHANGE_ME.example.com` to this host. If unset, placeholders are left as-is. | *(empty — no rewrite)* |

## Legacy proxy (`edgeone-proxy`)

Same gate/OTP vars as native, plus:

| Env var | Purpose | Fallback if unset |
| --- | --- | --- |
| `ORIGIN_HOST` | Upstream Pages hostname (no scheme) | `CHANGE_ME.pages.dev` |
| `CF_ACCESS_CLIENT_ID` | Cloudflare Access service token id | `CHANGE_ME_CF_ACCESS_CLIENT_ID` |
| `CF_ACCESS_CLIENT_SECRET` | Cloudflare Access service token secret | `CHANGE_ME_CF_ACCESS_CLIENT_SECRET` |
| `PUBLIC_ZONE` | Same config.yml host rewrite as native | *(empty — no rewrite)* |

## OTP worker (`otp-worker`)

Set on the Cloudflare Worker (wrangler secrets / dashboard). `otp-worker/wrangler.toml` keeps `CHANGE_ME_KV_NAMESPACE_ID` for the `OUTBOX` KV binding.

| Env var | Purpose | Fallback if unset |
| --- | --- | --- |
| `ALLOWED_EMAILS` | Comma-separated OTP whitelist | `you@example.com` |
| `SHARED_SECRET` | Must match `OTP_MAILER_SECRET` on the gate | *(reject if missing)* |
| `BREVO_API_KEY` | Brevo transactional mail | *(skip Brevo; may use KV outbox)* |
| `BREVO_FROM` | Sender address | `CHANGE_ME@example.com` |
| `BREVO_FROM_NAME` | Sender display name | `Homer Auth` |

## Before deploy
Configure the env names above in EdgeOne / Cloudflare. Do **not** commit real secrets, emails, or domains.
