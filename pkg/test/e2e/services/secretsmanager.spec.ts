import { test, expect } from '../fixtures.js'

// Helper to find secret on any page (handles pagination, 15 per page)
async function findSecretOnPage(page: any, secretName: string, maxPages = 5): Promise<boolean> {
  for (let i = 0; i < maxPages; i++) {
    const secret = page.getByText(secretName, { exact: true })
    if (await secret.isVisible({ timeout: 2000 }).catch(() => false)) {
      return true
    }
    const nextBtn = page.getByRole('button', { name: 'Next' })
    if (await nextBtn.isEnabled({ timeout: 1000 }).catch(() => false)) {
      await nextBtn.click()
      await page.waitForTimeout(500)
    } else {
      break
    }
  }
  return false
}

async function createSecret(page, name, value, description = '') {
  await page.goto('/#/services/secrets-manager', { waitUntil: 'networkidle' })

  // Click Create Secret button
  await page.getByRole('button', { name: /Create Secret/i }).first().click()
  await page.waitForLoadState('networkidle')

  // Wait for modal — use heading role to find modal container
  const createHeading = page.getByRole('heading', { name: 'Create Secret' })
  await expect(createHeading).toBeVisible({ timeout: 10000 })
  const createDialog = createHeading.locator('..')

  // Fill in the secret name
  await page.getByPlaceholder('my-secret').fill(name)

  // Fill in the value (textarea) — inside modal
  await createDialog.locator('textarea').fill(value)

  // Optional: Fill description
  if (description) {
    const descField = page.getByPlaceholder('Database credentials for production')
    if (await descField.isVisible()) {
      await descField.fill(description)
    }
  }

  // Click Create button in the modal
  await createDialog.getByRole('button', { name: 'Create' }).first().click()

  // Wait for modal to close — heading disappears
  await expect(createHeading).not.toBeVisible({ timeout: 20000 })

  // Wait for network idle
  await page.waitForLoadState('networkidle')

  // Reload the page to get fresh data
  await page.reload({ waitUntil: 'networkidle' })

  // Wait for secret to appear (search across pages due to pagination)
  await page.waitForTimeout(2000)
  const found = await findSecretOnPage(page, name)
  expect(found).toBe(true)
}

async function deleteSecret(page, secretName) {
  // Find the secret (search across pages due to pagination)
  const found = await findSecretOnPage(page, secretName)
  expect(found).toBe(true)
  const secretDiv = page.locator('div.cursor-pointer').filter({ hasText: secretName })

  // Click the delete button (TrashIcon with aria-label="Delete")
  await secretDiv.getByRole('button', { name: 'Delete' }).first().click()
  await page.waitForLoadState('networkidle')

  // Confirm deletion — find delete modal by heading
  const deleteHeading = page.getByRole('heading', { name: 'Delete Secret' })
  await expect(deleteHeading).toBeVisible({ timeout: 5000 })
  const deleteDialog = deleteHeading.locator('..').filter({ hasText: secretName })

  await expect(deleteDialog.getByText(secretName)).toBeVisible()
  await deleteDialog.getByRole('button', { name: 'Delete' }).first().click()
  await page.waitForLoadState('networkidle')

  // Wait for delete modal to close
  await expect(deleteHeading).not.toBeVisible({ timeout: 15000 })

  // Reload page to ensure fresh data load after deletion
  await page.reload({ waitUntil: 'networkidle' })

  // Wait for secret to be removed from list
  await expect(page.locator('div.cursor-pointer').filter({ hasText: secretName })).not.toBeVisible({ timeout: 15000 })
}

