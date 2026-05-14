import { test, expect } from '../fixtures.js'

test('S3 loads', async ({ page }) => {
  await page.goto('/#/services/s3')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('main').locator('h1')).toContainText('S3', { timeout: 5000 })
})

test('Lambda loads', async ({ page }) => {
  await page.goto('/#/services/lambda')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('main').locator('h1')).toContainText('Lambda', { timeout: 5000 })
})

test('DynamoDB loads', async ({ page }) => {
  await page.goto('/#/services/dynamodb')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('main').locator('h1')).toContainText('DynamoDB', { timeout: 5000 })
})

test('SQS loads', async ({ page }) => {
  await page.goto('/#/services/sqs')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('main').locator('h1')).toContainText('SQS', { timeout: 5000 })
})