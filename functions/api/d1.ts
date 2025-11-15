export async function onRequestGet({ env }: { env: { DB: D1Database } }) {
  const row = await env.DB.prepare("select 1 as ok").first()
  return new Response(JSON.stringify({ ok: row?.ok === 1 }), {
    headers: { "content-type": "application/json" }
  })
}

interface D1Database {
  prepare: (query: string) => {
    first: <T = unknown>() => Promise<T | null>
  }
}