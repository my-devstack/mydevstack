const _envProxyBackend = import.meta.env?.VITE_PROXY_BACKEND

export const PROXY_BACKEND = typeof _envProxyBackend === 'string' && _envProxyBackend ? _envProxyBackend : 'http://127.0.0.1:8081'