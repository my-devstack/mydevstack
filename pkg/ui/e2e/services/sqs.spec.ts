import { test, expect } from '../fixtures'
import { cleanupS3Buckets } from '../fixtures'

test.describe('SQS', () => {
  test.beforeEach(async () => {
    // No cleanup - SQS queues persist for test session
  })

  test('navigate to SQS', async ({ page }) => {
    await page.goto('/#/services/sqs')
    await page.waitForTimeout(2000)
    
    await expect(page.getByRole('main').locator('h1')).toContainText('SQS', { timeout: 10000 })
  })
  
  test('load queue list', async ({ page }) => {
    await page.goto('/#/services/sqs')
    await page.waitForTimeout(2000)
    
    await expect(page.getByText('queues').first()).toBeVisible({ timeout: 10000 })
  })
  
  test('open create queue modal', async ({ page }) => {
    await page.goto('/#/services/sqs')
    await page.waitForTimeout(2000)
    
    await page.getByRole('button', { name: '+ Create Queue' }).click()
    await page.waitForTimeout(1000)
    
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  })
})