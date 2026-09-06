const _envProxyBackend = import.meta.env?.VITE_PROXY_BACKEND

function resolveProxyBackend(): string {
  // Explicit build-time/env override always wins.
  if (typeof _envProxyBackend === 'string' && _envProxyBackend) {
    return _envProxyBackend
  }

  // Remote host (e.g. Docker on a LAN IP): the Go backend is published on the
  // same host, port 8081. Derive it from the page origin at runtime so the
  // bundle works from any client without baking an IP at build time.
  if (typeof window !== 'undefined' && window.location?.origin) {
    const { origin, hostname } = window.location
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${origin.replace(/:\d+$/, '')}:8081`
    }
  }

  // Local dev default.
  return 'http://127.0.0.1:8081'
}

export const PROXY_BACKEND = resolveProxyBackend()