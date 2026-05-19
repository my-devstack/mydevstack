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
    server: {
      port: 3000,
      proxy: {
        // S3 - uses /s3/ prefix
        '/s3': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/s3/, ''),
        },
        // DynamoDB - uses POST to root with X-Amz-Target header
        '/dynamodb': {
          target,
          changeOrigin: true,
        },
        // Secrets Manager - uses POST to root with X-Amz-Target header
        '/secrets': {
          target,
          changeOrigin: true,
        },
        // Lambda - REST API
        '/2015-03-31': {
          target,
          changeOrigin: true,
        },
        // SNS - Query API
        '/sns': {
          target,
          changeOrigin: true,
        },
        // SQS - Query API
        '/sqs': {
          target,
          changeOrigin: true,
        },
        // IAM - Query API
        '/iam': {
          target,
          changeOrigin: true,
        },
        // KMS - Query API
        '/kms': {
          target,
          changeOrigin: true,
        },
        // Secrets Manager - Query API (alternative path)
        '/secretsmanager': {
          target,
          changeOrigin: true,
        },
        // EventBridge
        '/events': {
          target,
          changeOrigin: true,
        },
        // CloudWatch Logs
        '/logs': {
          target,
          changeOrigin: true,
        },
        // SSM
        '/ssm': {
          target,
          changeOrigin: true,
        },
        // API Gateway REST APIs (v1)
        '/restapis': {
          target,
          changeOrigin: true,
        },
        // API Gateway HTTP APIs (v2)
        '/v2/apis': {
          target,
          changeOrigin: true,
        },
        // API Gateway (legacy path)
        '/apigateway': {
          target,
          changeOrigin: true,
        },
        // Kinesis
        '/kinesis': {
          target,
          changeOrigin: true,
        },
        // CloudFormation
        '/cloudformation': {
          target,
          changeOrigin: true,
        },
        // Cognito
        '/cognito-idp': {
          target,
          changeOrigin: true,
        },
        // ElastiCache
        '/elasticache': {
          target,
          changeOrigin: true,
        },
		// RDS
		'/rds': {
		  target,
		  changeOrigin: true,
		},
		// Step Functions
		'/stepfunctions': {
		  target,
		  changeOrigin: true,
		},
	      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: true,
    },
  }
})
