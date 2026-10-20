const ORIGIN_HOST = 'homer-home-5b7.pages.dev';
const ORIGIN = `https://${ORIGIN_HOST}`;

const CF_ACCESS_CLIENT_ID = 'CHANGE_ME_CF_ACCESS_CLIENT_ID';
const CF_ACCESS_CLIENT_SECRET = 'CHANGE_ME_CF_ACCESS_CLIENT_SECRET';

const GATE_PASSWORD = 'CHANGE_ME_GATE_PASSWORD';
const ALLOWED_EMAILS = new Set([
  'you@example.com',
]);
const SESSION_SECRET = 'CHANGE_ME_SESSION_SECRET';
const SESSION_TTL_SEC = 7 * 24 * 3600;
const OTP_TTL_SEC = 10 * 60;
const COOKIE_NAME = 'homer_gate';
const OTP_COOKIE = 'homer_otp';
const OTP_MAILER_URL = 'CHANGE_ME_OTP_MAILER_URL';
const OTP_MAILER_SECRET = 'CHANGE_ME_OTP_MAILER_SECRET';

const HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailers', 'transfer-encoding', 'upgrade', 'host', 'content-length',
]);

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

async function hmacSign(payload) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64url(sig);
}

async function makeToken(data, ttlSec) {
  const body = { ...data, exp: Math.floor(Date.now() / 1000) + ttlSec };
  const payload = b64url(new TextEncoder().encode(JSON.stringify(body)));
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

async function readToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expect = await hmacSign(payload);
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
<title>Homer 登录</title>
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
<p class="sub">登录后继续（会话 7 天）</p>
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

async function proxyOrigin(request, inbound) {
  const targetUrl = ORIGIN + inbound.pathname + inbound.search;
  const headers = new Headers();
  for (const [k, v] of request.headers) {
    if (HOP.has(k.toLowerCase())) continue;
    headers.append(k, v);
  }
  headers.set('host', ORIGIN_HOST);
  headers.set('x-forwarded-host', inbound.host);
  headers.set('x-forwarded-proto', inbound.protocol.replace(':', ''));
  headers.set('CF-Access-Client-Id', CF_ACCESS_CLIENT_ID);
  headers.set('CF-Access-Client-Secret', CF_ACCESS_CLIENT_SECRET);
  headers.set('accept-encoding', 'identity');
  if (!headers.has('x-forwarded-for')) {
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '';
    if (ip) headers.set('x-forwarded-for', ip);
  }
  const method = request.method || 'GET';
  const init = { method, headers, redirect: 'manual' };
  if (method !== 'GET' && method !== 'HEAD') init.body = request.body;
  let upstream;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'origin_fetch_failed', detail: String(err) }), {
      status: 502, headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
  const out = new Headers();
  for (const [k, v] of upstream.headers) {
    const lk = k.toLowerCase();
    if (lk === 'transfer-encoding' || lk === 'content-encoding' || lk === 'content-length') continue;
    if (lk === 'location' || lk === 'set-cookie') {
      out.append(k, v.split(ORIGIN).join(inbound.origin)
        .split(`https://${ORIGIN_HOST}`).join(inbound.origin)
        .split(ORIGIN_HOST).join(inbound.host));
      continue;
    }
    out.append(k, v);
  }
  out.set('cache-control', 'private, no-store');
  out.set('vary', 'Cookie');

  const ctype = (upstream.headers.get('content-type') || '').toLowerCase();
  const wantLogout = method === 'GET' && upstream.status === 200 && ctype.includes('text/html')
    && (inbound.pathname === '/' || inbound.pathname === '/index.html' || inbound.pathname.endsWith('.html'));
  if (wantLogout) {
    let html = await upstream.text();
    if (!html.includes('homer-gate-logout')) {
      if (html.includes('</body>')) html = html.replace('</body>', LOGOUT_SNIPPET + '</body>');
      else html += LOGOUT_SNIPPET;
    }
    return new Response(html, { status: upstream.status, statusText: upstream.statusText, headers: out });
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
    if (String(form.password || '') !== GATE_PASSWORD) return loginPage('口令错误', 'password');
    return redirectHome(await makeToken({ typ: 'session', via: 'password' }, SESSION_TTL_SEC));
  }

  if (inbound.pathname === '/__auth/otp/send' && request.method === 'POST') {
    const form = await parseForm(request);
    const email = String(form.email || '').trim().toLowerCase();
    if (!ALLOWED_EMAILS.has(email)) return loginPage('该邮箱不在白名单', 'email', email);
    const code = randomOtp();
    const codeHash = await sha256Hex(code + ':' + email);
    const otpTok = await makeToken({ typ: 'otp', email, codeHash }, OTP_TTL_SEC);
    let sendOk = false;
    let detail = '';
    try {
      const resp = await fetch(OTP_MAILER_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-homer-otp-secret': OTP_MAILER_SECRET },
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
    if (!ALLOWED_EMAILS.has(email) || !/^\d{6}$/.test(code)) return loginPage('邮箱或验证码无效', 'email', email);
    const pending = await readToken(getCookie(request, OTP_COOKIE));
    if (!pending || pending.typ !== 'otp' || pending.email !== email) return loginPage('请先发送验证码', 'email', email);
    const codeHash = await sha256Hex(code + ':' + email);
    if (codeHash !== pending.codeHash) return loginPage('验证码错误', 'email', email);
    const token = await makeToken({ typ: 'session', via: 'otp', email }, SESSION_TTL_SEC);
    const headers = new Headers({ location: '/', 'cache-control': 'no-store' });
    headers.append('set-cookie', setCookie(COOKIE_NAME, token, SESSION_TTL_SEC));
    headers.append('set-cookie', clearCookie(OTP_COOKIE));
    return new Response(null, { status: 302, headers });
  }

  if (inbound.pathname === '/__auth/login' || inbound.pathname === '/__auth') {
    return loginPage('', 'email');
  }

  const sessionTok = await readToken(getCookie(request, COOKIE_NAME));
  if (!sessionTok || sessionTok.typ !== 'session') {
    const accept = (request.headers.get('accept') || '').toLowerCase();
    const path = inbound.pathname;
    const isDoc = request.method === 'GET' && (path === '/' || path === '/index.html' || accept.includes('text/html'));
    const looksAsset = /\.(yml|yaml|json|js|css|map|png|jpe?g|gif|svg|ico|woff2?|ttf|webp)(\?|$)/i.test(path)
      || path.startsWith('/assets/');
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

  return proxyOrigin(request, inbound);
}
