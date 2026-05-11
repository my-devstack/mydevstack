import { test, expect } from '../fixtures.js'

// Helper to find parameter on any page (handles pagination, 15 per page)
async function findParameterOnPage(page: any, paramName: string, maxPages = 5): Promise<boolean> {
  for (let i = 0; i < maxPages; i++) {
    const param = page.getByText(paramName, { exact: true })
    if (await param.isVisible({ timeout: 2000 }).catch(() => false)) {
      return true
    }
    const nextBtn = page.getByRole('button', { name: 'Next' })
    if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nextBtn.click()
      await page.waitForTimeout(500)
    } else {
      break
    }
  }
  return false
}

async function createParameter(page: any, name: string, value: string, type = 'String') {
  await page.goto('/#/services/ssm', { waitUntil: 'networkidle' })

  // Click Create Parameter button (use .first() as there might be multiple matches)
  await page.getByRole('button', { name: /Create Parameter/i }).first().click()
  await page.waitForLoadState('networkidle')

  // Wait for modal to appear
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

  // Fill in the parameter name
  await page.getByPlaceholder('/my-app/feature-flag').fill(name)

  // Select type if not String (default) - use selectOption for native select
  if (type !== 'String') {
    await page.getByRole('dialog').getByRole('combobox').selectOption(type)
    await page.waitForLoadState('networkidle')
  }

  // Fill in the value (textarea has no placeholder, use locator)
  await page.getByRole('dialog').locator('textarea').fill(value)

  // Optional: Fill description
  const descriptionField = page.getByPlaceholder('Optional description')
  if (await descriptionField.isVisible()) {
    await descriptionField.fill(`E2E test parameter - ${type}`)
  }

  // Click Create button in the modal
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).first().click()

  // Wait for modal to close (this happens after loadParameters completes in the UI)
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 20000 })

  // Wait for network idle to ensure all API calls complete
  await page.waitForLoadState('networkidle')

  // Reload the page to get fresh data
  await page.reload({ waitUntil: 'networkidle' })

  // Wait for parameter to appear in the list (search across pages due to pagination)
  await page.waitForTimeout(2000)
  const found = await findParameterOnPage(page, name)
  expect(found).toBe(true)
}

async function deleteParameter(page: any, paramName: string) {
  // Find the parameter across pages (handles pagination)
  const found = await findParameterOnPage(page, paramName)
  expect(found).toBe(true)
  const paramDiv = page.locator('div.cursor-pointer').filter({ hasText: paramName })

  // Click the delete button (TrashIcon with aria-label="Delete")
  await paramDiv.getByRole('button', { name: 'Delete' }).first().click()
  await page.waitForLoadState('networkidle')

  // Confirm deletion in the delete modal
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).first().click()
  await page.waitForLoadState('networkidle')

  // Wait for delete modal to close
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

  // Reload page to ensure fresh data load after deletion
  await page.reload({ waitUntil: 'networkidle' })

  // Wait for parameter to be removed from list
  await expect(page.locator('div.cursor-pointer').filter({ hasText: paramName })).not.toBeVisible({ timeout: 15000 })
}

