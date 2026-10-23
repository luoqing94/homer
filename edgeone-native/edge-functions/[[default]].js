const SESSION_TTL_SEC = 7 * 24 * 3600;
const OTP_TTL_SEC = 10 * 60;
const COOKIE_NAME = 'homer_gate';
const OTP_COOKIE = 'homer_otp';
const CONFIG_HOST_PLACEHOLDER = 'CHANGE_ME.example.com';

const INLINE_INDEX_HTML = "<!DOCTYPE html>\n<html>\n  <head>\n    <meta charset=\"UTF-8\" />\n    <link rel=\"icon\" href=\"assets/icons/favicon.ico\" />\n    <link rel=\"apple-touch-icon\" href=\"assets/icons/apple-touch-icon.png\" sizes=\"180x180\">\n    <link rel=\"mask-icon\" href=\"assets/icons/logo.svg\">\n    <meta name=\"viewport\" content=\"width=device-width,initial-scale=1.0,viewport-fit=cover\">\n    <title>Homer</title>\n    <script type=\"module\" crossorigin src=\"./resources/index-C32yDzkE.js\"></script>\n    <link rel=\"stylesheet\" crossorigin href=\"./resources/index-CyPCBeHl.css\">\n  <link rel=\"manifest\" href=\"./assets/manifest.json\" crossorigin=\"use-credentials\"><script id=\"vite-plugin-pwa:register-sw\" src=\"./registerSW.js\"></script></head>\n  <body>\n    <div id=\"app-mount\"></div>\n  </body>\n</html>\n";
const INLINE_CONFIG_YML = "---\ntitle: \"Homer\"\nsubtitle: \"\"\nlogo: \"logo.png\"\n# icon: \"fas fa-home\"\n\nheader: true\nfooter: false\n\ntheme: default\nstylesheet:\n  - \"assets/custom.css\"\ncolors:\n  light:\n    highlight-primary: \"#3367d6\"\n    highlight-secondary: \"#4285f4\"\n    highlight-hover: \"#5a95f5\"\n    background: \"#f5f5f5\"\n    card-background: \"#ffffff\"\n    text: \"#363636\"\n    text-header: \"#ffffff\"\n    text-title: \"#303030\"\n    text-subtitle: \"#424242\"\n    card-shadow: rgba(0, 0, 0, 0.1)\n    link: \"#3273dc\"\n    link-hover: \"#363636\"\n  dark:\n    highlight-primary: \"#3367d6\"\n    highlight-secondary: \"#4285f4\"\n    highlight-hover: \"#5a95f5\"\n    background: \"#131313\"\n    card-background: \"#2b2b2b\"\n    text: \"#eaeaea\"\n    text-header: \"#ffffff\"\n    text-title: \"#fafafa\"\n    text-subtitle: \"#f5f5f5\"\n    card-shadow: rgba(0, 0, 0, 0.4)\n    link: \"#3273dc\"\n    link-hover: \"#ffdd57\"\n\nlinks: []\n\nservices:\n  - name: \"笔记与知识\"\n    icon: \"fas fa-book\"\n    items:\n      - name: \"EdgeEver\"\n        subtitle: \"自托管笔记 / MCP\"\n        logo: \"icons/edgeever.png\"\n        url: \"https://edgeever.CHANGE_ME.example.com\"\n        target: \"_blank\"\n      - name: \"FlareMo\"\n        subtitle: \"Cloudflare 备忘录\"\n        logo: \"icons/flaremo.png\"\n        url: \"https://flaremo.CHANGE_ME.example.com\"\n        target: \"_blank\"\n  - name: \"网盘\"\n    icon: \"fas fa-hdd\"\n    items:\n      - name: \"OpenList\"\n        subtitle: \"网盘聚合\"\n        logo: \"icons/openlist.png\"\n        url: \"https://openlist.CHANGE_ME.example.com\"\n        target: \"_blank\"\n  - name: \"影音\"\n    icon: \"fas fa-film\"\n    items:\n      - name: \"MoonTV\"\n        subtitle: \"影视\"\n        logo: \"icons/moontv.png\"\n        url: \"https://tv.CHANGE_ME.example.com\"\n        target: \"_blank\"\n  - name: \"工具\"\n    icon: \"fas fa-pencil-ruler\"\n    items:\n      - name: \"Excalidraw\"\n        subtitle: \"云端画布\"\n        logo: \"icons/excalidraw.png\"\n        url: \"https://excalidraw.CHANGE_ME.example.com\"\n        target: \"_blank\"\n  - name: \"资讯\"\n    icon: \"fas fa-newspaper\"\n    items:\n      - name: \"AI Hot News\"\n        subtitle: \"AI 热点资讯\"\n        logo: \"icons/aihot.png\"\n        url: \"https://aihot.news/\"\n        target: \"_blank\"\n      - name: \"NewsNow\"\n        subtitle: \"实时热榜聚合\"\n        logo: \"icons/newsnow.png\"\n        url: \"https://newsnow.busiyi.world\"\n        target: \"_blank\"\n  - name: \"部署平台\"\n    icon: \"fas fa-cloud\"\n    items:\n      - name: \"GitHub\"\n        subtitle: \"代码托管与 Actions 部署 · 账号 luoqing94\"\n        logo: \"icons/github.png\"\n        url: \"https://github.com/\"\n        target: \"_blank\"\n      - name: \"Vercel\"\n        subtitle: \"前端/函数托管 · 邮箱 lq280657463@gmail.com\"\n        logo: \"icons/vercel.png\"\n        url: \"https://vercel.com/\"\n        target: \"_blank\"\n      - name: \"腾讯 EdgeOne\"\n        subtitle: \"国内 Pages / 边缘托管 · 微信扫码\"\n        logo: \"icons/edgeone.png\"\n        url: \"https://console.cloud.tencent.com/edgeone\"\n        target: \"_blank\"\n      - name: \"Cloudflare\"\n        subtitle: \"DNS / Workers / Pages / D1·R2 · 邮箱 lq280657463@gmail.com\"\n        logo: \"icons/cloudflare.png\"\n        url: \"https://dash.cloudflare.com/\"\n        target: \"_blank\"\n      - name: \"Neon\"\n        subtitle: \"Postgres 数据库（moontvp）· 邮箱 lq280657463@gmail.com\"\n        logo: \"icons/neon.png\"\n        url: \"https://console.neon.tech/\"\n        target: \"_blank\"\n      - name: \"Upstash\"\n        subtitle: \"Redis（EdgeOne 侧 MoonTVPlus）· 邮箱 lq280657463@gmail.com\"\n        logo: \"icons/upstash.png\"\n        url: \"https://console.upstash.com/\"\n        target: \"_blank\"\n";
const INLINE_INDEX_ETAG = "W/\"f38e67cecb8b5598\"";
const INLINE_CONFIG_ETAG = "W/\"4cb3be2be7cb851c\"";

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
  return /^\/(?:assets\/)?config(-demo)?\.ya?ml$/i.test(path);
}

