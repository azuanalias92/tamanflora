export async function onRequestGet() {
  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "content-type": "application/json" }
  })
}