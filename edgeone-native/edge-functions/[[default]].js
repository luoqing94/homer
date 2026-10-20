const SESSION_TTL_SEC = 7 * 24 * 3600;
const OTP_TTL_SEC = 10 * 60;
const COOKIE_NAME = 'homer_gate';
const OTP_COOKIE = 'homer_otp';
const CONFIG_HOST_PLACEHOLDER = 'CHANGE_ME.example.com';

function readEnv(env, key, fallback) {
  const fromCtx = env && env[key];
  const fromProc = typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  const raw = fromCtx != null && String(fromCtx).trim() !== '' ? fromCtx : fromProc;
  if (raw == null || String(raw).trim() === '') return fallback;
  return String(raw).trim();
}

function parseAllowedEmails(raw) {
  const set = new Set(
    String(raw || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
  if (set.size === 0) set.add('you@example.com');
  return set;
}

function hostnameOnly(raw) {
  if (!raw) return '';
  let s = String(raw).trim();
  s = s.replace(/^https?:\/\//i, '');
  s = s.split('/')[0];
  return s.trim();
}

function runtimeConfig(env) {
  return {
    gatePassword: readEnv(env, 'GATE_PASSWORD', 'CHANGE_ME_GATE_PASSWORD'),
    sessionSecret: readEnv(env, 'SESSION_SECRET', 'CHANGE_ME_SESSION_SECRET'),
    otpMailerUrl: readEnv(env, 'OTP_MAILER_URL', 'CHANGE_ME_OTP_MAILER_URL'),
    otpMailerSecret: readEnv(env, 'OTP_MAILER_SECRET', 'CHANGE_ME_OTP_MAILER_SECRET'),
    allowedEmails: parseAllowedEmails(readEnv(env, 'ALLOWED_EMAILS', 'you@example.com')),
    publicZone: hostnameOnly(readEnv(env, 'PUBLIC_ZONE', '')),
  };
}

function isConfigYmlPath(path) {
  return /\/assets\/config(-demo)?\.ya?ml$/i.test(path);
}

function rewriteConfigHosts(text, publicZone) {
  if (!publicZone) return text;
  return text.split(CONFIG_HOST_PLACEHOLDER).join(publicZone);
}

function b64url(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSign(payload, sessionSecret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(sessionSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64url(sig);
}

async function makeToken(data, ttlSec, sessionSecret) {
  const body = { ...data, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const payload = b64url(new TextEncoder().encode(JSON.stringify(body)));
  const sig = await hmacSign(payload, sessionSecret);
  return `${payload}.${sig}`;
}

async function readToken(token, sessionSecret) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expect = await hmacSign(payload, sessionSecret);
  if (sig !== expect) return null;
  try {
    const body = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    if (!body.exp || body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}

function getCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return '';
}

function setCookie(name, value, maxAge) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', `Max-Age=${maxAge}`,
  ].join('; ');
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function loginPage(msg = '', tab = 'email', email = '') {
  const err = msg ? `<p class="msg">${escapeHtml(msg)}</p>` : '';
  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Homer 登录（EdgeOne 原生）</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
font-family:system-ui,-apple-system,sans-serif;background:#0f1419;color:#e7ecf3}
.card{width:min(400px,92vw);background:#1a2332;border-radius:12px;padding:28px 24px;box-shadow:0 8px 32px #0006}
h1{margin:0 0 8px;font-size:1.25rem}.sub{opacity:.7;font-size:.9rem;margin-bottom:20px}
.tabs{display:flex;gap:8px;margin-bottom:16px}
.tabs button{flex:1;padding:8px;border:0;border-radius:8px;background:#243044;color:#cfd8e6;cursor:pointer}
.tabs button.on{background:#3b82f6;color:#fff}
label{display:block;font-size:.85rem;margin:12px 0 6px;opacity:.85}
input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid #334155;
background:#0f172a;color:#e7ecf3;font-size:1rem}
button.primary{width:100%;margin-top:16px;padding:11px;border:0;border-radius:8px;background:#3b82f6;color:#fff;font-size:1rem;cursor:pointer}
.msg{color:#fbbf24;font-size:.9rem;margin:0 0 12px}
.panel{display:none}.panel.on{display:block}
.row{display:flex;gap:8px}.row input{flex:1}
.row button{white-space:nowrap;padding:0 12px;border:0;border-radius:8px;background:#334155;color:#e7ecf3;cursor:pointer}
</style></head><body>
<div class="card">
<h1>Homer</h1>
<p class="sub">EdgeOne 原生静态站 · 登录后继续（会话 7 天）</p>
${err}
<div class="tabs">
<button type="button" class="${'email' === tab ? 'on' : ''}" data-tab="email">邮箱验证码</button>
<button type="button" class="${'password' === tab ? 'on' : ''}" data-tab="password">口令</button>
</div>
<div class="panel ${'email' === tab ? 'on' : ''}" id="panel-email">
<form method="POST" action="/__auth/otp/verify">
<label>邮箱（白名单）</label>
<input name="email" type="email" required placeholder="you@example.com" autocomplete="username" value="${escapeHtml(email)}"/>
<label>验证码</label>
<div class="row">
<input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required placeholder="6 位验证码"/>
<button type="submit" formaction="/__auth/otp/send" formmethod="POST" formnovalidate>发送验证码</button>
</div>
<button class="primary" type="submit">登录</button>
</form>
</div>
<div class="panel ${'password' === tab ? 'on' : ''}" id="panel-password">
<form method="POST" action="/__auth/password">
<label>口令</label>
<input name="password" type="password" required autocomplete="current-password"/>
<button class="primary" type="submit">登录</button>
</form>
</div>
</div>
<script>
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('on',x===b));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id==='panel-'+b.dataset.tab));
}));
</script>
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'vary': 'Cookie' },
  });
}

async function sha256Hex(s) {
  const dig = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(dig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomOtp() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, '0');
}

const LOGOUT_SNIPPET = `<a href="/__auth/logout" id="homer-gate-logout" data-turbo="false" style="position:fixed;right:16px;bottom:20px;z-index:2147483647;padding:10px 16px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font:600 14px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35)">退出登录</a>
<script>
(function(){
  function wire(el){
    if (!el || el.dataset.wired) return;
    el.dataset.wired = '1';
    el.addEventListener('click', function(ev){
      ev.preventDefault();
      window.location.replace('/__auth/logout');
    });
  }
  function place(){
    var el = document.getElementById('homer-gate-logout');
    if (!el) {
      el = document.createElement('a');
      el.id = 'homer-gate-logout';
      el.href = '/__auth/logout';
      el.textContent = '退出登录';
      el.setAttribute('data-turbo','false');
      el.setAttribute('style','position:fixed;right:16px;bottom:20px;z-index:2147483647;padding:10px 16px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font:600 14px/1.2 system-ui,-apple-system,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35)');
      document.body.appendChild(el);
    } else if (el.parentNode !== document.body) {
      document.body.appendChild(el);
    }
    wire(el);
  }
  place();
  document.addEventListener('DOMContentLoaded', place);
  setTimeout(place, 500);
  setTimeout(place, 2000);
})();
</script>`;

function copyUpstreamHeaders(upstream) {
  const out = new Headers();
  for (const [k, v] of upstream.headers) {
    const lk = k.toLowerCase();
    if (lk === 'transfer-encoding' || lk === 'content-encoding' || lk === 'content-length') continue;
    out.append(k, v);
  }
  out.set('cache-control', 'private, no-store');
  out.set('vary', 'Cookie');
  out.set('x-homer-origin', 'edgeone-native');
  return out;
}

async function serveAssets(context, request, inbound, cfg) {
  const prefix = '/__homer_static__/hs_a8f3c91e2b7d4e6f';
  let path = inbound.pathname;
  if (path === '/' || path === '') path = '/index.html';
  const target = new URL(prefix + path, inbound.origin);
  target.search = inbound.search; // keep eo_token etc if any

  let upstream;
  try {
    // Same-host fetch → EdgeOne node cache / static origin (not recursive into this function when path is static-only)
    upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: { 'accept': request.headers.get('accept') || '*/*' },
      redirect: 'manual',
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'static_fetch_failed', detail: String(err) }), {
      status: 502, headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  if (upstream.status === 404 && path !== '/index.html') {
    const idx = new URL(prefix + '/index.html', inbound.origin);
    upstream = await fetch(idx.toString(), { method: 'GET', redirect: 'manual' });
  }

  const out = copyUpstreamHeaders(upstream);

  if (request.method === 'GET' && upstream.status === 200 && isConfigYmlPath(path)) {
    const text = rewriteConfigHosts(await upstream.text(), cfg.publicZone);
    if (!out.has('content-type')) out.set('content-type', 'text/yaml; charset=utf-8');
    return new Response(text, { status: 200, headers: out });
  }

  const ctype = (upstream.headers.get('content-type') || '').toLowerCase();
  const wantLogout = request.method === 'GET' && upstream.status === 200 && (
    ctype.includes('text/html') || path.endsWith('.html') || inbound.pathname === '/'
  );
  if (wantLogout) {
    let html = await upstream.text();
    if (!html.includes('homer-gate-logout')) {
      if (html.includes('</body>')) html = html.replace('</body>', LOGOUT_SNIPPET + '</body>');
      else html += LOGOUT_SNIPPET;
    }
    out.set('content-type', 'text/html; charset=utf-8');
    return new Response(html, { status: 200, headers: out });
  }

  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: out });
}

