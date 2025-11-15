export async function onRequestPatch({ request, params, env }: {
  request: Request
  params: { userId: string }
  env: { DB: D1Database }
}) {
  try {
    // Check permission
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !await hasPermission(env, authHeader, '/users', 'update')) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      })
    }
    
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'invalid_content_type' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    const body = await request.json()
    const { role } = body

    const validRoles = ['admin', 'owner', 'guard']
    if (!role || !validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'invalid_role' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    const now = new Date().toISOString()
    const stmt = env.DB.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
    await stmt.bind(role, now, params.userId).run()

    return new Response(JSON.stringify({ success: true, role }), {
      headers: { 'content-type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return new Response(JSON.stringify({ error: 'internal_server_error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
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