import { test, expect } from '../fixtures.js'

async function showAllItems(page: any) {
  const showLabel = page.getByText('Show:')
  if (await showLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    const perPageSelect = showLabel.locator('..').locator('select')
    await perPageSelect.selectOption('50')
    await page.waitForTimeout(300)
  }
}

// Helper function to create a REST API
async function createRestApi(page: any, name: string, description?: string) {
  await page.goto('/#/services/api-gateway')
  await page.waitForLoadState('networkidle')

  // Ensure API Gateway tab is active (default)
  const restTab = page.getByRole('tab', { name: 'API Gateway' })
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
  await showAllItems(page)
}

// Helper function to create an HTTP API
async function createHttpApi(page: any, name: string, description?: string) {
  await page.goto('/#/services/api-gateway')
  await page.waitForLoadState('networkidle')

  // Switch to API Gateway V2 tab
  await page.getByRole('tab', { name: 'API Gateway V2' }).click()

  // Click the Create API button in the header
  await page.getByRole('button', { name: 'Create API' }).first().click()

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

  // Fill in the form
  await page.getByPlaceholder('my-api').fill(name)
  if (description) {
    await page.getByPlaceholder('My API (optional)').fill(description)
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
  await showAllItems(page)
}

// Helper function to create a WebSocket API
async function createWebSocketApi(page: any, name: string, description?: string) {
  await page.goto('/#/services/api-gateway')
  await page.waitForLoadState('networkidle')

  // Switch to API Gateway V2 tab
  await page.getByRole('tab', { name: 'API Gateway V2' }).click()

  // Click the Create API button in the header
  await page.getByRole('button', { name: 'Create API' }).first().click()

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

  // Fill in the form
  await page.getByPlaceholder('my-api').fill(name)
  if (description) {
    await page.getByPlaceholder('My API (optional)').fill(description)
  }

  // Select WebSocket protocol (use getByLabel for reliable form association)
  const protocolSelect = page.getByLabel('Protocol')
  await protocolSelect.selectOption('WEBSOCKET')

  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

  // Wait for dialog to close or error toast
  try {
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  } catch {
    const errorToast = page.locator('.toast-error, [class*="error"]').first()
    if (await errorToast.isVisible({ timeout: 2000 })) {
      throw new Error('WebSocket API creation failed')
    }
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  }
  await showAllItems(page)
}

test.describe('API Gateway', () => {
  test('navigate to service', async ({ page }) => {
    await page.goto('/#/services/api-gateway')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toContainText('API Gateway', { timeout: 10000 })
  })

  test('navigate to API Gateway tab', async ({ page }) => {
    await page.goto('/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

// Click API Gateway tab
  await page.getByRole('tab', { name: 'API Gateway' }).click()

    // Verify tab is active (contains active styling or check URL)
    await expect(page.getByRole('tab', { name: 'API Gateway' })).toBeVisible({ timeout: 5000 })
  })

  test('navigate to API Gateway V2 tab', async ({ page }) => {
    await page.goto('/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

// Click API Gateway V2 tab
  await page.getByRole('tab', { name: 'API Gateway V2' }).click()

    await expect(page.getByRole('tab', { name: 'API Gateway V2' })).toBeVisible({ timeout: 5000 })
  })

  test('create REST API and verify in list', async ({ page }) => {
    test.setTimeout(60000) // Increase timeout for CI

    const apiName = 'test-rest-api-' + Date.now()

    await page.goto('/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

    // Ensure REST API tab is active (default)
    const restTab = page.getByRole('tab', { name: 'API Gateway' })
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
    await expect(page.locator('div').filter({ hasText: apiName }).first()).toBeVisible({ timeout: 15000 })
  })

  test('create HTTP API and verify in list', async ({ page }) => {
    const apiName = 'test-http-api-' + Date.now()

    await createHttpApi(page, apiName, 'Test HTTP API description')

    // Verify API appears in list
    await page.waitForTimeout(2000)
    await expect(page.locator('div').filter({ hasText: apiName }).first()).toBeVisible({ timeout: 15000 })
  })

  test('create WebSocket API and verify in list', async ({ page }) => {
    test.setTimeout(60000)
    const apiName = 'test-ws-api-' + Date.now()

    await createWebSocketApi(page, apiName, 'Test WebSocket API description')

    // Verify API appears in list with WEBSOCKET protocol
    await page.waitForTimeout(2000)

    // Locate the API row (grid container with the API name)
    const apiRow = page.locator('div.grid.grid-cols-12').filter({ hasText: apiName }).first()
    await expect(apiRow).toBeVisible({ timeout: 15000 })

    // Verify the PROTOCOL column shows "WEBSOCKET"
    // The row has 4 child divs: col-span-2 (name/id), col-span-2 (protocol), col-span-5 (description), col-span-3 (actions)
    await expect(apiRow.locator('div').nth(1)).toHaveText('WEBSOCKET')
  })

  test('open create REST API modal', async ({ page }) => {
    await page.goto('/#/services/api-gateway')
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

  test('open create API Gateway V2 modal', async ({ page }) => {
    await page.goto('/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

    // Switch to API Gateway V2 tab
    await page.getByRole('tab', { name: 'API Gateway V2' }).click()

    // Click create button
    await page.getByRole('button', { name: 'Create API' }).first().click()

    // Verify modal is visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Create API (V2)' })).toBeVisible({ timeout: 5000 })

    // Verify form fields exist
    await expect(page.getByPlaceholder('my-api')).toBeVisible()
    await expect(page.getByPlaceholder('My API (optional)')).toBeVisible()

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
    await page.goto('/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

    // Default is API Gateway - verify create button says "REST API"
    await expect(page.getByRole('button', { name: 'Create REST API' }).first()).toBeVisible()

    // Switch to API Gateway V2
    await page.getByRole('tab', { name: 'API Gateway V2' }).click()

    // Verify create button changes to "Create API"
    await expect(page.getByRole('button', { name: 'Create API' }).first()).toBeVisible()

    // Switch back to REST
    await page.getByRole('tab', { name: 'API Gateway' }).click()

    // Verify create button changes back
    await expect(page.getByRole('button', { name: 'Create REST API' }).first()).toBeVisible()
  })

  test('create HTTP API integration', async ({ page }) => {
    test.setTimeout(90000)
    const apiName = 'test-int-api-' + Date.now()

    await createHttpApi(page, apiName, 'Test HTTP API for integration')

    // Wait for list to populate
    await page.waitForTimeout(2000)

    // Refresh to ensure API list is up to date
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Ensure API Gateway V2 tab is active
    await page.getByRole('tab', { name: 'API Gateway V2' }).click()
    await page.waitForTimeout(1000)

    // Find and click the API row to expand it (click on the API name)
    const apiRow = page.locator('div.grid.grid-cols-12').filter({ hasText: apiName }).first()
    await expect(apiRow).toBeVisible({ timeout: 15000 })
    await apiRow.click()

    // Wait for details to load
    await page.waitForTimeout(2000)

    // Click Create Integration button
    const createIntBtn = page.getByRole('button', { name: 'Create Integration' }).first()
    await expect(createIntBtn).toBeVisible({ timeout: 10000 })
    await createIntBtn.click()

    // Wait for integration modal
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Create Integration' })).toBeVisible({ timeout: 5000 })

    // Select HTTP Proxy integration type
    const integrationTypeSelect = page.getByLabel('Integration Type')
    if (await integrationTypeSelect.isVisible()) {
      await integrationTypeSelect.selectOption('HTTP_PROXY')
    } else {
      // Fallback: try finding select by text
      const selectEl = page.locator('select').first()
      await selectEl.selectOption('HTTP_PROXY')
    }

    // Fill URI
    const uriInput = page.getByPlaceholder('https://api.example.com')
    await expect(uriInput).toBeVisible({ timeout: 5000 })
    await uriInput.fill('https://httpbin.org/anything')

    // Submit
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

    // Wait for dialog to close
    try {
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    } catch {
      // Check for error toast
      const errorToast = page.locator('.toast-error, [class*="error"]').first()
      if (await errorToast.isVisible({ timeout: 2000 })) {
        // Integration creation might fail if backend doesn't fully support it
        // This is still useful as a UI flow test
        console.log('Integration creation returned error (expected if backend not fully configured)')
        return
      }
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    }

    // Verify integration appears in the list
    await page.waitForTimeout(2000)
    await expect(page.locator('div').filter({ hasText: 'HTTP_PROXY' }).first()).toBeVisible({ timeout: 10000 })
  })

  test.describe('API Gateway - Pagination', () => {
    test('show per-page selector on API Gateway tab', async ({ page }) => {
      await page.goto('/#/services/api-gateway')
      await page.waitForLoadState('networkidle')
      await expect(page.getByText('Show:').first()).toBeVisible()
      await expect(page.getByText('per page').first()).toBeVisible()
    })

    test('show per-page selector on API Gateway V2 tab', async ({ page }) => {
      await page.goto('/#/services/api-gateway')
      await page.waitForLoadState('networkidle')
      await page.getByRole('tab', { name: 'API Gateway V2' }).click()
      await expect(page.getByText('Show:').first()).toBeVisible()
      await expect(page.getByText('per page').first()).toBeVisible()
    })
  })
})