async function parseForm(request) {
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) return await request.json();
  const fd = await request.formData();
  const o = {};
  for (const [k, v] of fd.entries()) o[k] = String(v);
  return o;
}

function redirectHome(sessionToken) {
  return new Response(null, {
    status: 302,
    headers: {
      location: '/',
      'set-cookie': setCookie(COOKIE_NAME, sessionToken, SESSION_TTL_SEC),
      'cache-control': 'no-store',
    },
  });
}

export default async function onRequest(context) {
  const { request } = context;
  const inbound = new URL(request.url);
  const cfg = runtimeConfig(context.env);

  if (inbound.pathname.startsWith('/.well-known/')) {
    try {
      const local = await context.env.ASSETS?.fetch?.(request);
      if (local && local.status === 200) return local;
    } catch (_) {}
  }

  if (inbound.pathname === '/__auth/logout') {
    const page = loginPage('已退出登录', 'email');
    const headers = new Headers(page.headers);
    headers.set('cache-control', 'no-store, no-cache, must-revalidate');
    headers.set('pragma', 'no-cache');
    headers.set('clear-site-data', '"cookies", "storage"');
    headers.append('set-cookie', clearCookie(COOKIE_NAME));
    headers.append('set-cookie', clearCookie(OTP_COOKIE));
    return new Response(page.body, { status: 200, headers });
  }

  if (inbound.pathname === '/__auth/password' && request.method === 'POST') {
    const form = await parseForm(request);
    if (String(form.password || '') !== cfg.gatePassword) return loginPage('口令错误', 'password');
    return redirectHome(await makeToken({ typ: 'session', via: 'password' }, SESSION_TTL_SEC, cfg.sessionSecret));
  }

  if (inbound.pathname === '/__auth/otp/send' && request.method === 'POST') {
    const form = await parseForm(request);
    const email = String(form.email || '').trim().toLowerCase();
    if (!cfg.allowedEmails.has(email)) return loginPage('该邮箱不在白名单', 'email', email);
    const code = randomOtp();
    const codeHash = await sha256Hex(code + ':' + email);
    const otpTok = await makeToken({ typ: 'otp', email, codeHash }, OTP_TTL_SEC, cfg.sessionSecret);
    let sendOk = false;
    let detail = '';
    try {
      const resp = await fetch(cfg.otpMailerUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-homer-otp-secret': cfg.otpMailerSecret },
        body: JSON.stringify({ email, code }),
      });
      const j = await resp.json().catch(() => ({}));
      sendOk = resp.ok && j.ok;
      if (!sendOk) detail = j.detail || j.error || String(resp.status);
    } catch (e) {
      detail = String(e);
    }
    const page = loginPage(sendOk ? '验证码已发送，请查收邮箱（含垃圾箱）' : `验证码发送失败：${detail || '请改用口令'}`, 'email', email);
    return new Response(await page.text(), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
        'vary': 'Cookie',
        'set-cookie': setCookie(OTP_COOKIE, otpTok, OTP_TTL_SEC),
      },
    });
  }

  if (inbound.pathname === '/__auth/otp/verify' && request.method === 'POST') {
    const form = await parseForm(request);
    const email = String(form.email || '').trim().toLowerCase();
    const code = String(form.code || '').trim();
    if (!cfg.allowedEmails.has(email) || !/^\d{6}$/.test(code)) return loginPage('邮箱或验证码无效', 'email', email);
    const pending = await readToken(getCookie(request, OTP_COOKIE), cfg.sessionSecret);
    if (!pending || pending.typ !== 'otp' || pending.email !== email) return loginPage('请先发送验证码', 'email', email);
    const codeHash = await sha256Hex(code + ':' + email);
    if (codeHash !== pending.codeHash) return loginPage('验证码错误', 'email', email);
    const token = await makeToken({ typ: 'session', via: 'otp', email }, SESSION_TTL_SEC, cfg.sessionSecret);
    const headers = new Headers({ location: '/', 'cache-control': 'no-store' });
    headers.append('set-cookie', setCookie(COOKIE_NAME, token, SESSION_TTL_SEC));
    headers.append('set-cookie', clearCookie(OTP_COOKIE));
    return new Response(null, { status: 302, headers });
  }

  if (inbound.pathname === '/__auth/login' || inbound.pathname === '/__auth') {
    return loginPage('', 'email');
  }

  const sessionTok = await readToken(getCookie(request, COOKIE_NAME), cfg.sessionSecret);
  if (!sessionTok || sessionTok.typ !== 'session') {
    const accept = (request.headers.get('accept') || '').toLowerCase();
    const path = inbound.pathname;
    const isDoc = request.method === 'GET' && (path === '/' || path === '/index.html' || accept.includes('text/html'));
    const looksAsset = /\.(yml|yaml|json|js|css|map|png|jpe?g|gif|svg|ico|woff2?|ttf|webp)(\?|$)/i.test(path)
      || path.startsWith('/assets/') || path.startsWith('/resources/');
    if (!isDoc || looksAsset) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'vary': 'Cookie',
        },
      });
    }
    return loginPage('', 'email');
  }

  return serveAssets(context, request, inbound, cfg);
}
