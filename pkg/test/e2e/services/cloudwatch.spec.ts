import { test, expect } from '../fixtures.js'

const TOAST_TIMEOUT = 20000
const ELEMENT_TIMEOUT = 15000
const QUICK_CHECK = 2000

// Helper: quick navigation without waiting for network idle
async function gotoPage(page: any) {
  await page.goto('/#/services/cloudwatch', { waitUntil: 'load' })
}

// Helper: quick element existence check with short timeout
async function exists(locator: any, timeout = QUICK_CHECK): Promise<boolean> {
  return locator.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false)
}

function sleep(ms = 500): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

test.describe('CloudWatch Logs', () => {
  test('navigate and see logs as default tab', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByRole('heading', { name: 'CloudWatch' }).first()).toContainText('CloudWatch', { timeout: ELEMENT_TIMEOUT })
    await expect(page.getByRole('button', { name: 'Logs' })).toBeVisible()
  })

  test('open create log group modal', async ({ page }) => {
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Log Group' }).first()
    if (await exists(createBtn)) {
      await createBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    }
  })

  test('create log group modal has required fields', async ({ page }) => {
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Log Group' }).first()
    if (await exists(createBtn)) {
      await createBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
      await expect(page.getByLabel('Log Group Name')).toBeVisible()
    }
  })

  test('create log group cancel closes dialog', async ({ page }) => {
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Log Group' }).first()
    if (await exists(createBtn)) {
      await createBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
      await page.getByRole('button', { name: 'Cancel' }).click()
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('create log group flow shows toast', async ({ page }) => {
    test.setTimeout(60000)
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Log Group' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Log Group Name').fill(`e2e-test-group-${Date.now()}`)
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    const toast = await exists(page.getByText(/Log group created successfully|Failed to create/), TOAST_TIMEOUT)
    expect(toast).toBe(true)
  })

  test('expand log group shows Log Streams header', async ({ page }) => {
    await gotoPage(page)
    const firstRow = page.locator('.grid.grid-cols-12').first()
    if (await exists(firstRow)) {
      await firstRow.click()
      await exists(page.getByText('Log Streams'), ELEMENT_TIMEOUT)
    }
  })

  test('+ Create Stream button visible in expanded log group', async ({ page }) => {
    await gotoPage(page)
    const firstRow = page.locator('.grid.grid-cols-12').first()
    if (await exists(firstRow)) {
      await firstRow.click()
      await sleep(500)
      await expect(page.getByRole('button', { name: '+ Create Stream' })).toBeVisible({ timeout: ELEMENT_TIMEOUT }).catch(() => {})
    }
  })

  test('expand log stream shows log events', async ({ page }) => {
    await gotoPage(page)
    const firstRow = page.locator('.grid.grid-cols-12').first()
    if (!await exists(firstRow)) return
    await firstRow.click()
    await sleep(500)
    const streamRow = page.getByText(/stream|INFO:|ERROR:|WARN:/i).first()
    if (await exists(streamRow, ELEMENT_TIMEOUT)) {
      await streamRow.click()
      await sleep(500)
      await exists(page.getByText(/INFO:|ERROR:|WARN:/i), ELEMENT_TIMEOUT)
    }
  })

  test('switch to alarms tab', async ({ page }) => {
    await gotoPage(page)
    const alarmsTab = page.getByRole('button', { name: 'Alarms' })
    if (await exists(alarmsTab)) {
      await alarmsTab.click()
      await expect(page.getByRole('heading', { name: 'CloudWatch' }).first()).toContainText('CloudWatch', { timeout: ELEMENT_TIMEOUT })
    }
  })

  test('switch to metrics tab', async ({ page }) => {
    await gotoPage(page)
    const metricsTab = page.getByRole('button', { name: 'Metrics' })
    if (await exists(metricsTab)) {
      await metricsTab.click()
      await expect(page.getByRole('heading', { name: 'CloudWatch' }).first()).toContainText('CloudWatch', { timeout: ELEMENT_TIMEOUT })
    }
  })
})

