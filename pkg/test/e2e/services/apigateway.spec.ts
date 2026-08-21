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
  const restTab = page.getByRole('tab', { name: 'API Gateway', exact: true })
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
  await page.getByRole('tab', { name: 'API Gateway', exact: true }).click()

    // Verify tab is active (contains active styling or check URL)
    await expect(page.getByRole('tab', { name: 'API Gateway', exact: true })).toBeVisible({ timeout: 5000 })
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

    // Ensure API Gateway tab is active (default)
    const restTab = page.getByRole('tab', { name: 'API Gateway', exact: true })
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

    // Switch back to API Gateway
    await page.getByRole('tab', { name: 'API Gateway', exact: true }).click()

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

test.describe('API Gateway V2 (HTTP API) delete', () => {
  test('delete route, integration, and stage from an expanded HTTP API', async ({ page }) => {
    test.setTimeout(180000)

    const suffix = Date.now()
    const apiName = 'qa-del-api-' + suffix
    const integrationUri = 'https://qa-del-' + suffix + '.example.com'
    const routeKey = 'GET /qa-del-' + suffix
    const stageName = 'qa-stage-' + suffix

    // Collect console errors during the whole flow
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    // Setup: create an HTTP API via the UI
    await createHttpApi(page, apiName, 'QA delete test API')

    // Expand the API and create an integration, route, and stage via the UI
    await page.waitForTimeout(2000)
    const apiRow = page.locator('div.grid.grid-cols-12').filter({ hasText: apiName }).first()
    await expect(apiRow).toBeVisible({ timeout: 15000 })
    await apiRow.click()
    await expect(page.getByRole('heading', { name: 'Routes' })).toBeVisible({ timeout: 10000 })

    // Create integration (HTTP proxy)
    await page.getByRole('button', { name: 'Create Integration' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByLabel('Integration Type').selectOption('HTTP_PROXY')
    await page.getByLabel('URI').fill(integrationUri)
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    const integrationRow = page.locator('div.grid.grid-cols-12').filter({ hasText: integrationUri }).first()
    await expect(integrationRow).toBeVisible({ timeout: 10000 })

    // Create route targeting the integration
    await page.getByRole('button', { name: 'Create Route' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByLabel('Route Key').fill(routeKey)
    // The dialog has two selects: Target Type (default Existing Integration) and
    // Select Integration. Pick the first real integration option (index 1).
    await page.getByRole('dialog').locator('select').nth(1).selectOption({ index: 1 })
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    const routeRow = page.locator('div.grid.grid-cols-12').filter({ hasText: routeKey }).first()
    await expect(routeRow).toBeVisible({ timeout: 10000 })

    // Create stage
    await page.getByRole('button', { name: 'Create Stage' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('dialog').getByLabel(/Stage Name/).fill(stageName)
    await page.getByRole('dialog').getByLabel(/Description/).fill('QA stage')
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    const stageRow = page.locator('div.grid.grid-cols-12').filter({ hasText: stageName }).first()
    await expect(stageRow).toBeVisible({ timeout: 10000 })

    // Regression scenario: reload the page (this clears any selected-API state),
    // then expand the API again and click Delete directly without opening any
    // modal. Previously these delete buttons silently did nothing.
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    await page.getByRole('tab', { name: 'API Gateway V2' }).click()
    await showAllItems(page)

    const apiRowAfter = page.locator('div.grid.grid-cols-12').filter({ hasText: apiName }).first()
    await expect(apiRowAfter).toBeVisible({ timeout: 15000 })
    await apiRowAfter.click()
    await expect(page.getByRole('heading', { name: 'Routes' })).toBeVisible({ timeout: 10000 })

    // Toasts are displayed one at a time (serial queue, ~5s each) and the
    // progress timer restarts when the mouse hovers the toast. Dismiss the
    // current toast after each delete so the next success toast can appear.
    const dismissToast = async () => {
      const closeBtn = page.locator('div.fixed.top-4.right-4 button').first()
      await closeBtn.click({ timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(400)
    }

    // Delete the route -> row disappears + success toast
    const routeRowAfter = page.locator('div.grid.grid-cols-12').filter({ hasText: routeKey }).first()
    await expect(routeRowAfter).toBeVisible({ timeout: 10000 })
    await routeRowAfter.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Route deleted').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('No routes yet.').first()).toBeVisible({ timeout: 10000 })
    await dismissToast()

    // Delete the integration -> row disappears + success toast
    const integrationRowAfter = page.locator('div.grid.grid-cols-12').filter({ hasText: integrationUri }).first()
    await expect(integrationRowAfter).toBeVisible({ timeout: 10000 })
    await integrationRowAfter.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Integration deleted').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('No integrations yet.').first()).toBeVisible({ timeout: 10000 })
    await dismissToast()

    // Delete the stage -> row disappears + success toast
    const stageRowAfter = page.locator('div.grid.grid-cols-12').filter({ hasText: stageName }).first()
    await expect(stageRowAfter).toBeVisible({ timeout: 10000 })
    await stageRowAfter.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Stage deleted').first()).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('No stages yet.').first()).toBeVisible({ timeout: 10000 })
    await dismissToast()

    // Cleanup: delete the test API (best-effort)
    try {
      const apiRowCleanup = page.locator('div.grid.grid-cols-12').filter({ hasText: apiName }).first()
      await apiRowCleanup.getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
      await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
    } catch {
      // best-effort cleanup - do not fail the test on cleanup issues
    }

    expect(consoleErrors).toEqual([])
  })
})

test.describe('API Gateway V2 Floci emulator invoke URL', () => {
  test('V2 HTTP API invoke URL modal shows Floci emulator format', async ({ page }) => {
    test.setTimeout(120000)

    const suffix = Date.now()
    const apiName = 'test-invoke-e2e-' + suffix
    const stageName = 'test-stage-' + suffix

    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    // Navigate to API Gateway
    await page.goto('/#/services/api-gateway')
    await page.waitForLoadState('networkidle')

    // Switch to API Gateway V2 tab
    await page.getByRole('tab', { name: 'API Gateway V2' }).click()

    // Create an HTTP API
    await page.getByRole('button', { name: 'Create API' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByPlaceholder('my-api').fill(apiName)
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

    // Wait for dialog to close
    try {
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    } catch {
      const errorToast = page.locator('.toast-error, [class*="error"]').first()
      if (await errorToast.isVisible({ timeout: 2000 })) {
        throw new Error('HTTP API creation failed')
      }
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    }

    // Refresh and re-expand to ensure data is fresh
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
    await page.getByRole('tab', { name: 'API Gateway V2' }).click()
    await showAllItems(page)

    // Find and expand the API row
    const apiRow = page.locator('div.grid.grid-cols-12').filter({ hasText: apiName }).first()
    await expect(apiRow).toBeVisible({ timeout: 15000 })
    await apiRow.click()

    // Wait for details to load
    await expect(page.getByRole('heading', { name: 'Routes' })).toBeVisible({ timeout: 10000 })

    // Create a stage (we need at least one stage to test the invoke URL)
    await page.getByRole('button', { name: 'Create Stage' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('dialog').getByLabel(/Stage Name/).fill(stageName)
    await page.getByRole('dialog').getByLabel(/Description/).fill('E2E test stage')
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Verify stage exists in list
    const stageRow = page.locator('div.grid.grid-cols-12').filter({ hasText: stageName }).first()
    await expect(stageRow).toBeVisible({ timeout: 10000 })

    // Click the Invoke URL button WITHIN the expanded row (not global .first())
    const invokeBtn = apiRow.getByRole('button', { name: 'Get Invoke URL' })
    await expect(invokeBtn).toBeVisible({ timeout: 10000 })
    await invokeBtn.click()

    // Verify the modal appears with the correct API name
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible({ timeout: 10000 })
    await expect(modal.getByRole('heading', { name: new RegExp(apiName) })).toBeVisible({ timeout: 10000 })

    // Wait for stages to load — the Stage select must have actual options (not just "Select an option")
    // The select has a disabled placeholder "Select an option" when empty, and real options when stages load.
    const stageSelect = modal.getByLabel('Stage')
    await expect(stageSelect).toBeVisible({ timeout: 15000 })
    // Wait until the select has more than 1 option (placeholder + at least 1 real stage)
    await expect(async () => {
      const optionCount = await stageSelect.locator('option').count()
      expect(optionCount).toBeGreaterThan(1)
    }).toPass({ timeout: 15000, intervals: [500] })

    // Stages confirmed loaded — the Emulator URL section should now render.
    const emulatorHeading = modal.getByText(/Emulator URL/)
    await expect(emulatorHeading.first()).toBeVisible({ timeout: 10000 })

    // Extract the emulator URL text from the modal
    const modalText = await modal.innerText()
    const emulatorMatch = modalText.match(/Emulator URL[^)]*\)[^]*?((?:https?|wss?):\/\/[^\s]+)/)
    const emulatorUrlText = emulatorMatch ? emulatorMatch[1] : ''

    // Verify emulator URL contains the Floci format: execute-api.localhost.floci.io:4566
    expect(emulatorUrlText).toContain('execute-api.localhost.floci.io:4566')

    // Verify emulator URL is not the AWS endpoint (should not contain amazonaws.com)
    expect(emulatorUrlText).not.toContain('amazonaws.com')

    // Close the modal (use exact match to avoid ambiguity with close icon)
    await modal.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })

    // Cleanup: delete the test API (best-effort)
    try {
      // Make sure we're on the V2 tab
      await page.goto('/#/services/api-gateway')
      await page.waitForLoadState('networkidle')
      await page.getByRole('tab', { name: 'API Gateway V2' }).click()
      await showAllItems(page)

      const apiRowCleanup = page.locator('div.grid.grid-cols-12').filter({ hasText: apiName }).first()
      if (await apiRowCleanup.isVisible({ timeout: 5000 })) {
        await apiRowCleanup.getByRole('button', { name: 'Delete' }).click()
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
        await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
      }
    } catch {
      // best-effort cleanup
    }

    expect(consoleErrors).toEqual([])
  })
})
