const ALLOWED_COLLECTIONS = new Set(["entries", "activities", "customLexicon"]);
const PACK_ID = "en-AU-whv";
const MAX_BODY_BYTES = 1_000_000;
const MAX_CHANGES = 100;
const SESSION_COOKIE = "sayflow_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const localDevelopment = url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (url.pathname === "/api/login" && request.method === "POST") {
      return authenticate(request, env);
    }
    if (url.pathname === "/login" && request.method === "GET") {
      return loginPage(url.searchParams.has("error"));
    }

    if (!localDevelopment && !(await hasValidSession(request, env))) {
      if (url.pathname.startsWith("/api/")) {
        return jsonResponse({ error: "Authentication required" }, 401);
      }
      return withSecurityHeaders(loginPage(false, true));
    }

    if (url.pathname !== "/api/sync") {
      return withSecurityHeaders(await env.ASSETS.fetch(request));
    }

    const origin = request.headers.get("Origin");
    if (origin) {
      try {
        if (new URL(origin).host !== url.host) {
          return jsonResponse({ error: "Cross-origin sync is not allowed" }, 403);
        }
      } catch {
        return jsonResponse({ error: "Invalid origin" }, 403);
      }
    }

    try {
      if (request.method === "GET") {
        return await readState(request, env, url);
      }
      if (request.method === "PUT") {
        return await writeState(request, env);
      }
      return jsonResponse({ error: "Method not allowed" }, 405, {
        Allow: "GET, PUT"
      });
    } catch (error) {
      console.error("sync failed", error);
      return jsonResponse({ error: "Sync service unavailable" }, 500);
    }
  }
};

async function authenticate(request, env) {
  if (!env.SAYFLOW_PASSWORD || !env.SAYFLOW_SESSION_SECRET) {
    return new Response("Login is not configured", { status: 503 });
  }
  let form;
  try {
    form = await request.formData();
  } catch {
    return new Response("Invalid form", { status: 400 });
  }
  const password = String(form.get("password") || "");
  if (!(await secureEqual(password, env.SAYFLOW_PASSWORD))) {
    return redirectResponse("/login?error=1");
  }

  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const value = String(expires);
  const signature = await signValue(value, env.SAYFLOW_SESSION_SECRET);
  return redirectResponse("/", [
    `${SESSION_COOKIE}=${value}.${signature}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_SECONDS}`
  ].join("; "));
}

async function hasValidSession(request, env) {
  if (!env.SAYFLOW_SESSION_SECRET) return false;
  const cookie = request.headers.get("Cookie") || "";
  const value = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || Number(expires) <= Math.floor(Date.now() / 1000)) {
    return false;
  }
  const expected = await signValue(expires, env.SAYFLOW_SESSION_SECRET);
  return secureEqual(signature, expected);
}

