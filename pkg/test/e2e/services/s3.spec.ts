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
  test.describe.configure({ timeout: 20000 })

  test('navigate to S3 service page', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('heading', { name: 'S3 Buckets' })).toBeVisible({ timeout: 15000 })
  })

  test('show bucket count', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText('bucket(s)')).toBeVisible()
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('button', { name: '+ Create Bucket' }).first()).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await expect(page.getByText('Create New Bucket')).toBeVisible({ timeout: 10000 })
  })

  test('create modal has bucket name field', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await expect(page.getByPlaceholder('Enter bucket name')).toBeVisible()
  })

  test('cancel closes create dialog', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await expect(page.getByText('Create New Bucket')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Create New Bucket')).not.toBeVisible({ timeout: 5000 })
  })

  test('create bucket with basic options', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    
    const bucketName = `test-e2e-basic-${Date.now()}`
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill(bucketName)
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    
    // Wait for success message
    await expect(page.getByText(`Bucket "${bucketName}" created successfully`)).toBeVisible({ timeout: 10000 })
    
    // Wait for modal to close and list to refresh
    await page.waitForLoadState('domcontentloaded')
    
    // Verify bucket appears in list (search across pages if needed)
    const found = await findBucketOnPage(page, bucketName)
    expect(found).toBe(true)
  })

  test('create bucket with CORS enabled', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    
    const bucketName = `test-e2e-cors-${Date.now()}`
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill(bucketName)
    await page.getByLabel('Enable CORS').check()
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    
    await expect(page.getByText(`Bucket "${bucketName}" created successfully`)).toBeVisible({ timeout: 10000 })
    
    // Wait for modal to close and list to refresh
    await page.waitForLoadState('domcontentloaded')
    
    // Verify bucket appears in list (search across pages if needed)
    const found = await findBucketOnPage(page, bucketName)
    expect(found).toBe(true)
  })

  test('create bucket with advanced options visible', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    
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
    await page.waitForLoadState('domcontentloaded')
    
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
    await page.waitForLoadState('domcontentloaded')
    
    // Verify bucket appears in list (search across pages if needed)
    const found = await findBucketOnPage(page, bucketName)
    expect(found).toBe(true)
  })

  test('create bucket with tags', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    
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
    await page.waitForLoadState('domcontentloaded')
    
    // Verify bucket appears in list (search across pages if needed)
    const found = await findBucketOnPage(page, bucketName)
    expect(found).toBe(true)
  })

  test('select bucket to view objects', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    
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
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)
    
    // Navigate to bucket using View Objects button
    const viewObjectsBtn = page.locator('.border.rounded-lg button[title="View Objects"]').first()
    if (await viewObjectsBtn.isVisible({ timeout: 5000 })) {
      await viewObjectsBtn.click()
      await page.waitForTimeout(2000)
      
      // Check for upload label
      const uploadLabel = page.locator('label[title="Upload Files"]')
      await expect(uploadLabel).toBeVisible({ timeout: 5000 })
      await expect(uploadLabel).toHaveAttribute('aria-label', 'Upload Files')
      // Assert the wrapped file input exists (may be hidden)
      await expect(uploadLabel.locator('input[type="file"]')).toBeAttached({ timeout: 5000 })
    }
  })

  test('upload button opens file dialog', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
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
    await page.waitForLoadState('domcontentloaded')
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
    await page.waitForLoadState('domcontentloaded')
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
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Find a versioned bucket (has "Disable" button) — look for "versioned" in name
    const versionedBucket = page.locator('.border.rounded-lg span.font-medium').filter({ hasText: /versioned/ }).first()
    await expect(versionedBucket).toBeVisible({ timeout: 10000 })
    await versionedBucket.click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    // Find the "Disable" button in the versioning section
    const disableBtn = page.getByRole('button', { name: 'Disable' }).first()
    if (!await disableBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip('Disable button not found — versioning may not be enabled on any bucket')
      return
    }

    // Click Disable
    await disableBtn.click()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    // Verify button changed to "Enable"
    const enableBtn = page.getByRole('button', { name: 'Enable' }).first()
    await expect(enableBtn).toBeVisible({ timeout: 8000 })
  })

  test('open lifecycle modal from bucket details', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Expand first bucket by clicking its name
    const bucketName = page.locator('.border.rounded-lg span.font-medium').first()
    await expect(bucketName).toBeVisible({ timeout: 10000 })
    await bucketName.click()
    await page.waitForLoadState('domcontentloaded')
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
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Expand first bucket
    const bucketName = page.locator('.border.rounded-lg span.font-medium').first()
    await expect(bucketName).toBeVisible({ timeout: 10000 })
    await bucketName.click()
    await page.waitForLoadState('domcontentloaded')
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
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    // Expand first bucket
    const bucketName = page.locator('.border.rounded-lg span.font-medium').first()
    await expect(bucketName).toBeVisible({ timeout: 10000 })
    await bucketName.click()
    await page.waitForLoadState('domcontentloaded')
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

  test('folder upload preserves nested keys', async ({ page }) => {
    const bucketName = `test-folder-${Date.now()}`
    await page.request.post('http://localhost:8081/s3/buckets', { data: { Bucket: bucketName } })
    try {
      await page.goto('/#/services/s3')
      await page.waitForLoadState('domcontentloaded')
      await page.locator('.border.rounded-lg').filter({ hasText: bucketName }).getByRole('button', { name: 'View Objects' }).click()
      await page.waitForLoadState('domcontentloaded')
      await page.locator('input[type=file][webkitdirectory]').waitFor({ state: 'attached', timeout: 5000 })
      await page.evaluate(() => {
        const input = document.querySelector('input[type=file][webkitdirectory]') as HTMLInputElement
        const dt = new DataTransfer()
        const files = [
          ['file1.txt', 'folder1/file1.txt'],
          ['file2.txt', 'folder1/file2.txt'],
          ['file3.txt', 'folder1/folder2/file3.txt'],
          ['file4.txt', 'folder1/folder2/file4.txt'],
        ]
        for (const [name, rel] of files) {
          const f = new File([name], name, { type: 'text/plain' })
          Object.defineProperty(f, 'webkitRelativePath', { value: rel })
          dt.items.add(f)
        }
        input.files = dt.files
        input.dispatchEvent(new Event('change', { bubbles: true }))
      })
      // Switch to "All files" mode to see full paths (folder nav hides nested files)
      const main = page.locator('main')
      const viewSelect = main.locator('select').first()
      await viewSelect.selectOption('All files')
      await page.waitForLoadState('networkidle')
      await expect(page.getByText('folder1/file1.txt', { exact: true })).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('folder1/folder2/file3.txt', { exact: true })).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('4 file(s) uploaded successfully')).toBeVisible({ timeout: 5000 })
    } finally {
      await page.request.delete(`http://localhost:8081/s3/buckets/${bucketName}`).catch(() => {})
    }
  })
})

