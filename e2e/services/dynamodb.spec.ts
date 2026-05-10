import { test, expect } from '../fixtures.js'

// Helper to find table on any page (handles pagination)
async function findTableOnPage(page: any, tableName: string, maxPages = 5): Promise<boolean> {
  for (let i = 0; i < maxPages; i++) {
    const table = page.getByText(tableName, { exact: true })
    if (await table.isVisible({ timeout: 2000 }).catch(() => false)) {
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

async function createTable(page: any, tableName: string, options: {
  pkName?: string,
  pkType?: string,
  hasSortKey?: boolean,
  skName?: string,
  skType?: string,
  onDemand?: boolean,
  readCapacity?: number,
  writeCapacity?: number,
  enableStreams?: boolean
} = {}) {
  await page.goto('/#/services/dynamodb')
  await page.waitForLoadState('networkidle')
  
  await page.getByRole('button', { name: '+ Create Table' }).click()
  await page.waitForTimeout(1500)
  
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
  
  await page.getByPlaceholder('my-table').fill(tableName)
  await page.getByPlaceholder('pk').fill(options.pkName || 'pk')
  
  if (options.hasSortKey) {
    await page.getByText('Sort Key').locator('..').locator('input[type="checkbox"]').check()
    await page.waitForTimeout(500)
    if (options.skName) {
      await page.getByPlaceholder('sk').fill(options.skName)
    }
    if (options.skType) {
      const skSelect = page.locator('select').nth(1)
      await skSelect.selectOption(options.skType)
    }
  }
  
  if (options.onDemand === false) {
    await page.getByText('Provisioned', { exact: true }).click()
    await page.waitForTimeout(500)
    if (options.readCapacity) {
      await page.locator('input[type="number"]').first().fill(String(options.readCapacity))
    }
    if (options.writeCapacity) {
      await page.locator('input[type="number"]').last().fill(String(options.writeCapacity))
    }
  }
  
  if (options.enableStreams) {
    await page.getByRole('heading', { name: 'DynamoDB Streams' }).scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    await page.getByRole('heading', { name: 'DynamoDB Streams' }).click()
    await page.waitForTimeout(500)
    const streamsCheckbox = page.locator('input[type="checkbox"]').last()
    await streamsCheckbox.check({ force: true })
    await page.waitForTimeout(500)
  }

  await page.getByRole('dialog').getByRole('button', { name: 'Create Table', exact: true }).click()
  await page.waitForTimeout(5000)
  
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 20000 })
}

test('navigate to DynamoDB', async ({ page }) => {
  await page.goto('/#/services/dynamodb')
  await page.waitForLoadState('networkidle')
  
  await expect(page.getByRole('heading', { name: 'DynamoDB', exact: true })).toBeVisible()
})

test('partition key type options are String, Number, Binary', async ({ page }) => {
  await page.goto('/#/services/dynamodb')
  await page.waitForLoadState('networkidle')
  
  await page.getByRole('button', { name: '+ Create Table' }).click()
  await page.waitForTimeout(1000)
  
  const dialog = page.getByRole('dialog')
  const pkTypeSelect = dialog.locator('select').first()
  await expect(pkTypeSelect).toBeVisible()
  
  await expect(pkTypeSelect).toHaveValue('S')
  await pkTypeSelect.selectOption('N')
  await expect(pkTypeSelect).toHaveValue('N')
  await pkTypeSelect.selectOption('B')
  await expect(pkTypeSelect).toHaveValue('B')
})

test('sort key type options are String, Number, Binary', async ({ page }) => {
  await page.goto('/#/services/dynamodb')
  await page.waitForLoadState('networkidle')
  
  await page.getByRole('button', { name: '+ Create Table' }).click()
  await page.waitForTimeout(1000)
  
  await page.getByText('Sort Key').locator('..').locator('input[type="checkbox"]').check()
  await page.waitForTimeout(500)
  
  const dialog = page.getByRole('dialog')
  const sortTypeSelect = dialog.locator('select').nth(1)
  await expect(sortTypeSelect).toBeVisible()
  
  await expect(sortTypeSelect).toHaveValue('S')
  await sortTypeSelect.selectOption('N')
  await expect(sortTypeSelect).toHaveValue('N')
  await sortTypeSelect.selectOption('B')
  await expect(sortTypeSelect).toHaveValue('B')
})

test('create button disabled when required fields empty', async ({ page }) => {
  await page.goto('/#/services/dynamodb')
  await page.waitForLoadState('networkidle')
  
  await page.getByRole('button', { name: '+ Create Table' }).click()
  await page.waitForTimeout(1000)
  
  const createBtn = page.getByRole('dialog').getByRole('button', { name: 'Create Table', exact: true })
  await expect(createBtn).toBeDisabled()
  
  await page.getByPlaceholder('my-table').fill('test-table')
  await expect(createBtn).toBeDisabled()
  
  await page.getByPlaceholder('pk').fill('pk')
  await expect(createBtn).toBeEnabled()
})

test('create table on-demand with pk and sk', async ({ page }) => {
  const tableName = 'test-on-demand-' + Date.now()
  
  await createTable(page, tableName, {
    pkName: 'pk',
    hasSortKey: true,
    skName: 'sk',
    onDemand: true
  })
})

test('create table provisioned with capacity', async ({ page }) => {
  const tableName = 'test-provisioned-' + Date.now()
  
  await createTable(page, tableName, {
    pkName: 'pk',
    hasSortKey: true,
    skName: 'sk',
    onDemand: false,
    readCapacity: 5,
    writeCapacity: 5
  })
})

test('create table with stream enabled', async ({ page }) => {
  const tableName = 'test-stream-' + Date.now()
  
  await createTable(page, tableName, {
    pkName: 'pk',
    hasSortKey: true,
    skName: 'sk',
    onDemand: true,
    enableStreams: true
  })

  // Verify stream icon appears in accordion details
  const found = await findTableOnPage(page, tableName)
  expect(found).toBe(true)
  await page.getByText(tableName, { exact: true }).first().click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('Stream').first()).toBeVisible({ timeout: 10000 })
})

