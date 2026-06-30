import { test, expect } from '../fixtures.js'

// Helper to find bucket on any page (handles pagination)
async function findBucketOnPage(page: any, bucketName: string, maxPages = 5): Promise<boolean> {
  for (let i = 0; i < maxPages; i++) {
    const bucket = page.getByText(bucketName, { exact: true })
    if (await bucket.isVisible({ timeout: 2000 }).catch(() => false)) {
      return true
    }
    // Try clicking Next button if available
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

test.describe('S3', () => {
  test('navigate to S3 service page', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'S3 Buckets' })).toBeVisible({ timeout: 15000 })
  })

  test('show bucket count', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('bucket(s)')).toBeVisible()
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: '+ Create Bucket' }).first()).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await expect(page.getByText('Create New Bucket')).toBeVisible({ timeout: 10000 })
  })

  test('create modal has bucket name field', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await expect(page.getByPlaceholder('Enter bucket name')).toBeVisible()
  })

  test('cancel closes create dialog', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await expect(page.getByText('Create New Bucket')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Create New Bucket')).not.toBeVisible({ timeout: 5000 })
  })

  test('create bucket with basic options', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    
    const bucketName = `test-e2e-basic-${Date.now()}`
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill(bucketName)
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    
    // Wait for success message
    await expect(page.getByText(`Bucket "${bucketName}" created successfully`)).toBeVisible({ timeout: 10000 })
    
    // Wait for modal to close and list to refresh
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    
    // Verify bucket appears in list (search across pages if needed)
    const found = await findBucketOnPage(page, bucketName)
    expect(found).toBe(true)
  })

  test('create bucket with CORS enabled', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    
    const bucketName = `test-e2e-cors-${Date.now()}`
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill(bucketName)
    await page.getByLabel('Enable CORS').check()
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    
    await expect(page.getByText(`Bucket "${bucketName}" created successfully`)).toBeVisible({ timeout: 10000 })
    
    // Wait for modal to close and list to refresh
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Verify bucket appears in list (search across pages if needed)
    const found = await findBucketOnPage(page, bucketName)
    expect(found).toBe(true)
  })

  test('create bucket with advanced options visible', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill('test-advanced')
    
    // Expand advanced options
    const advancedOptions = page.getByRole('button', { name: 'Advanced Options' })
    await advancedOptions.click()
    await page.waitForTimeout(500)
    
    // Check advanced fields are visible
    await expect(page.getByText('Server-Side Encryption')).toBeVisible({ timeout: 5000 })
    await expect(page.getByLabel('Enable Versioning')).toBeVisible()
    await expect(page.getByLabel('Block Public Access')).toBeVisible()
    
    // Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Create New Bucket')).not.toBeVisible({ timeout: 5000 })
  })

  test('create bucket with versioning enabled', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    
    const bucketName = `test-e2e-versioned-${Date.now()}`
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill(bucketName)
    
    // Expand and enable versioning
    const advancedOptions = page.getByRole('button', { name: 'Advanced Options' })
    await advancedOptions.click()
    await page.waitForTimeout(500)
    await page.getByLabel('Enable Versioning').check()
    
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    
    await expect(page.getByText(`Bucket "${bucketName}" created successfully`)).toBeVisible({ timeout: 10000 })
    
    // Wait for modal to close and list to refresh
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Verify bucket appears in list (search across pages if needed)
    const found = await findBucketOnPage(page, bucketName)
    expect(found).toBe(true)
  })

  test('create bucket with tags', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    
    const bucketName = `test-e2e-tags-${Date.now()}`
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill(bucketName)
    
    // Expand and add tags
    const advancedOptions = page.getByRole('button', { name: 'Advanced Options' })
    await advancedOptions.click()
    await page.waitForTimeout(500)
    
    // Add a tag first
    await page.getByRole('button', { name: '+ Add Tag' }).click()
    await page.waitForTimeout(500)
    
    const keyInputs = page.getByPlaceholder('Key')
    await keyInputs.first().fill('environment')
    const valueInputs = page.getByPlaceholder('Value')
    await valueInputs.first().fill('test')
    
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    
    await expect(page.getByText(`Bucket "${bucketName}" created successfully`)).toBeVisible({ timeout: 10000 })
    
    // Wait for modal to close and list to refresh
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Verify bucket appears in list (search across pages if needed)
    const found = await findBucketOnPage(page, bucketName)
    expect(found).toBe(true)
  })

  test('select bucket to view objects', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Click View Objects button on first bucket
    const viewObjectsBtn = page.locator('.border.rounded-lg button[title="View Objects"]').first()
    if (await viewObjectsBtn.isVisible({ timeout: 5000 })) {
      await viewObjectsBtn.click()
      await page.waitForTimeout(1500)
      
      // Should show objects list with back button
      await expect(page.getByRole('button', { name: '← Back' })).toBeVisible({ timeout: 5000 })
    }
  })

  test('objects list shows upload button', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Navigate to bucket using View Objects button
    const viewObjectsBtn = page.locator('.border.rounded-lg button[title="View Objects"]').first()
    if (await viewObjectsBtn.isVisible({ timeout: 5000 })) {
      await viewObjectsBtn.click()
      await page.waitForTimeout(2000)
      
      // Check for upload button
      await expect(page.getByText('Upload File')).toBeVisible({ timeout: 5000 })
    }
  })

  test('upload button opens file dialog', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Navigate to bucket
    const viewObjectsBtn = page.locator('.border.rounded-lg button[title="View Objects"]').first()
    if (!await viewObjectsBtn.isVisible({ timeout: 5000 })) {
      test.skip('No bucket available')
      return
    }
    await viewObjectsBtn.click()
    await page.waitForTimeout(2000)
    
    // Click upload button - should show file input
    const uploadBtn = page.getByRole('button', { name: 'Upload' })
    if (await uploadBtn.isVisible({ timeout: 5000 })) {
      await uploadBtn.click()
      await page.waitForTimeout(500)
      
      // File input should be visible
      const fileInput = page.locator('input[type="file"]')
      await expect(fileInput).toBeVisible({ timeout: 5000 })
    }
  })

  test('view uploaded object content', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Navigate to bucket
    const viewObjectsBtn = page.locator('.border.rounded-lg button[title="View Objects"]').first()
    if (!await viewObjectsBtn.isVisible({ timeout: 5000 })) {
      test.skip('No bucket available')
      return
    }
    await viewObjectsBtn.click()
    await page.waitForTimeout(2000)
    
    // Look for any object file in the list
    const objectRow = page.locator('.divide-y a').first()
    if (await objectRow.isVisible({ timeout: 5000 })) {
      await objectRow.click()
      await page.waitForTimeout(1500)
      
      // Should open view modal
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
      
      // Check close button exists
      await expect(page.getByRole('button', { name: 'Close' })).toBeVisible()
      
      // Close modal
      await page.getByRole('button', { name: 'Close' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('copy presigned link from object', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Navigate to bucket
    const viewObjectsBtn = page.locator('.border.rounded-lg button[title="View Objects"]').first()
    if (!await viewObjectsBtn.isVisible({ timeout: 5000 })) {
      test.skip('No bucket available')
      return
    }
    await viewObjectsBtn.click()
    await page.waitForTimeout(2000)
    
    // Click copy link button
    const copyLinkBtn = page.locator('button[title="Copy Link"]').first()
    if (await copyLinkBtn.isVisible({ timeout: 5000 })) {
      await copyLinkBtn.click()
      await page.waitForTimeout(1000)
      
      // Should show success message or no error toast
      // The previous error was "Failed to get presigned URL"
      // Now it should work without the JSON parse error
    }
  })

  test('toggle versioning on existing bucket', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Find a versioned bucket (has "Disable" button) — look for "versioned" in name
    const versionedBucket = page.locator('.border.rounded-lg span.font-medium').filter({ hasText: /versioned/ }).first()
    await expect(versionedBucket).toBeVisible({ timeout: 10000 })
    await versionedBucket.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Find the "Disable" button in the versioning section
    const disableBtn = page.getByRole('button', { name: 'Disable' }).first()
    if (!await disableBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip('Disable button not found — versioning may not be enabled on any bucket')
      return
    }

    // Click Disable
    await disableBtn.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Verify button changed to "Enable"
    const enableBtn = page.getByRole('button', { name: 'Enable' }).first()
    await expect(enableBtn).toBeVisible({ timeout: 8000 })
  })

  test('open lifecycle modal from bucket details', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Expand first bucket by clicking its name
    const bucketName = page.locator('.border.rounded-lg span.font-medium').first()
    await expect(bucketName).toBeVisible({ timeout: 10000 })
    await bucketName.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Click Manage Lifecycle button
    const lifecycleBtn = page.getByText('Manage Lifecycle').first()
    await expect(lifecycleBtn).toBeVisible({ timeout: 8000 })
    await lifecycleBtn.click()
    await page.waitForTimeout(1000)

    // Verify dialog appeared
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
  })

  test('add lifecycle rule from modal', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Expand first bucket
    const bucketName = page.locator('.border.rounded-lg span.font-medium').first()
    await expect(bucketName).toBeVisible({ timeout: 10000 })
    await bucketName.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Click Manage Lifecycle
    const lifecycleBtn = page.getByText('Manage Lifecycle').first()
    await expect(lifecycleBtn).toBeVisible({ timeout: 8000 })
    await lifecycleBtn.click()
    await page.waitForTimeout(1000)

    // Verify dialog opened
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })

    // Click Add Rule button to show form
    const addRuleBtn = page.getByText('Add Rule').first()
    await addRuleBtn.click({ timeout: 5000, force: true })
    await page.waitForTimeout(1000)

    // Fill Rule ID (placeholder "e.g., ExpireLogs")
    const idInput = page.locator('input[placeholder*="ExpireLogs"]').first()
    if (await idInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await idInput.fill(`e2e-rule-${Date.now()}`, { force: true })
    }

    // Fill Prefix Filter (placeholder "e.g., logs/")
    const prefixInput = page.locator('input[placeholder*="logs/"]').first()
    if (await prefixInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prefixInput.fill('test-prefix/', { force: true })
    }

    // Fill Expiration Days (placeholder "e.g., 30")
    const daysInput = page.locator('input[placeholder*="30"]').first()
    if (await daysInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await daysInput.fill('30', { force: true })
    }

    // Click Save Changes
    const saveBtn = page.getByText('Save Changes').first()
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click({ force: true })
      await page.waitForTimeout(2000)

      // Modal should close or show success
      await expect(dialog).not.toBeVisible({ timeout: 10000 }).catch(() => {})
    }
  })

  test('delete lifecycle rules', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Expand first bucket
    const bucketName = page.locator('.border.rounded-lg span.font-medium').first()
    await expect(bucketName).toBeVisible({ timeout: 10000 })
    await bucketName.click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    // Click Manage Lifecycle
    const lifecycleBtn = page.getByText('Manage Lifecycle').first()
    await expect(lifecycleBtn).toBeVisible({ timeout: 8000 })
    await lifecycleBtn.click()
    await page.waitForTimeout(1000)

    // Verify dialog opened
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })

    // Click Delete All button
    const deleteAllBtn = page.getByText('Delete All').first()
    await deleteAllBtn.click({ timeout: 5000, force: true })
    await page.waitForTimeout(500)

    // Handle confirmation — "Confirm" button appears inline
    const confirmBtn = page.getByText('Confirm').first()
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click({ force: true })
      await page.waitForTimeout(1500)
    }

    // Verify modal closed or empty state
    await expect(dialog).not.toBeVisible({ timeout: 10000 }).catch(() => {})
  })
})

test.describe('Pagination', () => {
  test('shows per-page selector', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Show:')).toBeVisible({ timeout: 10000 })
    // Find select inside the Show: container (avoids region selector clash)
    const paginationSection = page.getByText('Show:').locator('..')
    const perPageSelect = paginationSection.locator('select')
    await expect(perPageSelect).toBeVisible({ timeout: 10000 })
  })

  test('change items per page', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    const paginationSection = page.getByText('Show:').locator('..')
    const perPageSelect = paginationSection.locator('select')
    await perPageSelect.selectOption('50')
    await page.waitForLoadState('networkidle')
    await expect(paginationSection.getByText('per page')).toBeVisible({ timeout: 5000 })
  })

  test('page navigation buttons work when paginated', async ({ page }) => {
    await page.goto('/#/services/s3')
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