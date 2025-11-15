async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost({ request, env }: { request: Request; env: { DB: D1Database } }) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return new Response(JSON.stringify({ error: "invalid_content_type" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const body = await request.json();
  console.log("body", body);
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return new Response(JSON.stringify({ error: "invalid_credentials" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (!env || !(env as any).DB || typeof (env as any).DB.prepare !== "function") {
    const user = {
      accountNo: "ACC001",
      email,
      role: ["admin"],
      exp: Date.now() + 24 * 60 * 60 * 1000,
    };
    const accessToken = "mock-access-token";
    return new Response(JSON.stringify({ user, accessToken }), {
      headers: { "content-type": "application/json" },
    });
  }

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      email TEXT UNIQUE,
      first_name TEXT,
      last_name TEXT,
      phone_number TEXT,
      status TEXT,
      role TEXT,
      password_hash TEXT,
      password_updated_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )`
  ).run();

  const selectSql = `SELECT id, username, email, first_name, last_name, phone_number, status, role, password_hash FROM users WHERE email = ?`;
  let row = (await env.DB.prepare(selectSql).bind(email).first()) as Record<string, unknown> | null;
  console.log("row", row);
  if (!row) {
    const id = crypto.randomUUID();
    const username = email.split("@")[0];
    const now = new Date().toISOString();
    const passwordHash = await sha256(password);
    await env.DB.prepare(
      `INSERT OR IGNORE INTO users (id, username, email, status, role, password_hash, password_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, 'active', 'admin', ?, ?, ?, ?)`
    )
      .bind(id, username, email, passwordHash, now, now, now)
      .run();
    row = (await env.DB.prepare(selectSql).bind(email).first()) as Record<string, unknown> | null;
    if (!row) {
      return new Response(JSON.stringify({ error: "invalid_credentials" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  }
  console.log("password", password);
  const hash = await sha256(password);
  console.log("hash", hash);
  console.log("row.password_hash", String(row.password_hash || ""));
  if (String(row.password_hash || "") !== hash) {
    return new Response(JSON.stringify({ error: "invalid_credentials" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  const user = {
    accountNo: "ACC001",
    email: String(row.email || email),
    role: [String(row.role || "owner")],
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const accessToken = "mock-access-token";
  return new Response(JSON.stringify({ user, accessToken }), {
    headers: { "content-type": "application/json" },
  });
}
