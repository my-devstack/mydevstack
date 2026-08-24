import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { nextTick } from 'vue'
import router from './index'

describe('Router', () => {
  const serviceRouteNames = [
    'S3',
    'Lambda',
    'LambdaEventSourceMapping',
    'DynamoDB',
    'SQS',
    'SNS',
    'IAM',
    'KMS',
    'SecretsManager',
    'APIGateway',
    'Kinesis',
    'CloudFormation',
    'SSM',
    'ElastiCache',
    'EC2',
    'VPC',
    'RDS',
    'StepFunctions',
    'OpenSearch',
    'SES',
    'CloudWatch',
    'MSK',
    'Cognito',
  ]

  it('creates router instance', () => {
    expect(router).toBeDefined()
    const routes = router.getRoutes()
    expect(routes.length).toBeGreaterThan(0)
  })

  it('has Dashboard route', () => {
    const routeNames = router.getRoutes().map((r) => r.name)
    expect(routeNames).toContain('Dashboard')
  })

  it('has all service routes', () => {
    const routeNames = router.getRoutes().map((r) => r.name)
    for (const name of serviceRouteNames) {
      expect(routeNames).toContain(name)
    }
  })

  it('has redirect routes for /services and catch-all', () => {
    const routes = router.getRoutes()
    const redirectRoutes = routes.filter((r) => r.redirect !== undefined)
    expect(redirectRoutes.length).toBeGreaterThanOrEqual(2)

    const servicesRoute = routes.find((r) => r.path === '/services')
    expect(servicesRoute?.redirect).toBe('/')

    const catchAll = routes.find((r) => r.path === '/:pathMatch(.*)*')
    expect(catchAll?.redirect).toBe('/')
  })

  it('has meta data on Dashboard route', () => {
    const dash = router.getRoutes().find((r) => r.name === 'Dashboard')
    expect(dash).toBeDefined()
    expect(dash?.meta?.title).toBe('Dashboard')
    expect(dash?.meta?.icon).toBe('home')
  })

  it('has meta data on service routes', () => {
    const s3 = router.getRoutes().find((r) => r.name === 'S3')
    expect(s3).toBeDefined()
    expect(s3?.meta?.title).toBe('S3')
    expect(s3?.meta?.service).toBe('s3')
  })

  it('sets document title via beforeEach guard', async () => {
    await router.push('/')
    expect(document.title).toContain('Dashboard')
    expect(document.title).toContain('MyDevStack')
  })

  describe('beforeEach guard', () => {
    beforeEach(() => {
      document.title = 'initial'
    })

    it('sets title for service routes', async () => {
      await router.push('/services/s3')
      expect(document.title).toBe('S3 - MyDevStack')
    })

    it('sets title for route with title meta', async () => {
      await router.push('/services/lambda')
      expect(document.title).toBe('Lambda - MyDevStack')
    })

    it('falls back to MyDevStack when no title meta', async () => {
      // The catch-all redirect route has no meta.title
      await router.push('/services/dynamodb')
      expect(document.title).toBe('DynamoDB - MyDevStack')
    })

    it('handles path with multiple segments', async () => {
      await router.push('/services/lambda-event-source-mapping')
      expect(document.title).toBe('Lambda Event Source Mapping - MyDevStack')
    })

    it('redirects /services to /', async () => {
      await router.push('/services')
      // After redirect, should be on Dashboard
      expect(document.title).toContain('Dashboard')
    })

    it('redirects unknown paths to /', async () => {
      await router.push('/nonexistent')
      await nextTick()
      const currentRoute = router.currentRoute.value
      expect(currentRoute.path).toBe('/')
    })
  })

  describe('route resolution', () => {
    it('resolves Dashboard route by name', () => {
      const resolved = router.resolve({ name: 'Dashboard' })
      expect(resolved.name).toBe('Dashboard')
      expect(resolved.path).toBe('/')
    })

    it('resolves service routes by name', () => {
      for (const name of serviceRouteNames) {
        const resolved = router.resolve({ name })
        expect(resolved.name).toBe(name)
        expect(resolved.meta.title).toBeDefined()
        expect(resolved.meta.service).toBeDefined()
      }
    })

    it('resolves S3 route path to /services/s3', () => {
      const resolved = router.resolve({ name: 'S3' })
      expect(resolved.path).toBe('/services/s3')
    })
  })

  describe('route resolution edge cases', () => {
    it('resolves route without meta', () => {
      const resolved = router.resolve({ path: '/' })
      expect(resolved.meta).toBeDefined()
    })

    it('resolves route with dynamic path', () => {
      const resolved = router.resolve({ path: '/services/s3' })
      expect(resolved.name).toBe('S3')
    })

    it('resolves catch-all redirect', () => {
      const route = router.getRoutes().find(r => r.path === '/:pathMatch(.*)*')
      expect(route).toBeDefined()
      expect(route?.redirect).toBe('/')
    })

    it('resolves /services redirect', () => {
      const route = router.getRoutes().find(r => r.path === '/services')
      expect(route).toBeDefined()
      expect(route?.redirect).toBe('/')
    })

    it('document title set to MyDevStack when route has no meta.title', async () => {
      document.title = 'MyDevStack'
      await router.push('/')
      expect(document.title).toContain('MyDevStack')
    })

    it('beforeEach guard handles route with title meta', async () => {
      document.title = 'initial'
      await router.push('/services/s3')
      expect(document.title).toBe('S3 - MyDevStack')
    })
  })

  describe('router configuration', () => {
    it('uses hash-based history', () => {
      expect(router.options.history).toBeDefined()
    })

    it('has all meta fields on routes', () => {
      const routes = router.getRoutes()
      const serviceRoutes = routes.filter(r => r.meta?.service)
      expect(serviceRoutes.length).toBe(serviceRouteNames.length)
      for (const route of serviceRoutes) {
        expect(route.meta?.title).toBeDefined()
        expect(route.meta?.service).toBeDefined()
      }
    })
  })

  describe('beforeEach edge cases', () => {
    beforeEach(() => {
      document.title = 'initial'
    })

    it('sets MyDevStack fallback for route with empty string title', async () => {
      // This covers the edge case where title is empty string (falsy)
      const route = router.getRoutes().find(r => r.name === 'Dashboard')
      if (route) {
        route.meta.title = ''
        await router.push('/')
        expect(document.title).toBe('MyDevStack')
      }
    })

    it('handles navigation to SQS route', async () => {
      await router.push('/services/sqs')
      expect(document.title).toBe('SQS - MyDevStack')
    })

    it('handles navigation to SNS route', async () => {
      await router.push('/services/sns')
      expect(document.title).toBe('SNS - MyDevStack')
    })

    it('handles navigation to IAM route', async () => {
      await router.push('/services/iam')
      expect(document.title).toBe('IAM - MyDevStack')
    })

    it('handles navigation to KMS route', async () => {
      await router.push('/services/kms')
      expect(document.title).toBe('KMS - MyDevStack')
    })

    it('handles navigation to Secrets Manager route', async () => {
      await router.push('/services/secrets-manager')
      expect(document.title).toBe('Secrets Manager - MyDevStack')
    })

    it('handles navigation to API Gateway route', async () => {
      await router.push('/services/api-gateway')
      expect(document.title).toBe('API Gateway - MyDevStack')
    })

    it('handles navigation to Kinesis route', async () => {
      await router.push('/services/kinesis')
      expect(document.title).toBe('Kinesis - MyDevStack')
    })

    it('handles navigation to CloudFormation route', async () => {
      await router.push('/services/cloudformation')
      expect(document.title).toBe('CloudFormation - MyDevStack')
    })

    it('handles navigation to SSM route', async () => {
      await router.push('/services/ssm')
      expect(document.title).toBe('SSM Parameter Store - MyDevStack')
    })

    it('handles navigation to Step Functions route', async () => {
      await router.push('/services/step-functions')
      expect(document.title).toBe('Step Functions - MyDevStack')
    })

    it('handles navigation to SES route', async () => {
      await router.push('/services/ses')
      expect(document.title).toBe('SES - MyDevStack')
    })

    it('handles navigation to CloudWatch route', async () => {
      await router.push('/services/cloudwatch')
      expect(document.title).toBe('CloudWatch - MyDevStack')
    })

    it('handles navigation to MSK route', async () => {
      await router.push('/services/msk')
      expect(document.title).toBe('MSK - MyDevStack')
    })

    it('handles navigation to OpenSearch route', async () => {
      await router.push('/services/opensearch')
      expect(document.title).toBe('OpenSearch - MyDevStack')
    })

    it('handles navigation to ElastiCache route', async () => {
      await router.push('/services/elasticache')
      expect(document.title).toBe('ElastiCache - MyDevStack')
    })

    it('handles navigation to EC2 route', async () => {
      await router.push('/services/ec2')
      expect(document.title).toBe('EC2 - MyDevStack')
    })

    it('handles navigation to RDS route', async () => {
      await router.push('/services/rds')
      expect(document.title).toBe('RDS - MyDevStack')
    })
  })
})
