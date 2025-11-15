export async function onRequestGet({ params, env }: { params: { id: string }; env: { DB: D1Database } }) {
  await ensureSchema(env)
  const role = await env.DB.prepare(`SELECT id, name, description FROM roles WHERE id = ?`).bind(params.id).first()
  if (!role) {
    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    })
  }
  const perms = await env.DB.prepare(
    `SELECT resource, can_create, can_read, can_update, can_delete FROM role_permissions WHERE role_id = ?`
  ).bind(params.id).all()
  return new Response(JSON.stringify({ role, permissions: perms.results || [] }), {
    headers: { 'content-type': 'application/json' },
  })
}

export async function onRequestPut({ request, params, env }: { request: Request; params: { id: string }; env: { DB: D1Database } }) {
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
  const up = await env.DB.prepare(
    `UPDATE roles SET name = ?, description = ?, updated_at = ? WHERE id = ?`
  )
    .bind(name, description, new Date().toISOString(), params.id)
    .run()
  if (!up.success) {
    return new Response(JSON.stringify({ error: 'update_failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ id: params.id, name, description }), {
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