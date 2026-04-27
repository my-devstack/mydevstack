import { test, expect } from '@playwright/test'

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
  
  const createBtn = page.getByRole('button', { name: 'Create Table', exact: true })
  await expect(createBtn).toBeDisabled()
  
  await page.getByPlaceholder('my-table').fill('test-table')
  await expect(createBtn).toBeDisabled()
  
  const pkInput = page.getByPlaceholder('pk')
  await pkInput.fill('pk')
  await expect(createBtn).toBeEnabled()
})

test('create table on-demand with pk and sk', async ({ page }) => {
  const tableName = 'test-on-demand-' + Date.now()
  
  await page.goto('/#/services/dynamodb')
  await page.waitForTimeout(2000)
  
  await page.getByRole('button', { name: '+ Create Table' }).click()
  await page.waitForTimeout(1000)
  
  await page.getByPlaceholder('my-table').fill(tableName)
  await page.getByPlaceholder('pk').fill('pk')
  await page.getByText('Sort Key').locator('..').locator('input[type="checkbox"]').check()
  await page.waitForTimeout(500)
  await page.getByPlaceholder('sk').fill('sk')
  await page.getByText('On-Demand', { exact: true }).click()
  
  await page.getByRole('button', { name: 'Create Table', exact: true }).click()
  await page.waitForTimeout(5000)
  
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
})

test('create table provisioned with capacity', async ({ page }) => {
  const tableName = 'test-provisioned-' + Date.now()
  
  await page.goto('/#/services/dynamodb')
  await page.waitForTimeout(2000)
  
  await page.getByRole('button', { name: '+ Create Table' }).click()
  await page.waitForTimeout(1000)
  
  await page.getByPlaceholder('my-table').fill(tableName)
  await page.getByPlaceholder('pk').fill('pk')
  await page.getByText('Sort Key').locator('..').locator('input[type="checkbox"]').check()
  await page.waitForTimeout(500)
  await page.getByPlaceholder('sk').fill('sk')
  await page.getByText('Provisioned', { exact: true }).click()
  await page.waitForTimeout(500)
  await page.locator('input[type="number"]').first().fill('5')
  await page.locator('input[type="number"]').last().fill('5')
  
  await page.getByRole('button', { name: 'Create Table', exact: true }).click()
  await page.waitForTimeout(5000)
  
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
})

test('create table with stream enabled', async ({ page }) => {
  const tableName = 'test-stream-' + Date.now()
  
  await page.goto('/#/services/dynamodb')
  await page.waitForTimeout(2000)
  
  await page.getByRole('button', { name: '+ Create Table' }).click()
  await page.waitForTimeout(1000)
  
  await page.getByPlaceholder('my-table').fill(tableName)
  await page.getByPlaceholder('pk').fill('pk')
  await page.getByText('Sort Key').locator('..').locator('input[type="checkbox"]').check()
  await page.waitForTimeout(500)
  await page.getByPlaceholder('sk').fill('sk')
  await page.getByRole('dialog').locator('label').filter({ hasText: 'On-Demand' }).click()
  await page.getByText('DynamoDB Streams').locator('..').locator('input').check()
  await page.waitForTimeout(500)
  
  await page.getByRole('button', { name: 'Create Table', exact: true }).click()
  await page.waitForTimeout(8000)
  
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
})