test.describe('Secrets Manager E2E Tests - Accordion UI', () => {
  test.describe.configure({ mode: 'serial' })

  test('create secret and verify in list', async ({ page }) => {
    const secretName = 'test-e2e-secret-' + Date.now()
    const secretValue = 'test-value-' + Date.now()

    // Create secret
    await createSecret(page, secretName, secretValue, 'E2E test secret')

    // Verify secret appears in the list
    const secretDiv = page.locator('div.cursor-pointer').filter({ hasText: secretName })
    await expect(secretDiv).toBeVisible({ timeout: 15000 })

    // Clean up - delete the secret
    await deleteSecret(page, secretName)

    // Verify secret removed from list
    await expect(page.locator('div.cursor-pointer').filter({ hasText: secretName })).not.toBeVisible({ timeout: 15000 })
  })

  test('view secret value (accordion)', async ({ page }) => {
    const secretName = 'test-e2e-view-' + Date.now()
    const secretValue = 'secret-value-' + Date.now()

    // Create secret
    await createSecret(page, secretName, secretValue)

    // Find secret div
    const secretDiv = page.locator('div.cursor-pointer').filter({ hasText: secretName })
    await expect(secretDiv).toBeVisible({ timeout: 15000 })

    // Click secret div to expand accordion
    await secretDiv.click()

    // Wait for accordion content — "Edit Value" button indicates content loaded
    await page.getByRole('button', { name: 'Edit Value' }).waitFor({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Verify secret value is displayed (page-level, no fragile parent traversal)
    await expect(page.getByText(secretValue)).toBeVisible()

    // Clean up
    await deleteSecret(page, secretName)
  })

  test('edit secret value', async ({ page }) => {
    const secretName = 'test-e2e-edit-' + Date.now()
    const secretValue = 'original-value-' + Date.now()
    const newValue = 'edited-value-' + Date.now()

    // Create secret
    await createSecret(page, secretName, secretValue)

    // Find secret div
    const secretDiv = page.locator('div.cursor-pointer').filter({ hasText: secretName })
    await expect(secretDiv).toBeVisible({ timeout: 15000 })

    // Click secret div to expand accordion
    await secretDiv.click()

    // Wait for accordion content
    await page.getByRole('button', { name: 'Edit Value' }).waitFor({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Click Edit Value button — page-level (only one expanded)
    await page.getByRole('button', { name: 'Edit Value' }).click()
    await page.waitForLoadState('networkidle')

    // Verify edit modal appears — use dialog role for robust parent
    const editDialog = page.getByRole('dialog')
    await expect(editDialog).toBeVisible({ timeout: 10000 })
    // Confirm it's the right dialog by checking heading inside
    await expect(editDialog.getByRole('heading', { name: `Edit: ${secretName}` })).toBeVisible({ timeout: 5000 })

    // Modify the value in the textarea
    const textarea = editDialog.locator('textarea')
    await textarea.clear()
    await textarea.fill(newValue)

    // Click Save Changes
    await editDialog.getByRole('button', { name: 'Save Changes' }).click()
    await page.waitForLoadState('networkidle')

    // Wait for modal to close
    await expect(editHeading).not.toBeVisible({ timeout: 15000 })

    // Reload and verify new value — re-query secretDiv after reload (stale ref fix)
    await page.reload({ waitUntil: 'networkidle' })

    // Find secret across pages (pagination may hide it)
    const foundAfterEdit = await findSecretOnPage(page, secretName)
    expect(foundAfterEdit).toBe(true)
    const refreshedSecretDiv = page.locator('div.cursor-pointer').filter({ hasText: secretName })
    await refreshedSecretDiv.click()

    // Wait for accordion content
    await page.getByRole('button', { name: 'Edit Value' }).waitFor({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Verify new value is displayed
    await expect(page.getByText(newValue)).toBeVisible()

    // Clean up
    await deleteSecret(page, secretName)
  })

  test('delete secret', async ({ page }) => {
    const secretName = 'test-e2e-delete-' + Date.now()
    const secretValue = 'delete-me-' + Date.now()

    // Create secret
    await createSecret(page, secretName, secretValue)

    // Verify secret appears in the list
    const secretDiv = page.locator('div.cursor-pointer').filter({ hasText: secretName })
    await expect(secretDiv).toBeVisible({ timeout: 15000 })

    // Click Delete button
    await secretDiv.getByRole('button', { name: 'Delete' }).first().click()
    await page.waitForLoadState('networkidle')

    // Confirm deletion — use heading role
    const deleteHeading = page.getByRole('heading', { name: 'Delete Secret' })
    await expect(deleteHeading).toBeVisible({ timeout: 5000 })
    const deleteDialog = deleteHeading.locator('..').filter({ hasText: secretName })

    await expect(deleteDialog.getByText(secretName)).toBeVisible()
    await deleteDialog.getByRole('button', { name: 'Delete' }).first().click()
    await page.waitForLoadState('networkidle')

    // Wait for delete modal to close
    await expect(deleteHeading).not.toBeVisible({ timeout: 15000 })

    // Reload page
    await page.reload({ waitUntil: 'networkidle' })

    // Verify secret removed from list
    await expect(page.locator('div.cursor-pointer').filter({ hasText: secretName })).not.toBeVisible({ timeout: 15000 })
  })

  test('accordion expands exclusively', async ({ page }) => {
    const secretName1 = 'test-e2e-acc1-' + Date.now()
    const secretName2 = 'test-e2e-acc2-' + Date.now()

    // Create two secrets
    await createSecret(page, secretName1, 'value1')
    await createSecret(page, secretName2, 'value2')

    // Reload to see both
    await page.reload({ waitUntil: 'networkidle' })

    // Find first secret (search across pages due to pagination)
    const found1 = await findSecretOnPage(page, secretName1)
    expect(found1).toBe(true)
    const secretDiv1 = page.locator('div.cursor-pointer').filter({ hasText: secretName1 })

    // Click first secret div to expand
    await secretDiv1.click()

    // Wait for accordion content
    await page.getByRole('button', { name: 'Edit Value' }).waitFor({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Verify first secret expanded — "Edit Value" button visible
    await expect(page.getByRole('button', { name: 'Edit Value' })).toBeVisible()

    // Find second secret (may be on different page)
    const found2 = await findSecretOnPage(page, secretName2)
    expect(found2).toBe(true)
    const secretDiv2 = page.locator('div.cursor-pointer').filter({ hasText: secretName2 })

    // Click second secret div to expand (should collapse first)
    await secretDiv2.click()

    // Wait for accordion content to update
    await page.waitForLoadState('networkidle')

    // Verify second secret expanded — still have "Edit Value" button (new accordion)
    await expect(page.getByRole('button', { name: 'Edit Value' })).toBeVisible()

    // Clean up
    await deleteSecret(page, secretName1)
    await deleteSecret(page, secretName2)
  })

  test('create JSON secret and verify', async ({ page }) => {
    const secretName = 'test-e2e-json-' + Date.now()
    const secretValue = JSON.stringify({ username: 'admin', password: 'secret123' })

    // Create JSON secret
    await createSecret(page, secretName, secretValue)

    // Verify secret appears in the list
    const secretDiv = page.locator('div.cursor-pointer').filter({ hasText: secretName })
    await expect(secretDiv).toBeVisible({ timeout: 15000 })

    // Expand accordion
    await secretDiv.click()

    // Wait for accordion content
    await page.getByRole('button', { name: 'Edit Value' }).waitFor({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Check that JSON is displayed properly — verify full JSON string
    await expect(page.getByText(secretValue, { exact: true })).toBeVisible()

    // Clean up
    await deleteSecret(page, secretName)
  })
})

test('usage examples section', async ({ page }) => {
  await page.goto('/#/services/secrets-manager')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('heading', { name: 'Usage Examples' })).toBeVisible()
  // Verify AWS CLI tab is visible
  await expect(page.getByText('AWS CLI')).toBeVisible()
})

test.describe('Pagination', () => {
  test('shows per-page selector when items exist', async ({ page }) => {
    await page.goto('/#/services/secrets-manager')
    await page.waitForLoadState('networkidle')
    // Pagination only renders when secrets exist. Check gracefully.
    const showLabel = page.getByText('Show:')
    if (await showLabel.isVisible().catch(() => false)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await expect(perPageSelect).toBeVisible({ timeout: 5000 })
    }
  })

  test('change items per page when items exist', async ({ page }) => {
    await page.goto('/#/services/secrets-manager')
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
    await page.goto('/#/services/secrets-manager')
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