test.describe('SSM Parameter Store E2E Tests - Accordion UI', () => {
  test.describe.configure({ mode: 'serial' })

  test('create String parameter and verify in list', async ({ page }) => {
    const paramName = '/test-e2e-string-' + Date.now()
    const paramValue = 'test-value-' + Date.now()

    // Create parameter
    await createParameter(page, paramName, paramValue, 'String')

    // Verify parameter appears in the list (accordion UI uses div.cursor-pointer)
    const paramDiv = page.locator('div.cursor-pointer').filter({ hasText: paramName })
    await expect(paramDiv).toBeVisible({ timeout: 15000 })

    // Verify it shows with "String" type badge - scope to the type column div
    await expect(paramDiv.locator('div').filter({ hasText: 'String' }).first()).toBeVisible()

    // Clean up - delete the parameter
    await deleteParameter(page, paramName)

    // Verify parameter removed from list
    await expect(page.locator('div.cursor-pointer').filter({ hasText: paramName })).not.toBeVisible({ timeout: 15000 })
  })

  test('view parameter value (accordion)', async ({ page }) => {
    const paramName = '/test-e2e-view-' + Date.now()
    const paramValue = 'secret-value-' + Date.now()

    // Create parameter
    await createParameter(page, paramName, paramValue, 'String')

    // Find parameter div (accordion UI uses div.cursor-pointer)
    const paramDiv = page.locator('div.cursor-pointer').filter({ hasText: paramName })
    await expect(paramDiv).toBeVisible({ timeout: 15000 })

    // Click param div to expand accordion
    await paramDiv.click()
    await page.waitForLoadState('networkidle')

    // Click View Value button - find it within the same parameter container
    // The button is in SSMParameterDetails which is a sibling of paramDiv
    const paramContainer = paramDiv.locator('..')
    await paramContainer.getByText('View Value').first().click()
    await page.waitForLoadState('networkidle')

    // Verify value modal appears with correct title
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('dialog').getByText(`Parameter: ${paramName}`)).toBeVisible()

    // Verify the value is displayed
    await expect(page.getByText(paramValue)).toBeVisible()

    // Close the modal
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).first().click()
    await page.waitForLoadState('networkidle')

    // Verify modal is closed
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Clean up
    await deleteParameter(page, paramName)
  })

  test('view parameter history (accordion)', async ({ page }) => {
    const paramName = '/test-e2e-history-' + Date.now()
    const paramValue = 'history-test-' + Date.now()

    // Create parameter
    await createParameter(page, paramName, paramValue, 'String')

    // Find parameter div (accordion UI uses div.cursor-pointer)
    const paramDiv = page.locator('div.cursor-pointer').filter({ hasText: paramName })
    await expect(paramDiv).toBeVisible({ timeout: 15000 })

    // Click param div to expand accordion
    await paramDiv.click()
    await page.waitForLoadState('networkidle')

    // Click View History button - find it within the same parameter container
    const paramContainer = paramDiv.locator('..')
    await paramContainer.getByText('View History').first().click()
    await page.waitForLoadState('networkidle')

    // Verify history modal appears with correct title
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText(`History: ${paramName}`)).toBeVisible()

    // Verify history shows at least v1 - scope to history dialog
    await expect(page.getByRole('dialog').getByText('v1')).toBeVisible()

    // Close the modal
    await page.getByRole('dialog').getByRole('button', { name: 'Close' }).first().click()
    await page.waitForLoadState('networkidle')

    // Verify modal is closed
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

    // Clean up
    await deleteParameter(page, paramName)
  })

  test('create SecureString parameter and verify', async ({ page }) => {
    const paramName = '/test-e2e-secure-' + Date.now()
    const paramValue = 'encrypted-value-' + Date.now()

    // Create SecureString parameter
    await createParameter(page, paramName, paramValue, 'SecureString')

    // Verify parameter appears in the list (accordion UI uses div.cursor-pointer)
    const paramDiv = page.locator('div.cursor-pointer').filter({ hasText: paramName })
    await expect(paramDiv).toBeVisible({ timeout: 15000 })

    // Verify it shows SecureString type
    await expect(paramDiv.getByText('SecureString')).toBeVisible()

    // Clean up
    await deleteParameter(page, paramName)

    // Verify parameter removed from list
    await expect(page.locator('div.cursor-pointer').filter({ hasText: paramName })).not.toBeVisible({ timeout: 15000 })
  })

  test('delete parameter', async ({ page }) => {
    const paramName = '/test-e2e-delete-' + Date.now()
    const paramValue = 'delete-me-' + Date.now()

    // Create parameter
    await createParameter(page, paramName, paramValue, 'String')

    // Verify parameter appears in the list (accordion UI uses div.cursor-pointer)
    const paramDiv = page.locator('div.cursor-pointer').filter({ hasText: paramName })
    await expect(paramDiv).toBeVisible({ timeout: 15000 })

    // Click Delete button (TrashIcon with aria-label="Delete")
    await paramDiv.getByRole('button', { name: 'Delete' }).first().click()
    await page.waitForLoadState('networkidle')

    // Verify delete confirmation modal appears - use heading role for specificity
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Delete Parameter' })).toBeVisible()

    // Confirm deletion
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).first().click()
    await page.waitForLoadState('networkidle')

    // Wait for delete modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Verify parameter removed from list
    await expect(page.locator('div.cursor-pointer').filter({ hasText: paramName })).not.toBeVisible({ timeout: 15000 })
  })

  test('create StringList parameter and verify', async ({ page }) => {
    const paramName = '/test-e2e-list-' + Date.now()
    const paramValue = 'item1,item2,item3'

    // Create StringList parameter
    await createParameter(page, paramName, paramValue, 'StringList')

    // Verify parameter appears in the list (accordion UI uses div.cursor-pointer)
    const paramDiv = page.locator('div.cursor-pointer').filter({ hasText: paramName })
    await expect(paramDiv).toBeVisible({ timeout: 15000 })

    // Verify it shows StringList type
    await expect(paramDiv.getByText('StringList')).toBeVisible()

    // Clean up
    await deleteParameter(page, paramName)

    // Verify parameter removed from list
    await expect(page.locator('div.cursor-pointer').filter({ hasText: paramName })).not.toBeVisible({ timeout: 15000 })
  })

  test('accordion expands exclusively', async ({ page }) => {
    const paramName1 = '/test-e2e-acc1-' + Date.now()
    const paramName2 = '/test-e2e-acc2-' + Date.now()

    // Create two parameters
    await createParameter(page, paramName1, 'value1', 'String')
    await createParameter(page, paramName2, 'value2', 'String')

    // Reload to see both
    await page.reload({ waitUntil: 'networkidle' })

    // Find first parameter across pages (handles pagination)
    const found1 = await findParameterOnPage(page, paramName1)
    expect(found1).toBe(true)
    const paramDiv1 = page.locator('div.cursor-pointer').filter({ hasText: paramName1 })
    const paramContainer1 = paramDiv1.locator('..')

    // Click first param div to expand
    await paramDiv1.click()
    await page.waitForLoadState('networkidle')

    // Verify first param expanded (View Value button visible in container)
    await expect(paramContainer1.getByText('View Value')).toBeVisible()

    // Find second parameter across pages (handles pagination)
    const found2 = await findParameterOnPage(page, paramName2)
    expect(found2).toBe(true)
    const paramDiv2 = page.locator('div.cursor-pointer').filter({ hasText: paramName2 })
    const paramContainer2 = paramDiv2.locator('..')

    // Click second param div to expand (should collapse first)
    await paramDiv2.click()
    await page.waitForLoadState('networkidle')

    // Verify second param expanded
    await expect(paramContainer2.getByText('View Value')).toBeVisible()

    // Verify only one expanded at a time - count expanded divs
    // Each expanded section has SSMParameterDetails with "View Value" button
    const expandedCount = await page.getByText('View Value').count()
    expect(expandedCount).toBe(1)

    // Clean up
    await deleteParameter(page, paramName1)
    await deleteParameter(page, paramName2)
  })
})
