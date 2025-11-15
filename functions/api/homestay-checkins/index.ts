export async function onRequestGet({ env, request }: { env: { DB: D1Database }; request: Request }) {
  try {
    // Check permission
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !await hasPermission(env, authHeader, '/check-in-logs', 'read')) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
    }
    
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
    const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get('pageSize') || '10')))
    const homestayId = url.searchParams.get('homestayId')
    const latestByHomestay = url.searchParams.get('latestByHomestay') === 'true'

    const tableCheck = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='homestay_checkins'").first()
    if (!tableCheck) {
      return new Response(null, { status: 204 })
    }

    if (latestByHomestay) {
      const sql = `
        SELECT hc.*
        FROM homestay_checkins hc
        INNER JOIN (
          SELECT homestay_id, MAX(submitted_at) AS max_submitted
          FROM homestay_checkins
          GROUP BY homestay_id
        ) latest ON latest.homestay_id = hc.homestay_id AND latest.max_submitted = hc.submitted_at
        ORDER BY hc.homestay_id ASC
      `
      const result = await env.DB.prepare(sql).all()
      const data = (result.results || []).map(mapRow)
      if (!data.length) return new Response(null, { status: 204 })
      return Response.json({ data })
    }

    const where: string[] = []
    const params: unknown[] = []
    if (homestayId) {
      where.push('homestay_id = ?')
      params.push(homestayId)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
    const offset = (page - 1) * pageSize

    const countStmt = env.DB.prepare(`SELECT COUNT(*) as count FROM homestay_checkins ${whereSql}`)
    const total = (await countStmt.bind(...params).first()) as { count?: number } | null

    const listSql = `
      SELECT *
      FROM homestay_checkins
      ${whereSql}
      ORDER BY submitted_at DESC
      LIMIT ? OFFSET ?
    `
    const result = await env.DB.prepare(listSql).bind(...params, pageSize, offset).all()
    const data = (result.results || []).map(mapRow)
    if (!data.length) return new Response(null, { status: 204 })
    return Response.json({ page, pageSize, total: (total?.count ?? 0), data })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch homestay check-ins' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

export async function onRequestPost({ env, request }: { env: { DB: D1Database }; request: Request }) {
  try {
    // Check permission
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !await hasPermission(env, authHeader, '/check-in', 'create')) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
    }
    
    const body = await request.json()

    if (!body.homestayId || !body.personInCharge || !body.numberOfGuests) {
      return new Response(JSON.stringify({ error: 'homestayId, personInCharge, numberOfGuests are required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    }

    const tableCheck = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='homestay_checkins'").first()
    if (!tableCheck) {
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS homestay_checkins (
          id TEXT PRIMARY KEY,
          homestay_id TEXT NOT NULL,
          person_in_charge TEXT NOT NULL,
          guests INTEGER NOT NULL,
          plates_json TEXT NOT NULL,
          arrival TEXT,
          departure TEXT,
          notes TEXT,
          submitted_at TEXT NOT NULL
        )`
      ).run()
      await env.DB.prepare(
        `CREATE INDEX IF NOT EXISTS idx_hc_homestay_submitted ON homestay_checkins(homestay_id, submitted_at)`
      ).run()
    }

    const id = crypto.randomUUID()
    const homestayId = String(body.homestayId).trim()
    const personInCharge = String(body.personInCharge).trim()
    const numberOfGuests = Number(body.numberOfGuests)
    const plates = Array.isArray(body.numberPlates)
      ? body.numberPlates.map((p: unknown) => String(p || '').trim()).filter(Boolean)
      : String(body.numberPlates || '')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
    const arrival = body.dateOfArrival ? String(body.dateOfArrival) : null
    const departure = body.dateOfDeparture ? String(body.dateOfDeparture) : null
    const notes = body.additionalNotes ? String(body.additionalNotes) : null
    const submittedAt = new Date().toISOString()

    const insertSql = `
      INSERT INTO homestay_checkins (id, homestay_id, person_in_charge, guests, plates_json, arrival, departure, notes, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    await env.DB.prepare(insertSql).bind(
      id,
      homestayId,
      personInCharge,
      numberOfGuests,
      JSON.stringify(plates),
      arrival,
      departure,
      notes,
      submittedAt,
    ).run()

    const created = {
      id,
      homestayId,
      personInCharge,
      numberOfGuests,
      numberPlates: plates,
      dateOfArrival: arrival || undefined,
      dateOfDeparture: departure || undefined,
      additionalNotes: notes || undefined,
      submittedAt,
    }

    return Response.json(created, { status: 201 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to create homestay check-in' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

function mapRow(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ''),
    homestayId: String((row.homestay_id as string) ?? ''),
    personInCharge: String((row.person_in_charge as string) ?? ''),
    numberOfGuests: Number(row.guests ?? 0),
    numberPlates: parseJsonArray(row.plates_json) || [],
    dateOfArrival: row.arrival ? String(row.arrival) : undefined,
    dateOfDeparture: row.departure ? String(row.departure) : undefined,
    additionalNotes: row.notes ? String(row.notes) : undefined,
    submittedAt: String(row.submitted_at ?? ''),
  }
}

function parseJsonArray(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.map((v) => String(v))
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed.map((v) => String(v)) : null
    } catch (_) {
      return null
    }
  }
  return null
}

async function hasPermission(env: { DB: D1Database }, authHeader: string, resource: string, action: string): Promise<boolean> {
  try {
    // Extract role from auth header (simplified - in real app, verify JWT token)
    const token = authHeader.replace('Bearer ', '')
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