import { test, expect } from '../fixtures.js'

test.describe('RDS', () => {
  test('navigate to RDS page', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').locator('h1')).toContainText('RDS')
  })

  test('show instance count', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/instances?$/)).toBeVisible()
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Instance' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Create DB Instance')).toBeVisible()
  })

  test('create modal has engine selector', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Instance' }).first().click()
    await page.waitForTimeout(1000)

    const engineSelect = page.getByLabel('Database Engine')
    await expect(engineSelect).toBeVisible()
    await expect(engineSelect).toHaveValue('mysql')
  })

  test('create modal cancel closes dialog', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Instance' }).first().click()
    await page.waitForTimeout(1000)

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('refresh button works', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    const refreshBtn = page.getByRole('button', { name: '' }).first()
    await refreshBtn.click()
    await page.waitForTimeout(2000)
    await expect(page.getByRole('main').locator('h1')).toContainText('RDS')
  })

  test('usage examples visible', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Usage Examples', level: 2 })).toBeVisible()
  })

  test('AWS CLI example visible', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    const codeBlock = page.locator('pre').filter({ hasText: /aws rds create-db-instance/ })
    await expect(codeBlock).toBeVisible({ timeout: 10000 })
  })

  test('region selector visible', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('combobox')).toBeVisible()
  })
})
