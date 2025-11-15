export async function onRequestGet({ env }: { env: { DB: D1Database } }) {
  await ensureSchema(env)
  const rows = await env.DB.prepare(
    `SELECT id, name, description FROM roles ORDER BY name`
  ).all()
  return new Response(JSON.stringify(rows.results || []), {
    headers: { 'content-type': 'application/json' },
  })
}

export async function onRequestPost({ request, env }: { request: Request; env: { DB: D1Database } }) {
  await ensureSchema(env)
  const json = await request.json().catch(() => ({} as any))
  const name = typeof json.name === 'string' ? json.name.trim() : ''
  const description = typeof json.description === 'string' ? json.description.trim() : ''
  if (!name) {
    return new Response(JSON.stringify({ error: 'invalid_name' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
  }
  const id = crypto.randomUUID()
  const insert = await env.DB.prepare(
    `INSERT INTO roles (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, name, description, new Date().toISOString(), new Date().toISOString())
    .run()
  if (!insert.success) {
    return new Response(JSON.stringify({ error: 'insert_failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ id, name, description }), {
    headers: { 'content-type': 'application/json' },
  })
}

async function ensureSchema(env: { DB: D1Database }) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE,
      description TEXT,
      created_at TEXT,
      updated_at TEXT
    )`
  ).run()
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT,
      resource TEXT,
      can_create INTEGER,
      can_read INTEGER,
      can_update INTEGER,
      can_delete INTEGER,
      PRIMARY KEY (role_id, resource)
    )`
  ).run()
}