function rewriteConfigHosts(text, publicZone) {
  if (!publicZone) return text;
  return text.split(CONFIG_HOST_PLACEHOLDER).join(publicZone);
}

function stripWeak(tag) {
  return String(tag || '').trim().replace(/^W\//i, '');
}

function ifNoneMatchMatches(ifNoneMatch, etag) {
  if (!ifNoneMatch || !etag) return false;
  const raw = String(ifNoneMatch).trim();
  if (raw === '*') return true;
  const target = stripWeak(etag);
  return raw.split(',').some((part) => stripWeak(part) === target);
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

function renderAuthenticatedIndexHtml() {
  let html = INLINE_INDEX_HTML;
  if (!html.includes('homer-gate-logout')) {
    if (html.includes('</body>')) html = html.replace('</body>', LOGOUT_SNIPPET + '</body>');
    else html += LOGOUT_SNIPPET;
  }
  return html;
}

function isMissingStaticAssetPath(path) {
  return (
    /\.(?:yml|yaml|json|js|css|map|png|jpe?g|gif|svg|ico|woff2?|ttf|webp|txt|xml|webmanifest)$/i.test(path) ||
    path.startsWith('/assets/') ||
    path.startsWith('/resources/') ||
    path.startsWith('/icons/')
  );
}

function serveAuthenticated(request, inbound, cfg) {
  const path = inbound.pathname;
  const isGetOrHead = request.method === 'GET' || request.method === 'HEAD';

  if (isGetOrHead && isConfigYmlPath(path)) {
    const headers = {
      'content-type': 'text/yaml; charset=utf-8',
      'cache-control': 'private, max-age=300',
      'etag': INLINE_CONFIG_ETAG,
      'vary': 'Cookie',
      'x-homer-origin': 'edgeone-native-inline',
    };
    if (ifNoneMatchMatches(request.headers.get('if-none-match'), INLINE_CONFIG_ETAG)) {
      return new Response(null, { status: 304, headers });
    }
    const text = rewriteConfigHosts(INLINE_CONFIG_YML, cfg.publicZone);
    return new Response(request.method === 'HEAD' ? null : text, { status: 200, headers });
  }

  if (isMissingStaticAssetPath(path)) {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'x-homer-origin': 'edgeone-native-inline',
      },
    });
  }

  const htmlHeaders = {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'private, no-cache',
    'etag': INLINE_INDEX_ETAG,
    'vary': 'Cookie',
    'x-homer-origin': 'edgeone-native-inline',
  };
  if (isGetOrHead && ifNoneMatchMatches(request.headers.get('if-none-match'), INLINE_INDEX_ETAG)) {
    return new Response(null, { status: 304, headers: htmlHeaders });
  }
  const html = renderAuthenticatedIndexHtml();
  return new Response(request.method === 'HEAD' ? null : html, { status: 200, headers: htmlHeaders });
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

  return serveAuthenticated(request, inbound, cfg);
}
