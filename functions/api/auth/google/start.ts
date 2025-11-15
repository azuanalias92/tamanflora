function base64UrlEncode(buffer: ArrayBuffer): string {
  let str = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(length = 32): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes.buffer)
}

export async function onRequestGet({ request, env }: { request: Request; env: { GOOGLE_CLIENT_ID?: string } }) {
  const origin = new URL(request.url).origin
  const redirectUri = `${origin}/api/auth/google/callback`
  const clientId = env.GOOGLE_CLIENT_ID || ''
  if (!clientId) {
    return new Response(JSON.stringify({ error: 'missing_client_id' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  const state = randomString(24)
  const verifier = randomString(64)
  const challengeBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const codeChallenge = base64UrlEncode(challengeBuffer)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  const headers = new Headers({ Location: authUrl })
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; Max-Age=600`)
  headers.append('Set-Cookie', `oauth_verifier=${verifier}; Path=/; Max-Age=600`)
  return new Response(null, { status: 302, headers })
}