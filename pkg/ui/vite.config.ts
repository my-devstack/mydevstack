import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Load env variables
  const env = loadEnv(mode, process.cwd(), '')

  // Get target from env or use default
  const proxyBackend = env.VITE_PROXY_BACKEND || 'http://127.0.0.1:8081'
  const target = proxyBackend.endsWith('/') ? proxyBackend.slice(0, -1) : proxyBackend

  console.log(`[Vite] AWS Proxy target: ${target}`)

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    // Exclude SDK packages referenced only in code example template literals
    optimizeDeps: {
      exclude: [
        '@aws-sdk/client-iam',
        '@aws-sdk/client-kafka',
        '@aws-sdk/client-opensearch',
        '@aws-sdk/client-sesv2',
        '@aws-sdk/client-sfn',
        '@aws-sdk/client-cloudformation',
      ],
    },
    server: {
      port: 3000,
      proxy: {
        // Vite dev handles static assets — only proxy API paths to Go backend
        '/health':         { target, changeOrigin: true },
        '/proxy':          { target, changeOrigin: true },
        '/s3':             { target, changeOrigin: true },
        '/iam':            { target, changeOrigin: true },
        '/lambda':         { target, changeOrigin: true },
        '/dynamodb':       { target, changeOrigin: true },
        '/sqs':            { target, changeOrigin: true },
        '/sns':            { target, changeOrigin: true },
        '/kms':            { target, changeOrigin: true },
        '/ssm':            { target, changeOrigin: true },
        '/cloudformation': { target, changeOrigin: true },
        '/cloudwatch':     { target, changeOrigin: true },
        '/cloudwatch-logs':{ target, changeOrigin: true },
        '/secrets-manager':{ target, changeOrigin: true },
        '/elasticache':    { target, changeOrigin: true },
        '/rds':            { target, changeOrigin: true },
        '/sesv2':          { target, changeOrigin: true },
        '/kinesis':        { target, changeOrigin: true },
        '/msk':            { target, changeOrigin: true },
        '/opensearch':     { target, changeOrigin: true },
        '/apigateway':     { target, changeOrigin: true },
        '/step-functions': { target, changeOrigin: true },
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: true,
    },
  }
})