async function signValue(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

async function secureEqual(left, right) {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(left))),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(right)))
  ]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    difference |= (a[index] || 0) ^ (b[index] || 0);
  }
  return difference === 0;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function redirectResponse(location, cookie = "") {
  const headers = {
    Location: location,
    "Cache-Control": "no-store"
  };
  if (cookie) headers["Set-Cookie"] = cookie;
  return new Response(null, { status: 303, headers });
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  headers.set("Referrer-Policy", "same-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function loginPage(hasError = false, wholeSite = false) {
  const title = wholeSite ? "随说 SayFlow" : "登录随说 SayFlow";
  return new Response(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${title}</title>
  <style>
    :root { color-scheme: light; font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { min-height: 100dvh; margin: 0; display: grid; place-items: center; color: #1d2520; background: #eef4ed; }
    main { width: min(360px, calc(100vw - 40px)); padding: 28px; border: 1px solid #d5dfd7; border-radius: 22px; background: #fffef8; box-shadow: 0 24px 70px rgba(29,37,32,.12); }
    h1 { margin: 0 0 8px; font-family: Georgia, serif; font-size: 30px; font-weight: 500; }
    p { margin: 0 0 22px; color: #647067; font-size: 13px; line-height: 1.6; }
    label { display: grid; gap: 7px; color: #435248; font-size: 12px; }
    input { height: 46px; padding: 0 13px; border: 1px solid #c9d5cc; border-radius: 12px; font: inherit; }
    button { width: 100%; height: 46px; margin-top: 15px; border: 0; border-radius: 999px; color: white; background: #31543e; font: inherit; font-weight: 700; cursor: pointer; }
    .error { margin: 0 0 14px; color: #a34f39; font-size: 12px; }
  </style>
</head>
<body>
  <main>
    <h1>随说 SayFlow</h1>
    <p>输入个人访问密码。登录状态会在这台设备上保留 30 天。</p>
    ${hasError ? '<p class="error">密码不正确，请重新输入。</p>' : ""}
    <form method="post" action="/api/login">
      <label>访问密码
        <input name="password" type="password" autocomplete="current-password" required autofocus>
      </label>
      <button type="submit">进入随说</button>
    </form>
  </main>
</body>
</html>`, {
    status: hasError ? 401 : 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

async function readState(request, env, url) {
  const packId = url.searchParams.get("packId") || PACK_ID;
  if (packId !== PACK_ID) {
    return jsonResponse({ error: "Unknown pack" }, 400);
  }
  if (!env.DB) {
    return jsonResponse({ error: "Database binding missing" }, 503);
  }

  const ownerId = env.SYNC_OWNER_ID || "primary";
  const result = await env.DB.prepare(
    `SELECT collection, record_id, updated_at, deleted, payload
     FROM sync_records
     WHERE owner_id = ? AND pack_id = ?
     ORDER BY updated_at ASC`
  ).bind(ownerId, packId).all();

  return jsonResponse({
    ok: true,
    packId,
    records: (result.results || []).map((row) => ({
      collection: row.collection,
      id: row.record_id,
      updatedAt: row.updated_at,
      deleted: Boolean(row.deleted),
      data: row.deleted ? null : safeParse(row.payload, {})
    }))
  });
}

async function writeState(request, env) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Sync payload is too large" }, 413);
  }
  if (!env.DB) {
    return jsonResponse({ error: "Database binding missing" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }
  if (body?.packId !== PACK_ID) {
    return jsonResponse({ error: "Unknown pack" }, 400);
  }

  const changes = Array.isArray(body.changes) ? body.changes : [];
  if (!changes.length || changes.length > MAX_CHANGES) {
    return jsonResponse({ error: "Invalid change count" }, 400);
  }

  const ownerId = env.SYNC_OWNER_ID || "primary";
  const statements = [];
  for (const change of changes) {
    const collection = String(change?.collection || "");
    const id = String(change?.id || "");
    const updatedAt = String(change?.updatedAt || "");
    if (
      !ALLOWED_COLLECTIONS.has(collection) ||
      !id ||
      id.length > 160 ||
      !/^\d{4}-\d{2}-\d{2}T/.test(updatedAt) ||
      Number.isNaN(new Date(updatedAt).getTime())
    ) {
      return jsonResponse({ error: "Invalid sync record" }, 400);
    }

    const deleted = change.deleted === true;
    const payload = deleted ? "{}" : JSON.stringify(change?.data || {});
    if (payload.length > 220_000) {
      return jsonResponse({ error: "One sync record is too large" }, 413);
    }
    statements.push(
      env.DB.prepare(
        `INSERT INTO sync_records
          (owner_id, pack_id, collection, record_id, updated_at, deleted, payload)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(owner_id, pack_id, collection, record_id) DO UPDATE SET
           updated_at = excluded.updated_at,
           deleted = excluded.deleted,
           payload = excluded.payload
         WHERE excluded.updated_at >= sync_records.updated_at`
      ).bind(
        ownerId,
        PACK_ID,
        collection,
        id,
        updatedAt,
        deleted ? 1 : 0,
        payload
      )
    );
  }

  await env.DB.batch(statements);
  return jsonResponse({
    ok: true,
    accepted: changes.length,
    syncedAt: new Date().toISOString()
  });
}

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders
    }
  });
}
