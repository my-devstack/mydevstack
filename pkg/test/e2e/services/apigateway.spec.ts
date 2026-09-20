import { test, expect } from '../fixtures.js'

async function showAllItems(page: any) {
  const showLabel = page.getByText('Show:')
  if (await showLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    const perPageSelect = showLabel.locator('..').locator('select')
    await perPageSelect.selectOption('50')
    await page.waitForTimeout(300)
  }
}

async function createV2ApiWithResources(page: any, name: string) {
  // Create HTTP API
  await page.goto('/#/services/api-gateway')
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: 'API Gateway V2' }).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '+ Create API' }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await page.getByLabel('API Name').fill(name)
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

  // Wait + expand the API
  await page.waitForTimeout(1000)
  await page.locator('.border.rounded-lg .grid.grid-cols-12').first().click()
  await page.waitForTimeout(1000)

  // Create Route
  await page.getByRole('button', { name: 'Create Route' }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await page.getByLabel('Route Key').fill('GET /test')
  // Target Type defaults to "Existing Integration" if integrations exist, else "HTTP Proxy"
  // Since no integrations yet, default is "HTTP Proxy" — fill the URL
  const targetTypeSelect = page.getByLabel('Target Type')
  const targetTypeValue = await targetTypeSelect.inputValue()
  if (targetTypeValue === 'http') {
    await page.getByLabel('HTTP Proxy URL').fill('https://example.com')
  }
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(500)

  // Create Integration (HTTP Proxy type so we have a URI)
  await page.getByRole('button', { name: 'Create Integration' }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  // Change type from Mock to HTTP Proxy
  await page.getByLabel('Integration Type').selectOption('HTTP_PROXY')
  await page.getByLabel('URI').fill('https://example.com')
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(500)

  // Create Stage
  await page.getByRole('button', { name: 'Create Stage' }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await page.getByLabel('Stage Name').fill('prod')
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(500)
}

async function createV1ApiWithResources(page: any, name: string) {
  // Create REST API
  await page.goto('/#/services/api-gateway')
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: 'API Gateway', exact: true }).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: '+ Create REST API' }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await page.getByLabel('API Name').fill(name)
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })

  // Wait + expand the API
  await page.waitForTimeout(1000)
  await page.locator('.border.rounded-lg .grid.grid-cols-12').first().click()
  await page.waitForTimeout(1000)

  // Create Deployment (opens DeploymentsModal)
  await page.getByRole('button', { name: '+ Create Deployment' }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  // DeploymentsModal has "Stage Name" input in the create deployment form
  const deployDialog = page.getByRole('dialog')
  await deployDialog.getByLabel('Stage Name').fill('prod')
  await deployDialog.getByRole('button', { name: 'Create Deployment' }).click()
  // Wait for deployment to be created and modal to stay open
  await page.waitForTimeout(2000)
  // Close the deployments modal
  await deployDialog.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(1000)

  // Create Stage (opens StageModal with type=rest, needs deployment selected)
  await page.getByRole('button', { name: '+ Create Stage' }).click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  const stageDialog = page.getByRole('dialog')
  await stageDialog.getByLabel('Stage Name').fill('prod')
  // Select deployment from dropdown
  await stageDialog.getByLabel('Deployment').selectOption({ index: 1 })
  await stageDialog.getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(500)
}

// V2 Tests
test.describe('API Gateway V2', () => {
  test.beforeEach(async ({ page }) => {
    await createV2ApiWithResources(page, 'test-v2-' + Date.now())
  })

  test('V2 - edit route pre-populates', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Route"]', { timeout: 5000 })
    await page.click('button[title="Edit Route"]')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    const routeKey = dialog.getByLabel('Route Key')
    await expect(routeKey).not.toBeEmpty()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
  })

  test('V2 - edit integration pre-populates', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Integration"]', { timeout: 5000 })
    await page.click('button[title="Edit Integration"]')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByLabel('URI')).not.toBeEmpty()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
  })

  test('V2 - edit stage pre-populates', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Stage"]', { timeout: 5000 })
    await page.click('button[title="Edit Stage"]')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5000 })
    await expect(dialog.getByLabel('Description')).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
  })

  test('V2 - view route modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Route"]', { timeout: 5000 })
    await page.click('button[title="View Route"]')
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V2 - view integration modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Integration"]', { timeout: 5000 })
    await page.click('button[title="View Integration"]')
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V2 - view stage modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Stage"]', { timeout: 5000 })
    await page.click('button[title="View Stage"]')
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })
})

// V1 Tests
test.describe('API Gateway V1', () => {
  test.beforeEach(async ({ page }) => {
    await createV1ApiWithResources(page, 'test-v1-' + Date.now())
  })

  test('V1 - view deployment modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Deployment"]', { timeout: 5000 })
    await page.click('button[title="View Deployment"]')
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V1 - edit deployment pre-populates', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Deployment"]', { timeout: 5000 })
    await page.click('button[title="Edit Deployment"]')
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('dialog').getByLabel('Description')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  })

  test('V1 - view stage modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Stage"]', { timeout: 5000 })
    await page.click('button[title="View Stage"]')
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V1 - edit stage pre-populates', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Stage"]', { timeout: 5000 })
    await page.click('button[title="Edit Stage"]')
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('dialog').getByLabel('Description')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  })
})
