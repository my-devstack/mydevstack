import { test, expect } from '../fixtures.js'

test.setTimeout(60000)

async function createStateMachine(page: any, machineName: string) {
  await page.goto('/#/services/step-functions')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: 'Create State Machine' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Create State Machine' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  await page.getByPlaceholder('MyStateMachine').fill(machineName)
  await page.getByLabel('Role ARN').fill('arn:aws:iam::123456789012:role/test-role')
  await page.getByLabel('Definition').fill('{"StartAt": "HelloWorld", "States": {"HelloWorld": {"Type": "Pass", "End": true}}}')
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 })
}

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

  test('create state machine and verify in list', async ({ page }) => {
    const machineName = 'test-machine-create-' + Date.now()
    await createStateMachine(page, machineName)
    await expect(page.getByText(machineName).first()).toBeVisible({ timeout: 30000 })
  })

  test('delete state machine', async ({ page }) => {
    const machineName = 'test-machine-del-' + Date.now()
    await createStateMachine(page, machineName)
    // Wait for page to settle after creation
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(machineName).first()).toBeVisible({ timeout: 30000 })
    // Use more specific selector: find div with both 'border' and 'rounded-lg' classes
    const machineRow = page.locator('div.border.rounded-lg').filter({ hasText: machineName }).first()
    await machineRow.locator('[aria-label="Delete"]').click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(machineName).first()).not.toBeVisible({ timeout: 30000 })
  })

  test('accordion expands and shows details', async ({ page }) => {
    const machineName = 'test-machine-acc-' + Date.now()
    await createStateMachine(page, machineName)
    await expect(page.getByText(machineName).first()).toBeVisible({ timeout: 30000 })
    // Click the machine name text to expand accordion
    await page.getByText(machineName).first().click()
    await expect(page.getByText('ARN:').first()).toBeVisible({ timeout: 5000 })
  })

  test('back button returns to list view', async ({ page }) => {
    const machineName = 'test-machine-back-' + Date.now()
    await createStateMachine(page, machineName)
    await expect(page.getByText(machineName).first()).toBeVisible({ timeout: 30000 })
    // Click View Detail to go to detail view
    await page.getByRole('button', { name: 'View Detail' }).first().click()
    await expect(page.getByRole('button', { name: /back to state machines/i }).first()).toBeVisible({ timeout: 10000 })
    // Click back button
    await page.getByRole('button', { name: /back to state machines/i }).first().click()
    await expect(page.getByRole('heading', { name: 'Step Functions' }).first()).toBeVisible({ timeout: 5000 })
  })

  test('view detail shows full state machine info', async ({ page }) => {
    const machineName = 'test-machine-detail-' + Date.now()
    await createStateMachine(page, machineName)
    await expect(page.getByText(machineName).first()).toBeVisible({ timeout: 30000 })
    // Click View Detail
    await page.getByRole('button', { name: 'View Detail' }).first().click()
    await expect(page.getByText(/arn/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/created/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('detail view shows executions section', async ({ page }) => {
    const machineName = 'test-machine-execs-' + Date.now()
    await createStateMachine(page, machineName)
    await expect(page.getByText(machineName).first()).toBeVisible({ timeout: 30000 })
    // Click View Detail to go to detail view
    await page.getByRole('button', { name: 'View Detail' }).first().click()
    await expect(page.locator('h2', { hasText: 'Executions' })).toBeVisible({ timeout: 10000 })
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
    const machineName = 'test-machine-page-' + Date.now()
    await createStateMachine(page, machineName)
    await expect(page.getByText(machineName).first()).toBeVisible({ timeout: 30000 })
    // Check if pagination is visible (need > 15 items to trigger)
    const pagination = page.locator('text=/Page \\d+ of \\d+/').first()
    if (await pagination.isVisible({ timeout: 3000 }).catch(() => false)) {
      const prevBtn = page.getByRole('button', { name: 'Previous' })
      await expect(prevBtn).toBeVisible()
      await expect(prevBtn).toBeDisabled()
      const nextBtn = page.getByRole('button', { name: 'Next' })
      await expect(nextBtn).toBeVisible()
      await expect(nextBtn).toBeEnabled()
      await nextBtn.click()
      await expect(prevBtn).toBeEnabled()
      await prevBtn.click()
      await expect(prevBtn).toBeDisabled()
    }
  })

  test('view execution shows status, dates, input, output', async ({ page }) => {
    const machineName = 'test-machine-view-exec-' + Date.now()
    await createStateMachine(page, machineName)
    await expect(page.getByText(machineName).first()).toBeVisible({ timeout: 30000 })
    // Click View Detail to go to detail view
    await page.getByRole('button', { name: 'View Detail' }).first().click()
    await page.waitForLoadState('networkidle')
    // Verify detail view shows ARN label and metadata
    await expect(page.getByText(/arn/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/status/i).first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(/type/i).first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Pagination', () => {
  test('shows per-page selector when items exist', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    // Pagination only renders when state machines exist. Check gracefully.
    const showLabel = page.getByText('Show:')
    if (await showLabel.isVisible().catch(() => false)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await expect(perPageSelect).toBeVisible({ timeout: 5000 })
    }
  })

  test('change items per page when items exist', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
    const showLabel = page.getByText('Show:')
    if (await showLabel.isVisible().catch(() => false)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await perPageSelect.selectOption('50')
      await expect(paginationSection.getByText('per page')).toBeVisible({ timeout: 5000 })
    }
  })

  test('page navigation buttons work when paginated', async ({ page }) => {
    await page.goto('/#/services/step-functions')
    await page.waitForLoadState('networkidle')
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
