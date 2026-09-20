import { test, expect } from '../fixtures.js'

async function showAllItems(page: any) {
  const showLabel = page.getByText('Show:')
  if (await showLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    const perPageSelect = showLabel.locator('..').locator('select')
    await perPageSelect.selectOption('50')
    await page.waitForTimeout(300)
  }
}

test.describe('API Gateway V2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/services/api-gateway')
    await page.getByRole('tab', { name: 'API Gateway V2' }).click()
    await showAllItems(page)
    // Expand first API by clicking first row
    await page.locator('table tbody tr').first().locator('td').first().click()
  })

  test('V2 - edit route pre-populates authorization', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Route"]', { timeout: 5000 })
    await page.click('button[title="Edit Route"]')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const routeKey = dialog.locator('input').first()
    await expect(routeKey).not.toBeEmpty()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
  })

  test('V2 - edit integration pre-populates URI', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Integration"]', { timeout: 5000 })
    await page.click('button[title="Edit Integration"]')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const uriInput = dialog.getByLabel('URI')
    await expect(uriInput).not.toBeEmpty()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
  })

  test('V2 - edit stage pre-populates fields', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Stage"]', { timeout: 5000 })
    await page.click('button[title="Edit Stage"]')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Description')).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
  })

  test('V2 - view route modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Route"]', { timeout: 5000 })
    await page.click('button[title="View Route"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V2 - view integration modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Integration"]', { timeout: 5000 })
    await page.click('button[title="View Integration"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V2 - view stage modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Stage"]', { timeout: 5000 })
    await page.click('button[title="View Stage"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })
})

test.describe('API Gateway V1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/services/api-gateway')
    await page.getByRole('tab', { name: 'API Gateway' }).click()
    await showAllItems(page)
    await page.locator('table tbody tr').first().locator('td').first().click()
  })

  test('V1 - view deployment modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Deployment"]', { timeout: 5000 })
    await page.click('button[title="View Deployment"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V1 - edit deployment pre-populates', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Deployment"]', { timeout: 5000 })
    await page.click('button[title="Edit Deployment"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByLabel('Description')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  })

  test('V1 - view stage modal', async ({ page }) => {
    await page.waitForSelector('button[title="View Stage"]', { timeout: 5000 })
    await page.click('button[title="View Stage"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V1 - edit stage pre-populates', async ({ page }) => {
    await page.waitForSelector('button[title="Edit Stage"]', { timeout: 5000 })
    await page.click('button[title="Edit Stage"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByLabel('Description')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  })
})
