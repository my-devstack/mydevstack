import { test, expect } from '../fixtures.js'

const PROXY = process.env.PROXY_URL || 'http://localhost:8081'

async function apiPost(page: any, path: string, data: any) {
  const res = await page.request.post(`${PROXY}/apigateway${path}`, { data })
  if (!res.ok()) {
    throw new Error(`POST ${path} failed (${res.status()}): ${await res.text()}`)
  }
  return res.json()
}

async function apiDelete(page: any, path: string) {
  await page.request.delete(`${PROXY}/apigateway${path}`).catch(() => {})
}

async function showAllItems(page: any) {
  const showLabel = page.getByText('Show:')
  if (await showLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    await showLabel.locator('..').locator('select').selectOption('50')
    await page.waitForTimeout(300)
  }
}

async function openTabAndExpand(page: any, tabName: string, name: string) {
  await page.goto('/#/services/api-gateway')
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: tabName, exact: true }).click()
  await page.waitForLoadState('networkidle')
  await showAllItems(page)
  const row = page.locator('.border.rounded-lg').filter({ hasText: name }).first()
  await expect(row).toBeVisible({ timeout: 10000 })
  await row.locator('.grid.grid-cols-12').first().click()
  await page.waitForTimeout(300)
}

async function seedV2Api(page: any, name: string): Promise<string> {
  const api = await apiPost(page, '/apis', { Name: name, ProtocolType: 'HTTP', Description: 'e2e' })
  const apiId = api.ApiId || api.apiId
  const integration = await apiPost(page, `/apis/${apiId}/integrations`, {
    IntegrationType: 'HTTP_PROXY',
    IntegrationUri: 'https://example.com',
    IntegrationMethod: 'GET',
    PayloadFormatVersion: '1.0',
  })
  const integrationId = integration.IntegrationId || integration.integrationId
  await apiPost(page, `/apis/${apiId}/routes`, {
    RouteKey: 'GET /test',
    Target: `integrations/${integrationId}`,
  })
  await apiPost(page, `/apis/${apiId}/stages`, {
    StageName: 'prod',
    AutoDeploy: true,
    Description: 'e2e stage',
  })
  return apiId
}

async function seedV1Api(page: any, name: string): Promise<string> {
  const api = await apiPost(page, '/rest-apis', { name, Description: 'e2e' })
  const apiId = api.Id || api.id
  const deployment = await apiPost(page, `/rest-apis/${apiId}/deployments`, {
    stageName: 'prod',
    description: 'e2e deployment',
  })
  const deploymentId = deployment.Id || deployment.id
  await apiPost(page, `/rest-apis/${apiId}/stages`, {
    deploymentId,
    stageName: 'prod',
    description: 'e2e stage',
  })
  return apiId
}

test.describe('API Gateway V2', () => {
  test.describe.configure({ timeout: 10000 })
  let apiName: string
  let apiId: string

  test.beforeEach(async ({ page }) => {
    apiName = `test-v2-${Date.now()}`
    apiId = await seedV2Api(page, apiName)
    await openTabAndExpand(page, 'API Gateway V2', apiName)
  })

  test.afterEach(async ({ page }) => {
    if (apiId) await apiDelete(page, `/apis/${apiId}`)
  })

  test('edit route pre-populates', async ({ page }) => {
    await page.locator('button[title="Edit Route"]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Route Key')).toHaveValue('GET /test')
  })

  test('edit integration pre-populates', async ({ page }) => {
    await page.locator('button[title="Edit Integration"]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('URI')).toHaveValue('https://example.com')
  })

  test('edit stage pre-populates', async ({ page }) => {
    await page.locator('button[title="Edit Stage"]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Description')).toHaveValue('e2e stage')
  })

  test('edit route updates target', async ({ page }) => {
    await page.locator('button[title="Edit Route"]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Target Type').selectOption('http')
    await dialog.getByLabel('HTTP Proxy URL').fill('https://updated.example.com')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).not.toBeVisible()

    const res = await page.request.get(`${PROXY}/apigateway/apis/${apiId}/routes`)
    const body = await res.json()
    const items = body.Items || body.items || []
    const route = items.find((r: any) => (r.RouteKey || r.routeKey) === 'GET /test')
    expect(route?.Target || route?.target).toBe('https://updated.example.com')
  })

  test('view route modal', async ({ page }) => {
    await page.locator('button[title="View Route"]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('GET /test')
  })

  test('view integration modal', async ({ page }) => {
    await page.locator('button[title="View Integration"]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('https://example.com')
  })

  test('view stage modal', async ({ page }) => {
    await page.locator('button[title="View Stage"]').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})

test.describe('API Gateway V1', () => {
  test.describe.configure({ timeout: 10000 })
  let apiName: string
  let apiId: string

  test.beforeEach(async ({ page }) => {
    apiName = `test-v1-${Date.now()}`
    apiId = await seedV1Api(page, apiName)
    await openTabAndExpand(page, 'API Gateway', apiName)
  })

  test.afterEach(async ({ page }) => {
    if (apiId) await apiDelete(page, `/rest-apis/${apiId}`)
  })

  test('view deployment modal', async ({ page }) => {
    await page.locator('button[title="View Deployment"]').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('edit deployment pre-populates', async ({ page }) => {
    await page.locator('button[title="Edit Deployment"]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Description')).toHaveValue('e2e deployment')
  })

  test('view stage modal', async ({ page }) => {
    await page.locator('button[title="View Stage"]').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('edit stage pre-populates', async ({ page }) => {
    await page.locator('button[title="Edit Stage"]').first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Description')).toHaveValue('e2e stage')
  })
})
