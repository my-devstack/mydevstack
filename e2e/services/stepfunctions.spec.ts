import { test, expect } from '../fixtures.js'

test.describe('Step Functions', () => {
  test('navigate to step functions page', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').locator('h1')).toContainText('Step Functions')
  })

  test('show state machine count', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').getByText(/state machine/i).first()).toBeVisible()
  })

  test('accordion expands and shows details', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    // Wait for table rows to load
    await page.waitForSelector('table, div[class*="border"]', { timeout: 10000 })
    // Click first row to expand accordion
    const firstRow = page.locator('div[class*="border"]').filter({ hasText: /arn:aws:states/i }).first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      // Should show expanded content with ARN, Description, Definition
      await expect(page.getByText('ARN:')).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('Description:')).toBeVisible({ timeout: 5000 })
    }
  })

  test('back button returns to list view', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('div[class*="border"]', { timeout: 10000 })
    // Click View Detail button on first row - goes to detail tab
    const viewDetailBtn = page.getByRole('button', { name: 'View Detail' }).first()
    if (await viewDetailBtn.isVisible({ timeout: 5000 })) {
      await viewDetailBtn.click()
      // Should show detail view
      await expect(page.getByText('← Back to State Machines')).toBeVisible({ timeout: 10000 })
      // Click back button
      await page.getByRole('button', { name: '← Back to State Machines' }).click()
      // Should return to list
      await expect(page.getByRole('heading', { name: 'Step Functions' }).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('view detail shows full state machine info', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    // Wait for content to load
    await page.waitForSelector('div[class*="border"]', { timeout: 10000 })
    // Click View Detail button on first row
    const viewDetailBtn = page.getByRole('button', { name: 'View Detail' }).first()
    if (await viewDetailBtn.isVisible({ timeout: 5000 })) {
      await viewDetailBtn.click()
      // Should navigate to detail view showing ARN, Created, Definition
      await expect(page.getByText(/ARN/).first()).toBeVisible({ timeout: 10000 })
      await expect(page.getByText(/Created/).first()).toBeVisible({ timeout: 5000 })
    }
  })

  test('detail view shows executions section', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    // Wait for content to load
    await page.waitForSelector('div[class*="border"]', { timeout: 10000 })
    // Click View Detail button on first row
    const viewDetailBtn = page.getByRole('button', { name: 'View Detail' }).first()
    if (await viewDetailBtn.isVisible({ timeout: 5000 })) {
      await viewDetailBtn.click()
      // Should show Executions section - look for h2 element with executions text
      await expect(page.locator('h2', { hasText: 'Executions' })).toBeVisible({ timeout: 10000 })
    }
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create State Machine' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: /create state machine/i })).toBeVisible()
  })

  test('create modal has required fields', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create State Machine' }).first().click()
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/definition/i)).toBeVisible()
    await expect(page.getByLabel(/role arn/i)).toBeVisible()
  })

  test('create modal cancel closes dialog', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create State Machine' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('pagination shows previous/next buttons when enough state machines', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('div[class*="border"]', { timeout: 10000 })
    // Check if pagination is visible (need enough items to trigger)
    const pagination = page.locator('text=Page').first()
    if (await pagination.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Verify previous button is disabled on first page
      const prevBtn = page.getByRole('button', { name: 'Previous' })
      await expect(prevBtn).toBeVisible()
      await expect(prevBtn).toBeDisabled()
      // Verify next button is enabled
      const nextBtn = page.getByRole('button', { name: 'Next' })
      await expect(nextBtn).toBeVisible()
      await expect(nextBtn).toBeEnabled()
      // Click next and verify previous becomes enabled
      await nextBtn.click()
      await expect(prevBtn).toBeEnabled()
      // Click previous to go back
      await prevBtn.click()
      await expect(prevBtn).toBeDisabled()
    }
  })

  test('view execution shows status, dates, input, output', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    // Wait for state machines to load
    await page.waitForSelector('table, div[class*="border"]', { timeout: 10000 })
    // Click first row to expand accordion
    const firstRow = page.locator('div[class*="border rounded"]').filter({ hasText: /arn:aws:states/i }).first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForTimeout(500)
      // Look for executions section - click on execution if present
      const viewExecutionBtn = page.getByRole('button', { name: /View/i }).filter({ hasText: /exec/i }).first()
      if (await viewExecutionBtn.isVisible({ timeout: 5000 })) {
        await viewExecutionBtn.click()
        // Should show execution detail with status
        await expect(page.getByText(/Status/i)).toBeVisible({ timeout: 10000 })
        // Should show start date
        await expect(page.getByText(/Start Date/i)).toBeVisible({ timeout: 5000 })
        // Should show stop date
        await expect(page.getByText(/Stop Date/i)).toBeVisible({ timeout: 5000 })
        // Should show input
        await expect(page.getByText(/Input/i)).toBeVisible({ timeout: 5000 })
        // Should show output
        await expect(page.getByText(/Output/i)).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
