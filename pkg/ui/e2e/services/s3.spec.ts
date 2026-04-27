import { test, expect } from '../fixtures'
import { cleanupS3Buckets } from '../fixtures'

test.describe('S3', () => {
  test.beforeEach(async () => {
    await cleanupS3Buckets()
  })

  test('navigate to S3', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForTimeout(2000)
    
    await expect(page.getByRole('main').locator('h1')).toContainText('S3', { timeout: 10000 })
  })
  
  test('load bucket list', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForTimeout(2000)
    
    await expect(page.getByText('bucket').first()).toBeVisible({ timeout: 10000 })
  })
  
  test('open create bucket modal', async ({ page }) => {
    await page.goto('/#/services/s3')
    await page.waitForTimeout(2000)
    
    await page.getByRole('button', { name: '+ Create Bucket' }).click()
    await page.waitForTimeout(1000)
    
    await expect(page.getByText('Create New Bucket')).toBeVisible({ timeout: 5000 })
  })
})