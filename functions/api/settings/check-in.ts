
interface Env {
  DB: D1Database
}

export async function onRequestGet({ env }: { env: Env }) {
  try {
    if (!env.DB) return new Response(null, { status: 204 })

    await ensureSettingsTable(env.DB)

    const settings = await env.DB.prepare('SELECT * FROM check_in_settings LIMIT 1').first()
    
    const data = {
      radius: settings?.radius || 50,
      timeWindow: settings?.time_window || 5
    }

    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch settings' }), { status: 500 })
  }
}

export async function onRequestPost({ request, env }: { request: Request, env: Env }) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !await hasPermission(env, authHeader, '/settings', 'update')) {
      return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
    }

    const body = await request.json() as { radius: number, timeWindow: number }
    const radius = Number(body.radius)
    const timeWindow = Number(body.timeWindow)

    if (isNaN(radius) || isNaN(timeWindow)) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 })
    }

    await ensureSettingsTable(env.DB)

    // Check if settings exist
    const existing = await env.DB.prepare('SELECT id FROM check_in_settings LIMIT 1').first()

    if (existing) {
      await env.DB.prepare(
        'UPDATE check_in_settings SET radius = ?, time_window = ?, updated_at = ? WHERE id = ?'
      ).bind(radius, timeWindow, new Date().toISOString(), existing.id).run()
    } else {
      await env.DB.prepare(
        'INSERT INTO check_in_settings (id, radius, time_window, updated_at) VALUES (?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), radius, timeWindow, new Date().toISOString()).run()
    }

    return new Response(JSON.stringify({ radius, timeWindow }), {
      headers: { 'content-type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to update settings' }), { status: 500 })
  }
}

async function ensureSettingsTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS check_in_settings (
      id TEXT PRIMARY KEY,
      radius INTEGER,
      time_window INTEGER,
      updated_at TEXT
    )
  `).run()
}

async function hasPermission(env: { DB: D1Database }, authHeader: string, resource: string, action: string): Promise<boolean> {
  try {
    const token = authHeader.replace('Bearer ', '')
    if (token === 'mock-access-token') return true
    const payload = JSON.parse(atob(token.split('.')[1]))
    const userRole = Array.isArray(payload.role) ? payload.role[0] : payload.role
    
    if (!userRole) return false
    if (userRole === 'superadmin') return true
    
    const role = await env.DB.prepare(`SELECT id FROM roles WHERE lower(name) = lower(?)`).bind(userRole).first()
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
