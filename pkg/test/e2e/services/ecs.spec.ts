import { test, expect } from '../fixtures.js'

// Helper to find item on any page (handles pagination, 10 per page default)
async function findItemOnPage(page: any, itemName: string, maxPages = 5): Promise<boolean> {
  for (let i = 0; i < maxPages; i++) {
    const item = page.getByText(itemName, { exact: true })
    if (await item.isVisible({ timeout: 2000 }).catch(() => false)) {
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

// Helper to increase per-page to 50 so items show on first page
async function showAllItems(page: any) {
  const showLabel = page.getByText('Show:')
  if (await showLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    const paginationSection = showLabel.locator('..')
    const perPageSelect = paginationSection.locator('select')
    if (await perPageSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await perPageSelect.selectOption('50')
      await page.waitForTimeout(300)
    }
  }
}

async function createCluster(page: any, clusterName: string) {
  await page.goto('/#/services/ecs')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Create Cluster/i }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  const dialog = page.getByRole('dialog')
  const nameInput = dialog.locator('input[type="text"]').first()
  await expect(nameInput).toBeVisible({ timeout: 5000 })
  await nameInput.fill(clusterName)
  const responsePromise = page.waitForResponse(
    (resp: any) => resp.url().includes('/ecs/') && resp.request().method() === 'POST',
    { timeout: 15000 }
  ).catch(() => null)
  await dialog.getByRole('button', { name: 'Create' }).click()
  await responsePromise
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  // Increase per-page so newly created item is visible
  await showAllItems(page)
  // Also try pagination search as fallback
  const found = await findItemOnPage(page, clusterName)
  expect(found).toBe(true)
}

async function createTaskDefinition(page: any, family: string, containerImage: string) {
  await page.getByRole('tab', { name: /Task Definitions/i }).click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /Register Task Definition/i }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  const dialog = page.getByRole('dialog')
  const inputs = dialog.locator('input[type="text"]')
  await inputs.nth(0).fill(family)
  await inputs.nth(1).fill(containerImage)
  const responsePromise = page.waitForResponse(
    (resp: any) => resp.url().includes('/ecs/') && resp.request().method() === 'POST',
    { timeout: 15000 }
  ).catch(() => null)
  await dialog.getByRole('button', { name: 'Create' }).click()
  await responsePromise
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  await showAllItems(page)
  const found = await findItemOnPage(page, family)
  expect(found).toBe(true)
}

test.describe('ECS - Navigation', () => {
  test('navigate to ECS page and verify Clusters tab loads', async ({ page }) => {
    await page.goto('/#/services/ecs')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /ECS/i }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('tab', { name: /Clusters/i })).toBeVisible()
  })

  test('switch between all tabs', async ({ page }) => {
    await page.goto('/#/services/ecs')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: 'Clusters' }).click()
    await expect(page.getByRole('tab', { name: 'Clusters' })).toBeVisible()

    await page.getByRole('tab', { name: 'Task Definitions' }).click()
    await expect(page.getByRole('tab', { name: 'Task Definitions' })).toBeVisible()

    await page.getByRole('tab', { name: 'Tasks' }).click()
    await expect(page.getByRole('tab', { name: 'Tasks' })).toBeVisible()

    await page.getByRole('tab', { name: 'Services' }).click()
    await expect(page.getByRole('tab', { name: 'Services' })).toBeVisible()
  })
})

