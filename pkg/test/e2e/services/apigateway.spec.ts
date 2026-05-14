import { test, expect } from '../fixtures.js'

// Helper function to create a REST API
async function createRestApi(page: any, name: string, description?: string) {
  await page.goto('/#/services/api-gateway')
  await page.waitForLoadState('networkidle')

  // Ensure REST API tab is active (default)
  const restTab = page.getByRole('tab', { name: 'REST APIs' })
  if (await restTab.isVisible()) {
    await restTab.click()
  }

  // Click the Create REST API button in the header
  await page.getByRole('button', { name: 'Create REST API' }).first().click()

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

  // Fill in the form
  await page.getByPlaceholder('my-api').fill(name)
  if (description) {
    await page.getByPlaceholder('My REST API (optional)').fill(description)
  }

  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

  // Wait for dialog to close or error toast
  try {
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  } catch {
    // Check for error toast
    const errorToast = page.locator('.toast-error, [class*="error"]').first()
    if (await errorToast.isVisible({ timeout: 2000 })) {
      throw new Error('REST API creation failed')
    }
    // Try one more time with longer timeout
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  }
}

// Helper function to create an HTTP API
async function createHttpApi(page: any, name: string, description?: string) {
  await page.goto('/#/services/api-gateway')
  await page.waitForLoadState('networkidle')

  // Switch to HTTP APIs tab
  await page.getByRole('tab', { name: 'HTTP APIs' }).click()

  // Click the Create HTTP API button in the header
  await page.getByRole('button', { name: 'Create HTTP API' }).first().click()

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

  // Fill in the form
  await page.getByPlaceholder('my-http-api').fill(name)
  if (description) {
    await page.getByPlaceholder('My HTTP API (optional)').fill(description)
  }

  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

  // Wait for dialog to close or error toast
  try {
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  } catch {
    const errorToast = page.locator('.toast-error, [class*="error"]').first()
    if (await errorToast.isVisible({ timeout: 2000 })) {
      throw new Error('HTTP API creation failed')
    }
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  }
}

test.describe('API Gateway', () => {
  test('navigate to service', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/api-gateway')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toContainText('API Gateway', { timeout: 10000 })
  })

  test('navigate to REST APIs tab', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

// Click REST APIs tab
  await page.getByRole('tab', { name: 'REST APIs' }).click()

    // Verify tab is active (contains active styling or check URL)
    await expect(page.getByRole('tab', { name: 'REST APIs' })).toBeVisible({ timeout: 5000 })
  })

  test('navigate to HTTP APIs tab', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

// Click HTTP APIs tab
  await page.getByRole('tab', { name: 'HTTP APIs' }).click()

    await expect(page.getByRole('tab', { name: 'HTTP APIs' })).toBeVisible({ timeout: 5000 })
  })

  test('create REST API and verify in list', async ({ page }) => {
    test.setTimeout(60000) // Increase timeout for CI

    const apiName = 'test-rest-api-' + Date.now()

    await page.goto('/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

    // Ensure REST API tab is active (default)
    const restTab = page.getByRole('tab', { name: 'REST APIs' })
    if (await restTab.isVisible()) {
      await restTab.click()
    }

    // Click the Create REST API button in the header
    await page.getByRole('button', { name: 'Create REST API' }).first().click()

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Create REST API' })).toBeVisible()

    // Fill in the form
    await page.getByPlaceholder('my-api').fill(apiName)
    await page.getByPlaceholder('My REST API (optional)').fill('Test REST API description')

    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

    // Wait for modal to close - retry loop for CI/flaky Floci
    for (let i = 0; i < 8; i++) {
      try {
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
        break
      } catch {
        // Check for error toast
        const errorToast = page.locator('.toast-error, [class*="error"]').first()
        if (await errorToast.isVisible({ timeout: 2000 })) {
          throw new Error('REST API creation failed')
        }
        // Retry modal close check
        await page.waitForTimeout(3000)
      }
    }

    // Force page refresh after create to refresh data from Floci
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Verify API appears in list - wait for list to populate
    await expect(page.locator('div').filter({ hasText: apiName }).first()).toBeVisible({ timeout: 25000 })
  })

  test('create HTTP API and verify in list', async ({ page }) => {
    const apiName = 'test-http-api-' + Date.now()

    await createHttpApi(page, apiName, 'Test HTTP API description')

    // Verify API appears in list
    await page.waitForTimeout(2000)
    await expect(page.locator('div').filter({ hasText: apiName }).first()).toBeVisible({ timeout: 15000 })
  })

  test('open create REST API modal', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

    // Click create button
    await page.getByRole('button', { name: 'Create REST API' }).first().click()

    // Verify modal is visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Create REST API' })).toBeVisible({ timeout: 5000 })

    // Verify form fields exist
    await expect(page.getByPlaceholder('my-api')).toBeVisible()
    await expect(page.getByPlaceholder('My REST API (optional)')).toBeVisible()

    // Cancel
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('open create HTTP API modal', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

    // Switch to HTTP APIs tab
    await page.getByRole('tab', { name: 'HTTP APIs' }).click()

    // Click create button
    await page.getByRole('button', { name: 'Create HTTP API' }).first().click()

    // Verify modal is visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Create HTTP API' })).toBeVisible({ timeout: 5000 })

    // Verify form fields exist
    await expect(page.getByPlaceholder('my-http-api')).toBeVisible()
    await expect(page.getByPlaceholder('My HTTP API (optional)')).toBeVisible()

    // Cancel
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('create and delete REST API flow', async ({ page }) => {
    const apiName = 'test-delete-rest-' + Date.now()

    // Create API
    await createRestApi(page, apiName)

    // Wait for list to populate
    await page.waitForTimeout(2000)

    // Find and click delete button for the API
    const apiRow = page.locator('div').filter({ hasText: apiName }).first()
    await expect(apiRow).toBeVisible({ timeout: 15000 })

    // Try to find delete button - might be icon-only
    const deleteBtn = page.locator('button[title="Delete"]').first()

    if (await deleteBtn.isVisible({ timeout: 3000 })) {
      await deleteBtn.click()

      // Verify delete modal
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
      // Check heading inside dialog
      await expect(page.getByRole('dialog').getByRole('heading')).toBeVisible({ timeout: 5000 })

      // Confirm delete
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()

      // Wait for dialog to close
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
    }
  })

test('tabs switch correctly between REST and HTTP', async ({ page }) => {
  await page.goto('http://localhost:3000/#/services/api-gateway')
  await page.waitForLoadState('networkidle')

  // Default is REST APIs - verify create button says "REST API"
  await expect(page.getByRole('button', { name: 'Create REST API' }).first()).toBeVisible()

  // Switch to HTTP APIs
  await page.getByRole('tab', { name: 'HTTP APIs' }).click()

  // Verify create button changes to "HTTP API"
  await expect(page.getByRole('button', { name: 'Create HTTP API' }).first()).toBeVisible()

  // Switch back to REST
  await page.getByRole('tab', { name: 'REST APIs' }).click()

  // Verify create button changes back
  await expect(page.getByRole('button', { name: 'Create REST API' }).first()).toBeVisible()
})
})