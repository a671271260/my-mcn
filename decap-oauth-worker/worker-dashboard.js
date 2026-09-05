/**
 * Decap CMS GitHub OAuth 代理 —— Cloudflare Worker（控制台粘贴版）
 *
 * 使用方法：
 * 1. Cloudflare 控制台 → Workers & Pages → 创建 Worker（名称填 decap-oauth）
 * 2. 点击「编辑代码」，全选替换为本文内容
 * 3. 点击「部署」
 * 4. 到 Worker 的 Settings → Variables and Secrets 添加密钥：
 *    - GITHUB_OAUTH_ID     （GitHub OAuth App 的 Client ID）
 *    - GITHUB_OAUTH_SECRET （GitHub OAuth App 的 Client Secret）
 * 5. 可选变量：GITHUB_REPO_PRIVATE = "0"（仓库公开）或 "1"（仓库私有）
 */

// /auth —— 开始 OAuth，跳转到 GitHub 授权页
async function handleAuth(url, env) {
  if (url.searchParams.get('provider') !== 'github') {
    return new Response('Invalid provider', { status: 400 });
  }

  const repoIsPrivate = env.GITHUB_REPO_PRIVATE != null && env.GITHUB_REPO_PRIVATE !== '0';
  const scope = repoIsPrivate ? 'repo,user' : 'public_repo,user';

  const redirectUri = `https://${url.hostname}/callback?provider=github`;
  const state = randomHex(16);
  const authorizeUrl = `https://github.com/login/oauth/authorize?${new URLSearchParams({
    client_id: env.GITHUB_OAUTH_ID,
    redirect_uri: redirectUri,
    scope,
    state,
    response_type: 'code'
  })}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl,
      'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    }
  });
}

// /callback —— GitHub 授权回调，换取令牌并回传 CMS
async function handleCallback(url, env, request) {
  if (url.searchParams.get('provider') !== 'github') {
    return renderPage('error', '', 'Invalid provider');
  }
  const code = url.searchParams.get('code');
  if (!code) {
    return renderPage('error', '', 'Missing authorization code');
  }

  // 校验 state，防止 CSRF
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)oauth_state=([^;]+)/);
  const stateParam = url.searchParams.get('state');
  if (!m || !stateParam || m[1] !== stateParam) {
    return renderPage('error', '', 'State mismatch, please retry login');
  }

  try {
    const redirectUri = `https://${url.hostname}/callback?provider=github`;
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'decap-oauth-worker'
      },
      body: JSON.stringify({
        client_id: env.GITHUB_OAUTH_ID,
        client_secret: env.GITHUB_OAUTH_SECRET,
        code,
        redirect_uri: redirectUri
      })
    });
    const json = await res.json();
    if (!json.access_token) {
      return renderPage('error', '', json.error_description || json.error || 'Token exchange failed');
    }
    return renderPage('success', json.access_token);
  } catch (err) {
    return renderPage('error', '', err.message || 'Unknown error');
  }
}

function randomHex(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('');
}

function renderPage(status, token, error) {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>Decap CMS 授权</title>
</head>
<body>
  <script>
    (function () {
      var payload = ${JSON.stringify({ token: token, error: error })};
      var msg = 'authorization:github:${status}:' + JSON.stringify(payload);
      if (window.opener) {
        window.opener.postMessage(msg, '*');
        window.opener.postMessage('authorizing:github', '*');
      }
      document.body.innerHTML = ${status === 'success'
        ? "'<p style=\"font-family:sans-serif;text-align:center;margin-top:20vh\">✅ 授权成功，请关闭此窗口返回后台。</p>'"
        : "'<p style=\"font-family:sans-serif;text-align:center;margin-top:20vh\">❌ 授权失败：' + " + JSON.stringify(error || '') + " + '</p>'"};
      setTimeout(function () { window.close(); }, 1500);
    })();
  </script>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/auth') return handleAuth(url, env);
    if (url.pathname === '/callback') return handleCallback(url, env, request);
    return new Response('Decap CMS OAuth Proxy is running. Use /auth and /callback.', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};
