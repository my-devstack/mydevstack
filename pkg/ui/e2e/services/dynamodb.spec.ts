import { test, expect } from '@playwright/test'

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
  await page.waitForTimeout(2000)
  
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
  
  // Check for error alerts
  const errorAlert = page.locator('[class*="error"], [class*="red"], [role="alert"], .text-red')
  const hasError = await errorAlert.first().isVisible().catch(() => false)
  if (hasError) {
    const errText = await errorAlert.first().textContent().catch(() => '')
    throw new Error('Table creation failed: ' + errText)
  }
  
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 20000 })
}

test('navigate to DynamoDB', async ({ page }) => {
  await page.goto('/#/services/dynamodb')
  await page.waitForTimeout(2000)
  
  await expect(page.getByRole('heading', { name: 'DynamoDB', exact: true })).toBeVisible()
})

test('partition key type options are String, Number, Binary', async ({ page }) => {
  await page.goto('/#/services/dynamodb')
  await page.waitForTimeout(2000)
  
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
  await page.waitForTimeout(2000)
  
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
  await page.waitForTimeout(2000)
  
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
})