import { test, expect } from '../fixtures.js'

test.describe('S3', () => {
  test('navigate to S3 service page', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'S3 Buckets' })).toBeVisible({ timeout: 15000 })
  })

  test('show bucket count', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/bucket/)).toBeVisible()
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
    await expect(page.getByText(`Bucket "${bucketName}" created`)).toBeVisible({ timeout: 10000 })
    
    // Verify bucket appears in list table (use exact match in table)
    await expect(page.locator('table').getByText(bucketName, { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('create bucket with CORS enabled', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    
    const bucketName = `test-e2e-cors-${Date.now()}`
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill(bucketName)
    await page.getByLabel('Enable CORS').check()
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    
    await expect(page.getByText(`Bucket "${bucketName}" created`)).toBeVisible({ timeout: 10000 })
    await expect(page.locator('table').getByText(bucketName, { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('create bucket with advanced options visible', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill('test-advanced')
    
    // Expand advanced options
    const advancedOptions = page.locator('legend').getByText('Advanced Options')
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
    const advancedOptions = page.locator('legend').getByText('Advanced Options')
    await advancedOptions.click()
    await page.waitForTimeout(500)
    await page.getByLabel('Enable Versioning').check()
    
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    
    await expect(page.getByText(`Bucket "${bucketName}" created`)).toBeVisible({ timeout: 10000 })
    await expect(page.locator('table').getByText(bucketName, { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('create bucket with tags', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    
    const bucketName = `test-e2e-tags-${Date.now()}`
    
    await page.getByRole('button', { name: '+ Create Bucket' }).first().click()
    await page.getByPlaceholder('Enter bucket name').fill(bucketName)
    
    // Expand and add tags
    const advancedOptions = page.locator('legend').getByText('Advanced Options')
    await advancedOptions.click()
    await page.waitForTimeout(500)
    
    const keyInputs = page.getByPlaceholder('Key')
    await keyInputs.first().fill('environment')
    const valueInputs = page.getByPlaceholder('Value')
    await valueInputs.first().fill('test')
    
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    
    await expect(page.getByText(`Bucket "${bucketName}" created`)).toBeVisible({ timeout: 10000 })
    await expect(page.locator('table').getByText(bucketName, { exact: true })).toBeVisible({ timeout: 5000 })
  })

  test('select bucket to view objects', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Click on first bucket row in table
    const bucketRow = page.locator('table tbody tr').first()
    if (await bucketRow.isVisible({ timeout: 5000 })) {
      await bucketRow.click()
      await page.waitForTimeout(1500)
      
      // Should show objects list with back button
      await expect(page.getByRole('button', { name: '← Back' })).toBeVisible({ timeout: 5000 })
    }
  })

  test('objects list shows upload button', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Navigate to bucket
    const bucketRow = page.locator('table tbody tr').first()
    if (await bucketRow.isVisible({ timeout: 5000 })) {
      await bucketRow.click()
      await page.waitForTimeout(2000)
      
      // Check for upload button
      await expect(page.getByText('Upload File')).toBeVisible({ timeout: 5000 })
    }
  })
})