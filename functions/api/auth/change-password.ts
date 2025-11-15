async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function onRequestPost({ env, request }: { env: { DB: D1Database }; request: Request }) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'invalid_content_type' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email : ''
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    if (!email || !newPassword || newPassword.length < 7) {
      return new Response(JSON.stringify({ error: 'invalid_input' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }

    const tableCheck = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").first()
    if (!tableCheck) {
      return new Response(JSON.stringify({ error: 'users_table_missing' }), { status: 400, headers: { 'content-type': 'application/json' } })
    }

    // Ensure columns exist
    try { await env.DB.prepare('ALTER TABLE users ADD COLUMN password_hash TEXT').run() } catch (_) {}
    try { await env.DB.prepare('ALTER TABLE users ADD COLUMN password_updated_at TEXT').run() } catch (_) {}

    const row = await env.DB.prepare('SELECT password_hash FROM users WHERE email = ? LIMIT 1').bind(email).first() as { password_hash?: string } | null
    if (!row) {
      return new Response(JSON.stringify({ error: 'user_not_found' }), { status: 404, headers: { 'content-type': 'application/json' } })
    }

    const existingHash = row?.password_hash || ''
    if (existingHash) {
      const currentHash = await sha256(currentPassword)
      if (currentHash !== existingHash) {
        return new Response(JSON.stringify({ error: 'invalid_current_password' }), { status: 400, headers: { 'content-type': 'application/json' } })
      }
    } else {
      if (!currentPassword) {
        return new Response(JSON.stringify({ error: 'current_password_required' }), { status: 400, headers: { 'content-type': 'application/json' } })
      }
    }

    const newHash = await sha256(newPassword)
    const now = new Date().toISOString()
    await env.DB.prepare('UPDATE users SET password_hash = ?, password_updated_at = ? WHERE email = ?').bind(newHash, now, email).run()
    return Response.json({ success: true })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'change_password_failed' }), { status: 500, headers: { 'content-type': 'application/json' } })
  }
}