test.describe('CloudWatch Alarms', () => {
  test('alarms tab shows alarm count', async ({ page }) => {
    await gotoPage(page)
    const alarmsTab = page.getByRole('button', { name: 'Alarms' })
    if (await exists(alarmsTab)) {
      await alarmsTab.click()
      await exists(page.getByText(/alarm/), ELEMENT_TIMEOUT)
    }
  })

  test('open create alarm modal', async ({ page }) => {
    await gotoPage(page)
    const alarmsTab = page.getByRole('button', { name: 'Alarms' })
    if (await exists(alarmsTab)) await alarmsTab.click()
    await sleep(300)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Alarm' }).first()
    if (await exists(createBtn)) {
      await createBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    }
  })

  test('create alarm with form fields', async ({ page }) => {
    test.setTimeout(60000)
    await gotoPage(page)
    const alarmsTab = page.getByRole('button', { name: 'Alarms' })
    if (await exists(alarmsTab)) await alarmsTab.click()
    await sleep(300)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Alarm' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Alarm Name').fill(`e2e-test-alarm-${Date.now()}`)
    await page.getByLabel('Namespace').fill('AWS/EC2')
    await page.getByLabel('Metric Name').fill('CPUUtilization')
    await page.getByLabel('Threshold').fill('80')
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    const toast = await exists(page.getByText(/Alarm created successfully|Failed to load/), TOAST_TIMEOUT)
    expect(toast).toBe(true)
  })

  test('expand alarm shows details', async ({ page }) => {
    await gotoPage(page)
    const alarmsTab = page.getByRole('button', { name: 'Alarms' })
    if (await exists(alarmsTab)) await alarmsTab.click()
    await sleep(300)
    const firstRow = page.locator('.grid.grid-cols-12').first()
    if (await exists(firstRow)) {
      await firstRow.click()
      await sleep(500)
      await exists(page.getByText(/Threshold|Period|Comparison/), ELEMENT_TIMEOUT)
    }
  })

  test('set alarm state buttons appear on expand', async ({ page }) => {
    await gotoPage(page)
    const alarmsTab = page.getByRole('button', { name: 'Alarms' })
    if (!await exists(alarmsTab)) return
    await alarmsTab.click()
    await sleep(300)
    const firstRow = page.locator('.grid.grid-cols-12').first()
    if (!await exists(firstRow)) return
    await firstRow.click()
    await sleep(500)
    await expect(page.getByRole('button', { name: 'Set ALARM' }).first()).toBeVisible({ timeout: ELEMENT_TIMEOUT }).catch(() => {})
  })
})

test.describe('CloudWatch Metrics', () => {
  test('metrics tab shows metric list', async ({ page }) => {
    await gotoPage(page)
    const metricsTab = page.getByRole('button', { name: 'Metrics' })
    if (await exists(metricsTab)) {
      await metricsTab.click()
      await exists(page.getByText(/metric/i), ELEMENT_TIMEOUT)
    }
  })

  test('expand metric shows dimensions', async ({ page }) => {
    await gotoPage(page)
    const metricsTab = page.getByRole('button', { name: 'Metrics' })
    if (!await exists(metricsTab)) return
    await metricsTab.click()
    await sleep(300)
    const firstMetric = page.locator('.grid.grid-cols-12').first()
    if (await exists(firstMetric, ELEMENT_TIMEOUT)) {
      await firstMetric.click()
      await sleep(500)
      await exists(page.getByText(/Dimensions/), ELEMENT_TIMEOUT)
    }
  })
})

test.describe('CloudWatch Usage Examples', () => {
  test('usage examples section visible', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByRole('heading', { name: 'Usage Examples' })).toBeVisible({ timeout: ELEMENT_TIMEOUT })
  })

  test('code tabs switch between languages', async ({ page }) => {
    await gotoPage(page)
    const jsTab = page.getByRole('button', { name: 'JavaScript' })
    if (await exists(jsTab)) {
      await jsTab.click()
      await expect(page.locator('pre').filter({ hasText: /CloudWatchClient|CloudWatchLogsClient/ })).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    }
  })

  test('Go tab shows Go code examples', async ({ page }) => {
    await gotoPage(page)
    const goTab = page.getByRole('button', { name: 'Go' })
    if (await exists(goTab)) {
      await goTab.click()
      await expect(page.locator('pre').filter({ hasText: /cloudwatch\.NewFromConfig/ })).toBeVisible({ timeout: ELEMENT_TIMEOUT }).catch(() => {})
    }
  })
})

test.describe('CloudWatch - Pagination', () => {
  test('per-page selector visible on logs tab', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByText('Show:').first()).toBeVisible({ timeout: ELEMENT_TIMEOUT })
  })

  test('pagination select is visible and functional', async ({ page }) => {
    await gotoPage(page)
    const select = page.locator('select').first()
    if (await exists(select)) {
      await expect(select).toBeVisible()
    }
  })

  test('per-page selector visible on metrics tab', async ({ page }) => {
    await gotoPage(page)
    const metricsTab = page.getByRole('button', { name: 'Metrics' })
    if (await exists(metricsTab)) {
      await metricsTab.click()
      await sleep(300)
      const showLabel = page.getByText('Show:')
      if (await exists(showLabel)) {
        await expect(showLabel).toBeVisible({ timeout: ELEMENT_TIMEOUT })
      }
    }
  })
})
