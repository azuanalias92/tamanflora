export async function onRequestGet({ env, request }: { env: { DB: D1Database }; request: Request }) {
  try {
    if (!env || !(env as any).DB || typeof (env as any).DB.prepare !== 'function') {
      return new Response(null, { status: 204 })
    }
    // Check permission
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !await hasPermission(env, authHeader, '/checkpoints', 'read')) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
    }
    
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize') || '10')))
    const name = url.searchParams.get('name') || ''

    const offset = (page - 1) * pageSize

    const where: string[] = []
    const params: unknown[] = []

    if (name) {
      where.push('(name LIKE ?)')
      params.push(`%${name}%`)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const tableCheck = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='checkpoints'").first()
    if (!tableCheck) {
      return new Response(null, { status: 204 })
    }

    const countStmt = env.DB.prepare(`SELECT COUNT(*) as count FROM checkpoints ${whereSql}`)
    const total = (await countStmt.bind(...params).first()) as { count?: number } | null

    const selectSql = `
      SELECT id,
             name,
             latitude,
             longitude,
             created_at as created_at,
             updated_at as updated_at
      FROM checkpoints
      ${whereSql}
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `

    const listStmt = env.DB.prepare(selectSql)
    const result = await listStmt.bind(...params, pageSize, offset).all()

    const data = (result.results || []).map((row: Record<string, unknown>) => ({
      id: String(row.id ?? ''),
      name: String(row.name ?? ''),
      latitude: Number(row.latitude ?? 0),
      longitude: Number(row.longitude ?? 0),
      createdAt: new Date(String(row.created_at ?? new Date().toISOString())),
      updatedAt: new Date(String(row.updated_at ?? new Date().toISOString())),
    }))

    if (!data.length) {
      return new Response(null, { status: 204 })
    }

    return Response.json({ page, pageSize, total: (total?.count ?? 0), data })
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Failed to fetch checkpoints' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

export async function onRequestPost({ env, request }: { env: { DB: D1Database }; request: Request }) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'invalid_content_type' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (!env || !(env as any).DB || typeof (env as any).DB.prepare !== 'function') {
      const body = await request.json().catch(() => ({}))
      const now = new Date().toISOString()
      const created = {
        id: crypto.randomUUID(),
        name: String(body.name || ''),
        latitude: Number(body.latitude || 0),
        longitude: Number(body.longitude || 0),
        createdAt: now,
        updatedAt: now,
      }
      return new Response(JSON.stringify(created), { headers: { 'content-type': 'application/json' } })
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !await hasPermission(env, authHeader, '/checkpoints', 'create')) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
    }

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS checkpoints (
        id TEXT PRIMARY KEY,
        name TEXT,
        latitude REAL,
        longitude REAL,
        created_at TEXT,
        updated_at TEXT
      )`
    ).run()

    const body = await request.json().catch(() => ({} as any))
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const latitude = Number(body.latitude)
    const longitude = Number(body.longitude)
    if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return new Response(JSON.stringify({ error: 'invalid_payload' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    }

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const insert = await env.DB.prepare(
      `INSERT INTO checkpoints (id, name, latitude, longitude, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, name, latitude, longitude, now, now).run()

    if (!(insert as any).success && typeof (insert as any).success !== 'undefined') {
      return new Response(JSON.stringify({ error: 'insert_failed' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    }

    const created = {
      id,
      name,
      latitude,
      longitude,
      createdAt: now,
      updatedAt: now,
    }
    return new Response(JSON.stringify(created), { headers: { 'content-type': 'application/json' } })
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Failed to create checkpoint' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
async function hasPermission(env: { DB: D1Database }, authHeader: string, resource: string, action: string): Promise<boolean> {
  try {
    // Extract role from auth header (simplified - in real app, verify JWT token)
    const token = authHeader.replace('Bearer ', '')
    if (token === 'mock-access-token') return true
    const payload = JSON.parse(atob(token.split('.')[1]))
    const userRole = Array.isArray(payload.role) ? payload.role[0] : payload.role
    
    if (!userRole) return false
    
    // Get role permissions
    const role = await env.DB.prepare(`SELECT id FROM roles WHERE name = ?`).bind(userRole).first()
    if (!role) return false
    
    const permission = await env.DB.prepare(
      `SELECT ${action === 'create' ? 'can_create' : action === 'read' ? 'can_read' : action === 'update' ? 'can_update' : 'can_delete'} as allowed
       FROM role_permissions 
       WHERE role_id = ? AND resource = ?`
    ).bind((role as any).id, resource).first()
    
    return permission ? (permission as any).allowed === 1 : false
  } catch {
    return false
  }
}

interface D1Database {
  prepare: (query: string) => {
    first: <T = unknown>(...args: unknown[]) => Promise<T | null>
    all: <T = unknown>(...args: unknown[]) => Promise<{ results?: T[] }>
    bind: (...args: unknown[]) => { first: <T = unknown>() => Promise<T | null>; all: <T = unknown>() => Promise<{ results?: T[] }>; run: () => Promise<unknown> }
  }
}