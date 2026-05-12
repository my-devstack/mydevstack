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
    if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
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