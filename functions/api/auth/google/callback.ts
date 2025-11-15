function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!cookieHeader) return out
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=')
    out[name] = decodeURIComponent(rest.join('='))
  }
  return out
}

function base64UrlDecode<T = Record<string, unknown>>(str: string): T | null {
  try {
    const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4))
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad
    const json = atob(b64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export async function onRequestGet({ request, env }: { request: Request; env: { GOOGLE_CLIENT_ID?: string; GOOGLE_CLIENT_SECRET?: string } }) {
  const url = new URL(request.url)
  const origin = url.origin
  const code = url.searchParams.get('code') || ''
  const state = url.searchParams.get('state') || ''
  const cookies = parseCookies(request.headers.get('cookie'))
  if (!code || !state || !cookies.oauth_state || state !== cookies.oauth_state) {
    return new Response('Invalid OAuth state', { status: 400 })
  }
  const verifier = cookies.oauth_verifier || ''
  const clientId = env.GOOGLE_CLIENT_ID || ''
  const clientSecret = env.GOOGLE_CLIENT_SECRET || ''
  const redirectUri = `${origin}/api/auth/google/callback`
  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: 'missing_credentials' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  })
  if (!tokenRes.ok) {
    const text = await tokenRes.text()
    return new Response(`Token exchange failed: ${text}`, { status: 400 })
  }
  const tokenJson = await tokenRes.json()
  const accessToken = tokenJson.access_token as string
  const idToken = tokenJson.id_token as string

  let userEmail = ''
  let userName = ''
  if (idToken) {
    const parts = idToken.split('.')
    const payload = parts[1] ? (base64UrlDecode(parts[1]) as Record<string, unknown>) : null
    userEmail = (payload?.email as string) || ''
    userName = (payload?.name as string) || ''
  }

  const user = {
    accountNo: 'ACC001',
    email: userEmail || 'google-user',
    role: ['user'],
    exp: Date.now() + 24 * 60 * 60 * 1000,
    name: userName,
  }

  const headers = new Headers({ Location: `${origin}/` })
  headers.append('Set-Cookie', `thisisjustarandomstring=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${60 * 60 * 24 * 7}`)
  headers.append('Set-Cookie', `auth_user=${encodeURIComponent(JSON.stringify(user))}; Path=/; Max-Age=${60 * 60 * 24 * 7}`)
  headers.append('Set-Cookie', 'oauth_state=; Path=/; Max-Age=0')
  headers.append('Set-Cookie', 'oauth_verifier=; Path=/; Max-Age=0')
  return new Response(null, { status: 302, headers })
}