# Homer live customizations (luoqing94)

Upstream Vue app: bastienwirtz/homer (fork `main` tracks upstream).

This branch packs **deployment customizations** used in production (EdgeOne native + OTP gate), with secrets replaced by `CHANGE_ME_*` placeholders.

## Layout
- `static/` — built Homer assets + `assets/config.yml` (service links)
- `edgeone-native/` — EdgeOne project with auth gate edge function (password + email OTP)
- `edgeone-proxy/` — older CF Pages proxy variant (also gated)
- `otp-worker/` — Cloudflare Worker that sends OTP email (Brevo via env `BREVO_API_KEY`)

## Before deploy
Fill placeholders: `CHANGE_ME_GATE_PASSWORD`, `CHANGE_ME_SESSION_SECRET`, `CHANGE_ME_OTP_MAILER_SECRET`, `CHANGE_ME_OTP_MAILER_URL`, CF Access ids (proxy only), KV namespace id, and `ALLOWED_EMAILS`.
Do **not** commit real secrets.