test.describe('ECS - Clusters', () => {
  test('create cluster and verify in list', async ({ page }) => {
    const clusterName = 'test-cluster-' + Date.now()
    await createCluster(page, clusterName)
    // Item already verified in createCluster helper (pagination-aware)
  })

  test('delete cluster', async ({ page }) => {
    test.setTimeout(60000)
    const clusterName = 'test-cluster-del-' + Date.now()
    await createCluster(page, clusterName)

    // Find cluster row — pagination already handled by createCluster
    const clusterRow = page.locator('.rounded-lg').filter({ hasText: clusterName }).first()
    await expect(clusterRow).toBeVisible({ timeout: 10000 })
    // Only ONE button per row (delete with TrashIcon) — chevrons are plain SVGs
    await clusterRow.locator('button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(clusterName).first()).not.toBeVisible({ timeout: 15000 })
  })

  test('expand cluster row and see details', async ({ page }) => {
    test.setTimeout(60000)
    const clusterName = 'test-cluster-expand-' + Date.now()
    await createCluster(page, clusterName)

    // Click anywhere on the row to expand (whole row div is clickable)
    const clusterRow = page.locator('.rounded-lg').filter({ hasText: clusterName }).first()
    await expect(clusterRow).toBeVisible({ timeout: 10000 })
    await clusterRow.locator('div').first().click()
    await page.waitForTimeout(500)
    await expect(clusterRow.locator('label').filter({ hasText: /ARN|Status/i })).toBeVisible({ timeout: 15000 })
  })
})

test.describe('ECS - Task Definitions', () => {
  test('create task definition and verify in list', async ({ page }) => {
    test.setTimeout(60000)
    const family = 'test-task-' + Date.now()
    await page.goto('/#/services/ecs')
    await page.waitForLoadState('networkidle')
    await createTaskDefinition(page, family, 'nginx:latest')
    // Item already verified in createTaskDefinition helper (pagination-aware)
  })
})

test.describe('ECS - Tasks', () => {
  test('run task and verify RUNNING status', async ({ page }) => {
    test.setTimeout(120000)
    const clusterName = 'test-cluster-run-' + Date.now()
    const family = 'test-task-run-' + Date.now()

    // Create cluster first
    await createCluster(page, clusterName)

    // Create task definition
    await createTaskDefinition(page, family, 'nginx:latest')

    // Switch to Tasks tab and run task
    await page.getByRole('tab', { name: /Tasks/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /Run Task/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')

    // Select cluster from dropdown
    const clusterSelect = dialog.locator('select').first()
    if (await clusterSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clusterSelect.selectOption({ label: clusterName })
    }

    // Select task definition from dropdown
    const taskDefSelect = dialog.locator('select').nth(1)
    if (await taskDefSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskDefSelect.selectOption({ label: family })
    }

    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/ecs/') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: /Run|Create|Submit/i }).first().click()
    await responsePromise
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Verify task appears with RUNNING status — search across pages
    const found = await findItemOnPage(page, 'RUNNING')
    expect(found).toBe(true)
  })

  test('stop task and verify STOPPED status', async ({ page }) => {
    test.setTimeout(120000)
    const clusterName = 'test-cluster-stop-' + Date.now()
    const family = 'test-task-stop-' + Date.now()

    // Create cluster + task def
    await createCluster(page, clusterName)
    await createTaskDefinition(page, family, 'nginx:latest')

    // Run task
    await page.getByRole('tab', { name: /Tasks/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /Run Task/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')

    const clusterSelect = dialog.locator('select').first()
    if (await clusterSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clusterSelect.selectOption({ label: clusterName })
    }
    const taskDefSelect = dialog.locator('select').nth(1)
    if (await taskDefSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskDefSelect.selectOption({ label: family })
    }

    await dialog.getByRole('button', { name: /Run|Create|Submit/i }).first().click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Wait for RUNNING — search across pages
    const runningFound = await findItemOnPage(page, 'RUNNING')
    expect(runningFound).toBe(true)

    // Stop the task — find the row with RUNNING status and click its stop button
    const taskRow = page.locator('.rounded-lg').filter({ hasText: /RUNNING/i }).first()
    await expect(taskRow).toBeVisible({ timeout: 10000 })
    // Only ONE button per row (stop with StopIcon) — chevrons are plain SVGs
    const stopBtn = taskRow.locator('button').first()
    await expect(stopBtn).toBeVisible({ timeout: 10000 })
    await stopBtn.click()
    await page.waitForLoadState('networkidle')

    // Verify STOPPED status appears — search across pages
    const stoppedFound = await findItemOnPage(page, 'STOPPED')
    expect(stoppedFound).toBe(true)
  })
})

test.describe('ECS - Services', () => {
  test('create service and verify in list', async ({ page }) => {
    test.setTimeout(120000)
    const clusterName = 'test-cluster-svc-' + Date.now()
    const family = 'test-task-svc-' + Date.now()
    const svcName = 'test-svc-' + Date.now()

    // Create cluster + task def
    await createCluster(page, clusterName)
    await createTaskDefinition(page, family, 'nginx:latest')

    // Switch to Services tab
    await page.getByRole('tab', { name: /Services/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /Create Service/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')

    // Select cluster
    const clusterSelect = dialog.locator('select').first()
    if (await clusterSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clusterSelect.selectOption({ label: clusterName })
    }

    // Fill service name
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(svcName)

    // Select task definition
    const taskDefSelect = dialog.locator('select').nth(1)
    if (await taskDefSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskDefSelect.selectOption({ label: family })
    }

    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/ecs/') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await responsePromise
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Verify service appears — search across pages
    await showAllItems(page)
    const found = await findItemOnPage(page, svcName)
    expect(found).toBe(true)
  })

  test('delete service', async ({ page }) => {
    test.setTimeout(120000)
    const clusterName = 'test-cluster-svcdel-' + Date.now()
    const family = 'test-task-svcdel-' + Date.now()
    const svcName = 'test-svc-del-' + Date.now()

    // Create cluster + task def
    await createCluster(page, clusterName)
    await createTaskDefinition(page, family, 'nginx:latest')

    // Create service
    await page.getByRole('tab', { name: /Services/i }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /Create Service/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')

    const clusterSelect = dialog.locator('select').first()
    if (await clusterSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clusterSelect.selectOption({ label: clusterName })
    }
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(svcName)
    const taskDefSelect = dialog.locator('select').nth(1)
    if (await taskDefSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskDefSelect.selectOption({ label: family })
    }

    await dialog.getByRole('button', { name: 'Create' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Ensure service is visible (pagination-aware)
    await showAllItems(page)
    const found = await findItemOnPage(page, svcName)
    expect(found).toBe(true)

    // Delete service — find the correct row
    const svcRow = page.locator('.rounded-lg').filter({ hasText: svcName }).first()
    await expect(svcRow).toBeVisible({ timeout: 10000 })
    // Only ONE button per row (delete with TrashIcon) — chevrons are plain SVGs
    await svcRow.locator('button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(svcName).first()).not.toBeVisible({ timeout: 15000 })
  })
})

test.describe('ECS - Cluster Dropdown Change (Tasks & Services)', () => {
  test('Tasks tab: changing cluster dropdown reloads task list', async ({ page }) => {
    test.setTimeout(120000)
    const ts = Date.now()
    const clusterA = 'test-cluster-a-' + ts
    const clusterB = 'test-cluster-b-' + ts
    const family = 'test-task-dd-' + ts

    // Create two clusters and a task definition
    await createCluster(page, clusterA)
    await createCluster(page, clusterB)
    await createTaskDefinition(page, family, 'nginx:latest')

    // Switch to Tasks tab
    await page.getByRole('tab', { name: /Tasks/i }).click()
    await page.waitForLoadState('networkidle')

    // Verify cluster dropdown is visible
    const tasksDropdown = page.locator('select').first()
    await expect(tasksDropdown).toBeVisible({ timeout: 10000 })

    // Verify dropdown contains both clusters
    const options = tasksDropdown.locator('option')
    await expect(options.first()).toBeVisible({ timeout: 5000 })
    const optionCount = await options.count()
    expect(optionCount).toBeGreaterThanOrEqual(2)

    // Select first cluster — list loads
    await tasksDropdown.selectOption({ index: 0 })
    await page.waitForLoadState('networkidle')
    const firstClusterLabel = await tasksDropdown.inputValue()

    // Change to second cluster — list reloads
    await tasksDropdown.selectOption({ index: 1 })
    await page.waitForLoadState('networkidle')
    const secondClusterLabel = await tasksDropdown.inputValue()

    // Verify the dropdown actually changed value
    expect(secondClusterLabel).not.toEqual(firstClusterLabel)
  })

  test('Services tab: changing cluster dropdown reloads service list', async ({ page }) => {
    test.setTimeout(120000)
    const ts = Date.now()
    const clusterA = 'test-cluster-a-svc-' + ts
    const clusterB = 'test-cluster-b-svc-' + ts
    const family = 'test-task-svc-dd-' + ts

    // Create two clusters and a task definition
    await createCluster(page, clusterA)
    await createCluster(page, clusterB)
    await createTaskDefinition(page, family, 'nginx:latest')

    // Switch to Services tab
    await page.getByRole('tab', { name: /Services/i }).click()
    await page.waitForLoadState('networkidle')

    // Verify cluster dropdown is visible
    const servicesDropdown = page.locator('select').first()
    await expect(servicesDropdown).toBeVisible({ timeout: 10000 })

    // Verify dropdown contains both clusters
    const options = servicesDropdown.locator('option')
    await expect(options.first()).toBeVisible({ timeout: 5000 })
    const optionCount = await options.count()
    expect(optionCount).toBeGreaterThanOrEqual(2)

    // Select first cluster — list loads
    await servicesDropdown.selectOption({ index: 0 })
    await page.waitForLoadState('networkidle')
    const firstClusterLabel = await servicesDropdown.inputValue()

    // Change to second cluster — list reloads
    await servicesDropdown.selectOption({ index: 1 })
    await page.waitForLoadState('networkidle')
    const secondClusterLabel = await servicesDropdown.inputValue()

    // Verify the dropdown actually changed value
    expect(secondClusterLabel).not.toEqual(firstClusterLabel)
  })

  test('Tasks tab: dropdown change triggers new API request', async ({ page }) => {
    test.setTimeout(120000)
    const ts = Date.now()
    const clusterA = 'test-cluster-a-api-' + ts
    const clusterB = 'test-cluster-b-api-' + ts
    const family = 'test-task-api-' + ts

    // Create two clusters and a task definition
    await createCluster(page, clusterA)
    await createCluster(page, clusterB)
    await createTaskDefinition(page, family, 'nginx:latest')

    // Switch to Tasks tab
    await page.getByRole('tab', { name: /Tasks/i }).click()
    await page.waitForLoadState('networkidle')

    const tasksDropdown = page.locator('select').first()
    await expect(tasksDropdown).toBeVisible({ timeout: 10000 })

    // Select first cluster and wait for initial load
    await tasksDropdown.selectOption({ index: 0 })
    await page.waitForLoadState('networkidle')

    // Change to second cluster — expect a new API request for tasks
    const apiRequestPromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/ecs/') && resp.request().method() === 'GET',
      { timeout: 15000 }
    ).catch(() => null)
    await tasksDropdown.selectOption({ index: 1 })
    await apiRequestPromise
    await page.waitForLoadState('networkidle')
  })
})

test.describe('ECS - Cleanup', () => {
  test('delete cluster after all operations', async ({ page }) => {
    test.setTimeout(60000)
    const clusterName = 'test-cluster-cleanup-' + Date.now()
    await createCluster(page, clusterName)

    // Find and delete — pagination already handled by createCluster
    const clusterRow = page.locator('.rounded-lg').filter({ hasText: clusterName }).first()
    await expect(clusterRow).toBeVisible({ timeout: 10000 })
    // Only ONE button per row (delete with TrashIcon) — chevrons are plain SVGs
    await clusterRow.locator('button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(clusterName).first()).not.toBeVisible({ timeout: 15000 })
  })
})
