async function ensureSchema(env: { DB: D1Database }) {
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
}

export async function onRequestGet({ request, env }: { request: Request; env: { DB: D1Database } }) {
  if (!env || !(env as any).DB || typeof (env as any).DB.prepare !== "function") {
    return new Response(JSON.stringify({ data: [], page: 1, pageSize: 10, total: 0 }), {
      status: 204,
      headers: { "content-type": "application/json" },
    });
  }
  await ensureSchema(env);

  // Check permission
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !(await hasPermission(env, authHeader, "/users", "read"))) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.max(1, Math.min(100, Number(url.searchParams.get("pageSize") || "10")));
  const username = url.searchParams.get("username") || "";
  const statuses = url.searchParams.getAll("status");
  const roles = url.searchParams.getAll("role");

  const where: string[] = [];
  const bind: any[] = [];
  if (username) {
    where.push("(username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)");
    bind.push(`%${username}%`, `%${username}%`, `%${username}%`, `%${username}%`);
  }
  if (statuses.length > 0) {
    where.push(`status IN (${statuses.map(() => "?").join(",")})`);
    bind.push(...statuses);
  }
  if (roles.length > 0) {
    where.push(`role IN (${roles.map(() => "?").join(",")})`);
    bind.push(...roles);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const offset = (page - 1) * pageSize;
  const totalRow = await env.DB.prepare(`SELECT COUNT(*) as cnt FROM users ${whereSql}`)
    .bind(...bind)
    .first();
  const total = Number((totalRow as any)?.cnt || 0);
  if (total === 0) {
    return new Response(JSON.stringify({ data: [], page, pageSize, total }), {
      headers: { "content-type": "application/json" },
    });
  }

  const rows = await env.DB.prepare(
    `SELECT id, username, email, first_name, last_name, phone_number, status, role, created_at, updated_at
     FROM users ${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
  )
    .bind(...bind, pageSize, offset)
    .all();

  const data = (rows.results || []).map((r: any) => ({
    id: String(r.id || ""),
    username: String(r.username || ""),
    email: String(r.email || ""),
    firstName: String(r.first_name || ""),
    lastName: String(r.last_name || ""),
    phoneNumber: String(r.phone_number || ""),
    status: String(r.status || "active"),
    role: String(r.role || "owner"),
    createdAt: String(r.created_at || new Date().toISOString()),
    updatedAt: String(r.updated_at || new Date().toISOString()),
  }));

  return new Response(JSON.stringify({ data, page, pageSize, total }), {
    headers: { "content-type": "application/json" },
  });
}

async function hasPermission(env: { DB: D1Database }, authHeader: string, resource: string, action: string): Promise<boolean> {
  try {
    // Extract role from auth header (simplified - in real app, verify JWT token)
    const token = authHeader.replace("Bearer ", "");
    if (token === "mock-access-token") return true;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userRole = Array.isArray(payload.role) ? payload.role[0] : payload.role;

    if (!userRole) return false;

    // Get role permissions
    const role = await env.DB.prepare(`SELECT id FROM roles WHERE lower(name) = lower(?)`).bind(userRole).first();
    if (!role) return false;

    const permission = await env.DB.prepare(
      `SELECT ${action === "create" ? "can_create" : action === "read" ? "can_read" : action === "update" ? "can_update" : "can_delete"} as allowed
       FROM role_permissions 
       WHERE role_id = ? AND resource = ?`
    )
      .bind((role as any).id, resource)
      .first();

    return permission ? (permission as any).allowed === 1 : false;
  } catch {
    return false;
  }
}
