export async function onRequestGet({ env, params }: { env: { R2: R2Bucket }; params: { key: string } }) {
  const key = decodeURIComponent(params.key)
  const object = await env.R2.get(key)
  if (!object) {
    return new Response('Not found', { status: 404 })
  }
  return new Response(object.body, {
    headers: {
      'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  })
}

export async function onRequestPut({ env, request, params }: { env: { R2: R2Bucket }; request: Request; params: { key: string } }) {
  const contentType = request.headers.get('content-type') || 'application/octet-stream'
  const body = await request.arrayBuffer()
  const key = decodeURIComponent(params.key)
  await env.R2.put(key, body, { httpMetadata: { contentType } })
  return new Response('ok', { status: 200 })
}

interface R2Bucket {
  get: (key: string) => Promise<{ body: ReadableStream<Uint8Array>; httpMetadata?: { contentType?: string } } | null>
  put: (key: string, value: ArrayBuffer | ReadableStream | string, options?: { httpMetadata?: { contentType?: string } }) => Promise<void>
}
