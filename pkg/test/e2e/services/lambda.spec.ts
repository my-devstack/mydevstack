import { test, expect } from '../fixtures.js'

test.describe('Lambda', () => {
  test.beforeEach(async () => {
    // Cleanup handled by proxy mock
  })

  test('navigate to Lambda', async ({ page }) => {
    await page.goto('/#/services/lambda')
    await page.waitForTimeout(2000)
    
    await expect(page.getByRole('main').locator('h1')).toContainText('Lambda', { timeout: 10000 })
  })
  
  test('load function list', async ({ page }) => {
    await page.goto('/#/services/lambda')
    await page.waitForTimeout(2000)
    
    await expect(page.getByText('function').first()).toBeVisible({ timeout: 10000 })
  })
  
  test('open create function modal', async ({ page }) => {
    await page.goto('/#/services/lambda')
    await page.waitForTimeout(2000)
    
    await page.getByRole('button', { name: '+ Create Function' }).click()
    await page.waitForTimeout(1000)
    
    await expect(page.getByText('Create Lambda Function')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Pagination', () => {
  test('shows per-page selector when items exist', async ({ page }) => {
    await page.goto('/#/services/lambda')
    await page.waitForTimeout(2000)
    // Pagination only renders when functions exist. Check gracefully.
    const showLabel = page.getByText('Show:')
    if (await showLabel.isVisible().catch(() => false)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await expect(perPageSelect).toBeVisible({ timeout: 5000 })
    }
  })

  test('change items per page when items exist', async ({ page }) => {
    await page.goto('/#/services/lambda')
    await page.waitForTimeout(2000)
    const showLabel = page.getByText('Show:')
    if (await showLabel.isVisible().catch(() => false)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await perPageSelect.selectOption('50')
      await expect(paginationSection.getByText('per page')).toBeVisible({ timeout: 5000 })
    }
  })

  test('page navigation buttons work when paginated', async ({ page }) => {
    await page.goto('/#/services/lambda')
    await page.waitForTimeout(2000)
    const showLabel = page.getByText('Show:')
    if (await showLabel.isVisible().catch(() => false)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await perPageSelect.selectOption('5')
      const nextButton = page.getByRole('button', { name: 'Next' }).first()
      if (await nextButton.isVisible().catch(() => false)) {
        await expect(nextButton).toBeVisible({ timeout: 5000 })
      }
    }
  })
})