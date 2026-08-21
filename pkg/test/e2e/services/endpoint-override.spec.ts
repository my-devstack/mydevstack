import { test, expect } from '../fixtures.js'

// State-adaptive spec for AWS_ENDPOINT_OVERRIDE.
// Reads /health at runtime to determine backend state:
//   - override set   → assert override URL shown in dashboard + code examples
//   - override empty → assert default URL shown (backward compatible)
// Internal SDK target must never equal the override.

const OVERRIDE_URL = 'https://my-public-host:4566'

async function getBackendState(request: any): Promise<{ override: string; target: string }> {
  const response = await request.get('http://localhost:8081/health')
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body).toHaveProperty('endpoint_override')
  return { override: body.endpoint_override, target: body.target }
}

test.describe('AWS_ENDPOINT_OVERRIDE', () => {
  test.describe('Health endpoint', () => {
    test('/health exposes endpoint_override field', async ({ request }) => {
      const { override } = await getBackendState(request)
      // Field must exist; value depends on backend env (empty or override URL)
      expect(typeof override).toBe('string')
    })

    test('/health keeps internal SDK target unchanged (never the override)', async ({ request }) => {
      const { override, target } = await getBackendState(request)
      expect(target).toBeTruthy()
      expect(target).not.toBe(OVERRIDE_URL)
      if (override) {
        expect(target).not.toBe(override)
      }
    })

    test('health response still contains standard fields', async ({ request }) => {
      const response = await request.get('http://localhost:8081/health')
      const body = await response.json()
      expect(body).toHaveProperty('status', 'healthy')
      expect(body).toHaveProperty('region')
      expect(body).toHaveProperty('emulator')
    })
  })

  test.describe('Dashboard endpoint display', () => {
    test('dashboard loads', async ({ page }) => {
      await page.goto('/#/')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'Dashboard', exact: true }).first()).toBeVisible({ timeout: 15000 })
    })

    test('dashboard shows the active public endpoint (override if set, default otherwise)', async ({ page, request }) => {
      const { override, target } = await getBackendState(request)
      const expected = override || target

      await page.goto('/#/')
      await page.waitForLoadState('networkidle')

      // publicEndpoint populated after health check returns endpoint_override
      await expect(page.getByText(expected, { exact: false }).first()).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('Code examples endpoint', () => {
    async function assertCodeExamplesShowEndpoint(page: any, request: any, headingName: string, url: string) {
      await page.goto(`/#/services/${headingName}`)
      await page.waitForLoadState('networkidle')

      const codeExamplesBtn = page.getByRole('button', { name: /code examples/i })
      if (await codeExamplesBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await codeExamplesBtn.click()
        await page.waitForTimeout(1000)
      }

      // Code examples must reference the active public endpoint
      await expect(page.getByText(url, { exact: false }).first()).toBeVisible({ timeout: 10000 })
    }

    test('S3 code examples show the active public endpoint', async ({ page, request }) => {
      const { override, target } = await getBackendState(request)
      const expected = override || target
      await page.goto('/#/services/s3')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'S3 Buckets' })).toBeVisible({ timeout: 15000 })

      const codeExamplesBtn = page.getByRole('button', { name: /code examples/i })
      if (await codeExamplesBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await codeExamplesBtn.click()
        await page.waitForTimeout(1000)
      }

      await expect(page.getByText(expected, { exact: false }).first()).toBeVisible({ timeout: 10000 })

      // S3 CLI examples use --endpoint-url with the active endpoint
      const hasEndpointUrlFlag = await page.getByText('--endpoint-url').first().isVisible({ timeout: 5000 }).catch(() => false)
      if (hasEndpointUrlFlag) {
        const pageContent = await page.content()
        expect(pageContent).toContain(`--endpoint-url ${expected}`)
      }
    })

    test('Lambda code examples show the active public endpoint', async ({ page, request }) => {
      const { override, target } = await getBackendState(request)
      const expected = override || target
      await page.goto('/#/services/lambda')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'Lambda Functions' })).toBeVisible({ timeout: 15000 })
      await assertCodeExamplesShowEndpoint(page, request, 'lambda', expected)
    })

    test('SQS code examples show the active public endpoint', async ({ page, request }) => {
      const { override, target } = await getBackendState(request)
      const expected = override || target
      await page.goto('/#/services/sqs')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'SQS Queues' })).toBeVisible({ timeout: 15000 })
      await assertCodeExamplesShowEndpoint(page, request, 'sqs', expected)
    })
  })

  test.describe('Console errors', () => {
    test('no console errors on dashboard load', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.goto('/#/')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      const criticalErrors = errors.filter(
        (e) => !e.includes('Failed to fetch') && !e.includes('NetworkError') && !e.includes('ERR_CONNECTION')
      )

      expect(criticalErrors).toEqual([])
    })

    test('no console errors on S3 page load', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.goto('/#/services/s3')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000)

      const criticalErrors = errors.filter(
        (e) => !e.includes('Failed to fetch') && !e.includes('NetworkError') && !e.includes('ERR_CONNECTION')
      )

      expect(criticalErrors).toEqual([])
    })
  })

  test.describe('Navigation', () => {
    test('can navigate between services without errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.goto('/#/')
      await page.waitForLoadState('networkidle')

      await page.goto('/#/services/s3')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'S3 Buckets' })).toBeVisible({ timeout: 15000 })

      await page.goto('/#/services/lambda')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'Lambda Functions' })).toBeVisible({ timeout: 15000 })

      await page.goto('/#/')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'Dashboard', exact: true }).first()).toBeVisible({ timeout: 15000 })

      const criticalErrors = errors.filter(
        (e) => !e.includes('Failed to fetch') && !e.includes('NetworkError') && !e.includes('ERR_CONNECTION')
      )
      expect(criticalErrors).toEqual([])
    })
  })
})
