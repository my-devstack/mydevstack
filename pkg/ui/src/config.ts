const _envProxyBackend = import.meta.env?.VITE_PROXY_BACKEND

// Backend origin resolution.
// 1. VITE_PROXY_BACKEND set at build time -> always wins (direct backend URL;
//    used when FE is served without an nginx proxy, or BE/FE on separate hosts
//    with no proxy in front).
// 2. Production build -> '' (same-origin). Browser calls the origin that served
//    the page (http://IP:3000, https://domain, localhost); nginx (or the user's
//    reverse proxy) forwards API paths to the Go backend. Works whether BE runs
//    in the same container (upstream 127.0.0.1:8081) or a different host
//    (upstream <backend-host>:8081).
// 3. Dev/tests -> local backend default.
export const PROXY_BACKEND =
  typeof _envProxyBackend === 'string' && _envProxyBackend
    ? _envProxyBackend
    : import.meta.env?.PROD
      ? ''
      : 'http://127.0.0.1:8081'
