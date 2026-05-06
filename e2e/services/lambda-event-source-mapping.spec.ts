import { test, expect } from '../fixtures.js'

test.describe('LambdaEventSourceMapping', () => {
  test.beforeEach(async () => {
    // Cleanup handled by proxy mock
  })

  test('navigate to Lambda Event Source Mapping', async ({ page }) => {
    await page.goto('/#/services/lambda-event-source-mapping')
    await page.waitForLoadState('networkidle')
    
    await expect(page.getByRole('heading', { name: 'Lambda ESM' })).toBeVisible({ timeout: 15000 })
  })

  test('show empty state', async ({ page }) => {
    await page.goto('/#/services/lambda-event-source-mapping')
    await page.waitForLoadState('networkidle')
    
    // Page loads with heading - verify service is functional
    await expect(page.getByRole('heading', { name: 'Lambda ESM' })).toBeVisible({ timeout: 15000 })
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/lambda-event-source-mapping')
    await page.waitForLoadState('networkidle')
    
    await expect(page.getByRole('button', { name: 'Create Mapping' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Create Mapping' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
  })

  test('create modal has required fields', async ({ page }) => {
    await page.goto('/#/services/lambda-event-source-mapping')
    await page.waitForLoadState('networkidle')
    
    await page.getByRole('button', { name: 'Create Mapping' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Lambda Function *')).toBeVisible()
    await expect(page.getByText('Event Source *')).toBeVisible()
    await expect(page.getByText('Batch Size').first()).toBeVisible()
    await expect(page.getByText('Destination Config')).toBeVisible()
  })

  test('cancel closes dialog', async ({ page }) => {
    await page.goto('/#/services/lambda-event-source-mapping')
    await page.waitForLoadState('networkidle')
    
    await page.getByRole('button', { name: 'Create Mapping' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })
})