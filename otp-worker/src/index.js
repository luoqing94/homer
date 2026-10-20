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

function allowedEmails(env) {
  const fromEnv = env && env.ALLOWED_EMAILS;
  const fromProc = typeof process !== 'undefined' && process.env ? process.env.ALLOWED_EMAILS : undefined;
  const raw = fromEnv != null && String(fromEnv).trim() !== ''
    ? fromEnv
    : (fromProc != null && String(fromProc).trim() !== '' ? fromProc : 'you@example.com');
  return parseAllowedEmails(raw);
}

async function writeOutbox(env, email, code) {
  if (!env.OUTBOX) return null;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const rec = { id, email, code, createdAt: Date.now(), status: 'pending' };
  await env.OUTBOX.put(`pending:${id}`, JSON.stringify(rec), { expirationTtl: 600 });
  await env.OUTBOX.put('latest', JSON.stringify(rec), { expirationTtl: 600 });
  return id;
}

async function tryBrevo(env, email, code) {
  if (!env.BREVO_API_KEY) return { ok: false, detail: 'no_brevo_key' };
  const from = env.BREVO_FROM || 'CHANGE_ME@example.com';
  const fromName = env.BREVO_FROM_NAME || 'Homer Auth';
  const subject = 'Homer 登录验证码';
  const text = `你的 Homer 登录验证码是：${code}\n\n10 分钟内有效。如非本人操作请忽略。`;
  const html = `<p>你的 Homer 登录验证码是：<strong style="font-size:20px;letter-spacing:2px">${code}</strong></p><p>10 分钟内有效。如非本人操作请忽略。</p>`;
  try {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: from, name: fromName },
        to: [{ email }],
        subject,
        textContent: text,
        htmlContent: html,
        tags: ['homer-otp'],
      }),
    });
    const body = await resp.json().catch(() => ({}));
    if (resp.ok || resp.status === 201) {
      return { ok: true, messageId: body.messageId };
    }
    return {
      ok: false,
      detail: body.message || body.code || `http_${resp.status}`,
      code: body.code,
    };
  } catch (err) {
    return { ok: false, detail: String(err && err.message ? err.message : err) };
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, GET, OPTIONS',
          'access-control-allow-headers': 'content-type, x-homer-otp-secret',
        },
      });
    }

    const got = request.headers.get('x-homer-otp-secret') || '';
    if (!env.SHARED_SECRET || got !== env.SHARED_SECRET) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/outbox') {
      if (!env.OUTBOX) return Response.json({ ok: false, error: 'no_outbox' }, { status: 500 });
      const list = await env.OUTBOX.list({ prefix: 'pending:' });
      const items = [];
      for (const k of list.keys) {
        const raw = await env.OUTBOX.get(k.name);
        if (raw) items.push(JSON.parse(raw));
      }
      return Response.json({ ok: true, items });
    }

    if (request.method === 'POST' && url.pathname === '/outbox/ack') {
      const body = await request.json().catch(() => ({}));
      const id = String(body.id || '');
      if (!id || !env.OUTBOX) return Response.json({ ok: false, error: 'bad' }, { status: 400 });
      await env.OUTBOX.delete(`pending:${id}`);
      return Response.json({ ok: true });
    }

    if (request.method !== 'POST') {
      return Response.json({ ok: false, error: 'method' }, { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ ok: false, error: 'bad_json' }, { status: 400 });
    }
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || '').trim();
    if (!allowedEmails(env).has(email) || !/^\d{6}$/.test(code)) {
      return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
    }

    const outboxId = await writeOutbox(env, email, code);
    const brevo = await tryBrevo(env, email, code);
    const ok = brevo.ok || !!outboxId;
    return Response.json({
      ok,
      via: brevo.ok ? 'brevo' : (outboxId ? 'outbox' : 'none'),
      outboxId,
      messageId: brevo.messageId,
      detail: brevo.ok ? undefined : brevo.detail,
      errCode: brevo.code,
    }, { status: ok ? 200 : 502 });
  },
};
