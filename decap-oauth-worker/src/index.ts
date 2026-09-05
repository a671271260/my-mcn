/**
 * Decap CMS GitHub OAuth 代理 —— Cloudflare Worker
 *
 * 功能：把 GitHub OAuth 的 Client Secret 保管在服务端，
 *       为 Decap CMS 提供 /auth 与 /callback 两个端点。
 *
 * 部署：npx wrangler deploy
 * 密钥：npx wrangler secret put GITHUB_OAUTH_ID
 *       npx wrangler secret put GITHUB_OAUTH_SECRET
 */

interface Env {
  GITHUB_OAUTH_ID: string
  GITHUB_OAUTH_SECRET: string
  GITHUB_REPO_PRIVATE?: string
}

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes)
  crypto.getRandomValues(buf)
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** 生成跳转到 GitHub 授权页的地址 */
function buildAuthorizeUrl(env: Env, redirectUri: string, scope: string, state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_ID,
    redirect_uri: redirectUri,
    scope,
    state,
    response_type: 'code',
  })
  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`
}

/** 用授权码换取访问令牌 */
async function exchangeCodeForToken(
  env: Env,
  code: string,
  redirectUri: string
): Promise<string> {
  const res = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'decap-oauth-worker',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_ID,
      client_secret: env.GITHUB_OAUTH_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  })

  const json = (await res.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }

  if (!json.access_token) {
    throw new Error(json.error_description || json.error || 'Failed to exchange code for token')
  }
  return json.access_token
}

/** 回调页：通过 postMessage 把令牌交还给 Decap CMS 弹出的登录窗口 */
function renderCallbackPage(status: 'success' | 'error', token = '', error = ''): Response {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>Decap CMS 授权</title>
</head>
<body>
  <script>
    (function () {
      var payload = ${JSON.stringify({ token: status === 'success' ? token : '', error })};
      var msg = 'authorization:github:${status}:' + JSON.stringify(payload);
      if (window.opener) {
        window.opener.postMessage(msg, '*');
        window.opener.postMessage('authorizing:github', '*');
      }
      document.body.innerHTML = ${
        status === 'success'
          ? `'<p style="font-family:sans-serif;text-align:center;margin-top:20vh">✅ 授权成功，请关闭此窗口返回后台。</p>'`
          : `'<p style="font-family:sans-serif;text-align:center;margin-top:20vh">❌ 授权失败：' + ${JSON.stringify(
              error || ''
            )} + '</p>'`
      };
      setTimeout(function () { window.close(); }, 1500);
    })();
  </script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/** GET /auth —— 开始 OAuth，重定向到 GitHub 授权页 */
async function handleAuth(url: URL, env: Env): Promise<Response> {
  const provider = url.searchParams.get('provider')
  if (provider !== 'github') {
    return new Response('Invalid provider', { status: 400 })
  }

  const repoIsPrivate = env.GITHUB_REPO_PRIVATE != null && env.GITHUB_REPO_PRIVATE !== '0'
  const scope = repoIsPrivate ? 'repo,user' : 'public_repo,user'

  const redirectUri = `https://${url.hostname}/callback?provider=github`
  const state = randomHex(16)

  // state 存进 HttpOnly Cookie，回调时校验，防止 CSRF
  const authorizeUrl = buildAuthorizeUrl(env, redirectUri, scope, state)

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl,
      'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  })
}

/** GET /callback —— GitHub 授权后回调，换取令牌并回传 CMS */
async function handleCallback(url: URL, env: Env, request: Request): Promise<Response> {
  const provider = url.searchParams.get('provider')
  if (provider !== 'github') {
    return renderCallbackPage('error', '', 'Invalid provider')
  }

  const code = url.searchParams.get('code')
  if (!code) {
    return renderCallbackPage('error', '', 'Missing authorization code')
  }

  // 校验 state（CSRF 防护）
  const cookie = request.headers.get('Cookie') || ''
  const cookieState = cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('oauth_state='))
    ?.split('=')[1]

  const stateParam = url.searchParams.get('state')
  if (!stateParam || !cookieState || stateParam !== cookieState) {
    return renderCallbackPage('error', '', 'State mismatch, please retry login')
  }

  try {
    const redirectUri = `https://${url.hostname}/callback?provider=github`
    const token = await exchangeCodeForToken(env, code, redirectUri)
    return renderCallbackPage('success', token)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return renderCallbackPage('error', '', message)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/auth') {
      return handleAuth(url, env)
    }
    if (url.pathname === '/callback') {
      return handleCallback(url, env, request)
    }

    return new Response('Decap CMS OAuth Proxy is running. Use /auth and /callback.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  },
}
