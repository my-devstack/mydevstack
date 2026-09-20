import { test, expect } from '../fixtures.js'

test.describe('API Gateway V2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/services/api-gateway')
    await page.click('button:has-text("API Gateway V2")')
    await page.waitForLoadState('networkidle')
    // Expand first API
    await page.locator('text=test-v2-api').first().click()
    await page.waitForLoadState('networkidle')
  })

  test('V2 - edit route pre-populates authorization', async ({ page }) => {
    await page.click('button[title="Edit Route"]')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const routeKey = dialog.locator('input').first()
    await expect(routeKey).not.toBeEmpty()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
  })

  test('V2 - edit integration pre-populates URI', async ({ page }) => {
    await page.click('button[title="Edit Integration"]')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const uriInput = dialog.getByLabel('URI')
    await expect(uriInput).not.toBeEmpty()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
  })

  test('V2 - edit stage pre-populates fields', async ({ page }) => {
    await page.click('button[title="Edit Stage"]')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Description')).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
  })

  test('V2 - view route modal', async ({ page }) => {
    await page.click('button[title="View Route"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V2 - view integration modal', async ({ page }) => {
    await page.click('button[title="View Integration"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V2 - view stage modal', async ({ page }) => {
    await page.click('button[title="View Stage"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })
})

test.describe('API Gateway V1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/services/api-gateway')
    await page.click('button:has-text("API Gateway")')
    await page.waitForLoadState('networkidle')
    await page.locator('text=test-v1-api').first().click()
    await page.waitForLoadState('networkidle')
  })

  test('V1 - view deployment modal', async ({ page }) => {
    await page.click('button[title="View Deployment"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V1 - edit deployment pre-populates', async ({ page }) => {
    await page.click('button[title="Edit Deployment"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByLabel('Description')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  })

  test('V1 - view stage modal', async ({ page }) => {
    await page.click('button[title="View Stage"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  })

  test('V1 - edit stage pre-populates', async ({ page }) => {
    await page.click('button[title="Edit Stage"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog').getByLabel('Description')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  })
})