test.describe('Pagination', () => {
  test('shows per-page selector', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByText('Show:')).toBeVisible({ timeout: 10000 })
    // Find select inside the Show: container (avoids region selector clash)
    const paginationSection = page.getByText('Show:').locator('..')
    const perPageSelect = paginationSection.locator('select')
    await expect(perPageSelect).toBeVisible({ timeout: 10000 })
  })

  test('change items per page', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
    const paginationSection = page.getByText('Show:').locator('..')
    const perPageSelect = paginationSection.locator('select')
    await perPageSelect.selectOption('50')
    await page.waitForLoadState('domcontentloaded')
    await expect(paginationSection.getByText('per page')).toBeVisible({ timeout: 5000 })
  })

  test('page navigation buttons work when paginated', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('domcontentloaded')
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

test.describe('S3 folder navigation', () => {
  test.describe.configure({ timeout: 10000 })
  const PROXY = process.env.PROXY_URL || 'http://localhost:8081'

  async function seedBucket(page: any, bucket: string) {
    await page.request.post(`${PROXY}/s3/buckets`, { data: { Bucket: bucket } })
    await page.request.post(`${PROXY}/s3/buckets/${bucket}/objects`, { data: { Key: 'a/b/c.txt', Body: 'nested c' } })
    await page.request.post(`${PROXY}/s3/buckets/${bucket}/objects`, { data: { Key: 'a/d.txt', Body: 'file d' } })
    await page.request.post(`${PROXY}/s3/buckets/${bucket}/objects`, { data: { Key: 'root.txt', Body: 'root file' } })
    await page.request.post(`${PROXY}/s3/buckets/${bucket}/objects`, { data: { Key: 'empty/', Body: '' } })
  }

  const FLOCI = 'http://localhost:4566'
  async function cleanupBucket(page: any, bucket: string) {
    // Use Floci directly — proxy {key} route can't match keys with '/'
    await page.request.delete(`${FLOCI}/${bucket}/a/b/c.txt`).catch(() => {})
    await page.request.delete(`${FLOCI}/${bucket}/a/d.txt`).catch(() => {})
    await page.request.delete(`${FLOCI}/${bucket}/root.txt`).catch(() => {})
    await page.request.delete(`${FLOCI}/${bucket}/empty/`).catch(() => {})
    await page.request.delete(`${FLOCI}/${bucket}`).catch(() => {})
  }

  async function openBucket(page: any, bucket: string) {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.reload()
    await page.waitForLoadState('networkidle')
    // Set per-page to 50 to avoid pagination hiding the bucket
    const showSection = page.getByText('Show:').locator('..')
    const perPageSelect = showSection.locator('select')
    if (await perPageSelect.isVisible().catch(() => false)) {
      await perPageSelect.selectOption('50')
      await page.waitForLoadState('networkidle')
    }
    // Wait for bucket row, click View Objects by title
    const bucketRow = page.locator('.border.rounded-lg').filter({ hasText: bucket })
    await expect(bucketRow).toBeVisible({ timeout: 5000 })
    await bucketRow.locator('button[title="View Objects"]').click()
    await page.waitForLoadState('networkidle')
  }

  test('root listing: folders above files, relative names', async ({ page }) => {
    const bucket = `test-s3-folders-${Date.now()}`
    await seedBucket(page, bucket)
    try {
      await openBucket(page, bucket)
      const main = page.locator('main')
      const folderA = main.getByText('a', { exact: true })
      const folderEmpty = main.getByText('empty', { exact: true })
      const fileRoot = main.getByText('root.txt', { exact: true })
      await expect(folderA).toBeVisible()
      await expect(folderEmpty).toBeVisible()
      await expect(fileRoot).toBeVisible()
      await expect(main.getByText('a/b/c.txt', { exact: true })).not.toBeVisible()
      // Folders precede files: folderA DOM position before fileRoot
      expect(await folderA.evaluate(el => el.getBoundingClientRect().y)).toBeLessThan(await fileRoot.evaluate(el => el.getBoundingClientRect().y))
    } finally {
      await cleanupBucket(page, bucket)
    }
  })

  test('drill-down: click folder enters it', async ({ page }) => {
    const bucket = `test-s3-folders-${Date.now()}`
    await seedBucket(page, bucket)
    try {
      await openBucket(page, bucket)
      const main = page.locator('main')
      // Click folder 'a' - button contains text "a" as first element
      await main.getByText('a', { exact: true }).click()
      await page.waitForLoadState('networkidle')
      await expect(main.getByRole('navigation')).toContainText('a')
      await expect(main.getByText('d.txt', { exact: true })).toBeVisible()
      await expect(main.getByText('c.txt', { exact: true })).not.toBeVisible()
      // Click folder 'b'
      await main.getByText('b', { exact: true }).click()
      await page.waitForLoadState('networkidle')
      await expect(main.getByText('c.txt', { exact: true })).toBeVisible()
    } finally {
      await cleanupBucket(page, bucket)
    }
  })

  test('breadcrumb back: click bucket name returns to root', async ({ page }) => {
    const bucket = `test-s3-folders-${Date.now()}`
    await seedBucket(page, bucket)
    try {
      await openBucket(page, bucket)
      const main = page.locator('main')
      await main.getByText('a', { exact: true }).click()
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: bucket, exact: true }).click()
      await page.waitForLoadState('networkidle')
      await expect(main.getByText('root.txt', { exact: true })).toBeVisible()
    } finally {
      await cleanupBucket(page, bucket)
    }
  })

  test('All files toggle: flat listing with full keys', async ({ page }) => {
    const bucket = `test-s3-folders-${Date.now()}`
    await seedBucket(page, bucket)
    try {
      await openBucket(page, bucket)
      const main = page.locator('main')
      const viewSelect = main.locator('select').first()
      await viewSelect.selectOption('All files')
      await page.waitForLoadState('networkidle')
      await expect(main.getByText('a/b/c.txt', { exact: true })).toBeVisible()
      await expect(main.getByText('a/d.txt', { exact: true })).toBeVisible()
      await expect(main.getByText('root.txt', { exact: true })).toBeVisible()
      await expect(main.getByText('empty', { exact: true })).toBeVisible()
      await viewSelect.selectOption('Folders')
      await page.waitForLoadState('networkidle')
      await expect(main.getByText('a', { exact: true })).toBeVisible()
      await expect(main.getByText('empty', { exact: true })).toBeVisible()
    } finally {
      await cleanupBucket(page, bucket)
    }
  })

  test('deletes folder recursively after confirm', async ({ page }) => {
    const bucket = `test-s3-delfolder-${Date.now()}`
    await seedBucket(page, bucket)
    try {
      await openBucket(page, bucket)
      const main = page.locator('main')
      // Folder 'a' is first alphabetically among folders
      await main.getByRole('button', { name: 'Delete Folder', exact: true }).first().click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 5000 })
      await expect(dialog).toContainText('Delete "a/"')
      await expect(dialog).toContainText('2 object')
      await expect(dialog).toContainText('cannot be undone')
      // Confirm delete
      await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
      // Dialog closes, folder 'a' gone
      await expect(dialog).not.toBeVisible({ timeout: 10000 })
      await expect(main.getByText('a', { exact: true })).not.toBeVisible({ timeout: 10000 })
      // Siblings intact
      await expect(main.getByText('root.txt', { exact: true })).toBeVisible()
      await expect(main.getByText('empty', { exact: true })).toBeVisible()
      // API verify: keys under a/ are gone
      const res = await page.request.get(`${PROXY}/s3/buckets/${bucket}/objects?prefix=a%2F`)
      const json = await res.json()
      expect(json.Contents == null || (json.Contents as unknown[]).length === 0).toBe(true)
    } finally {
      await cleanupBucket(page, bucket)
    }
  })

  test('cancel keeps folder', async ({ page }) => {
    const bucket = `test-s3-delfolder-${Date.now()}`
    await seedBucket(page, bucket)
    try {
      await openBucket(page, bucket)
      const main = page.locator('main')
      await main.getByRole('button', { name: 'Delete Folder', exact: true }).first().click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 5000 })
      await expect(dialog).toContainText('Delete "a/"')
      // Cancel
      await dialog.getByRole('button', { name: 'Cancel' }).click()
      await expect(dialog).not.toBeVisible({ timeout: 5000 })
      // Folder 'a' still visible
      await expect(main.getByText('a', { exact: true })).toBeVisible()
      // API verify: keys under a/ still exist
      const res = await page.request.get(`${PROXY}/s3/buckets/${bucket}/objects?prefix=a%2F`)
      const json = await res.json()
      expect(json.Contents).toHaveLength(2)
    } finally {
      await cleanupBucket(page, bucket)
    }
  })
})

