async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function onRequestPost({ request, env }: { request: Request; env: { DB: D1Database } }) {
  const contentType = request.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    return new Response(JSON.stringify({ error: "invalid_content_type" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    })
  }
  const body = await request.json()
  const email = typeof body.email === "string" ? body.email : ""
  const password = typeof body.password === "string" ? body.password : ""
  if (!email || !password || password.length < 7) {
    return new Response(JSON.stringify({ error: "invalid_input" }), {
      status: 400,
      headers: { "content-type": "application/json" }
    })
  }
  try {
    const id = crypto.randomUUID()
    const username = email.split('@')[0]
    const now = new Date().toISOString()

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
    ).run()

    const passwordHash = await sha256(password)
    await env.DB.prepare(
      `INSERT OR IGNORE INTO users (id, username, email, status, role, password_hash, password_updated_at, created_at, updated_at)
       VALUES (?, ?, ?, 'active', 'owner', ?, ?, ?, ?)`
    ).bind(id, username, email, passwordHash, now, now, now).run()

    const user = {
      accountNo: "ACC001",
      email,
      role: ["owner"],
      exp: Date.now() + 24 * 60 * 60 * 1000
    }
    const accessToken = "mock-access-token"
    return new Response(JSON.stringify({ user, accessToken }), {
      headers: { "content-type": "application/json" }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: "signup_failed" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    })
  }
}