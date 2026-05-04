import { test, expect } from '../fixtures.js'

test.describe('ElastiCache', () => {
  test('navigate to ElastiCache page', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').locator('h1')).toContainText('ElastiCache')
  })

  test('show group count', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').getByText(/group/).first()).toBeVisible()
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Group' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Create Replication Group' })).toBeVisible()
  })

  test('create modal has required fields', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Group' }).first().click()
    await expect(page.getByLabel('Replication Group ID')).toBeVisible()
    await expect(page.getByLabel('Description')).toBeVisible()
    await expect(page.getByLabel('Node Type')).toBeVisible()
    await expect(page.getByLabel('Engine')).toBeVisible()
  })

  test('create modal cancel closes dialog', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Group' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('refresh button works', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    const refreshBtn = page.getByRole('button', { name: '' }).first()
    await refreshBtn.click()
    await page.waitForTimeout(2000)
    await expect(page.getByRole('main').locator('h1')).toContainText('ElastiCache')
  })

  test('usage examples visible', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Usage Examples', level: 2 })).toBeVisible()
  })

  test('AWS CLI example visible', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    const codeBlock = page.locator('pre').filter({ hasText: /aws elasticache/ })
    await expect(codeBlock).toBeVisible({ timeout: 10000 })
  })

  test('region selector visible', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('combobox')).toBeVisible()
  })
})