test('view stream records', async ({ page }) => {
  const tableName = 'test-stream-' + Date.now()

  await createTable(page, tableName, {
    pkName: 'pk',
    hasSortKey: true,
    skName: 'sk',
    onDemand: true,
    enableStreams: true
  })

  // Click to expand accordion (table may not be auto-expanded)
  const found = await findTableOnPage(page, tableName)
  expect(found).toBe(true)
  await page.getByText(tableName, { exact: true }).first().click()
  await page.waitForLoadState('networkidle')

  // Wait for Stream badge to be visible - it's a purple badge in the accordion
  await expect(page.getByText('Stream').first()).toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(500)

  // Click on Stream badge using a more specific locator (purple background span)
  const streamBadge = page.locator('.inline-flex').filter({ hasText: 'Stream' }).first()
  await streamBadge.click()

  // Click "View Stream Events" button - if exists
  const viewEventsBtn = page.getByRole('button', { name: 'View Stream Events' })
  if (await viewEventsBtn.isVisible().catch(() => false)) {
    await viewEventsBtn.click()
    await page.waitForTimeout(2000)
  }

  // Verify dialog still open
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('open Explore Data modal', async ({ page }) => {
  const tableName = 'test-explore-' + Date.now()
  
  await createTable(page, tableName, {
    pkName: 'id',
    onDemand: true
  })
  
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(1000)
  
  const found = await findTableOnPage(page, tableName)
  expect(found).toBe(true)
  await page.getByText(tableName, { exact: true }).first().click()
  await page.waitForLoadState('networkidle')
  
  // Click Explore Data button
  await page.getByRole('button', { name: 'Explore Data' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
})

test('Explore Data modal has scan and query modes', async ({ page }) => {
  const tableName = 'test-modes-' + Date.now()
  
  await createTable(page, tableName, {
    pkName: 'id',
    hasSortKey: true,
    skName: 'sort',
    onDemand: true
  })
  
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(1000)
  
  const found = await findTableOnPage(page, tableName)
  expect(found).toBe(true)
  await page.getByText(tableName, { exact: true }).first().click()
  await page.waitForLoadState('networkidle')
  
  await page.getByRole('button', { name: 'Explore Data' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  
  // Verify scan mode button exists
  await expect(page.getByRole('button', { name: 'Scan' })).toBeVisible()
  
  // Verify query mode button exists
  await expect(page.getByRole('button', { name: 'Query' })).toBeVisible()
  
// Switch to query mode
  await page.getByRole('button', { name: 'Query' }).click()
  await page.waitForTimeout(1000)

  // Query mode should show partition key input (label is "{pkName} (Partition Key) *")
  await expect(page.getByLabel(/Partition Key/)).toBeVisible({ timeout: 10000 })
})

test('Explore Data displays items after scan', async ({ page }) => {
  const tableName = 'test-items-' + Date.now()
  
  await createTable(page, tableName, {
    pkName: 'id',
    onDemand: true
  })
  
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(1000)
  
  const found = await findTableOnPage(page, tableName)
  expect(found).toBe(true)
  await page.getByText(tableName, { exact: true }).first().click()
  await page.waitForLoadState('networkidle')
  
  await page.getByRole('button', { name: 'Explore Data' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  
  // Run scan
  await page.getByRole('button', { name: 'Scan' }).click()
  await page.waitForTimeout(2000)
  
  // Verify results area exists (empty or with items)
  await expect(page.locator('.max-h-96, [class*="max-h"]').first()).toBeVisible()
})

test('Explore Data modal can be closed', async ({ page }) => {
  const tableName = 'test-close-' + Date.now()
  
  await createTable(page, tableName, {
    pkName: 'id',
    onDemand: true
  })
  
  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForTimeout(1000)
  
  const found = await findTableOnPage(page, tableName)
  expect(found).toBe(true)
  await page.getByText(tableName, { exact: true }).first().click()
  await page.waitForLoadState('networkidle')
  
  await page.getByRole('button', { name: 'Explore Data' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

  // Close with Footer Close button (use last() to avoid header close button)
  await page.getByRole('button', { name: 'Close' }).last().click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
})