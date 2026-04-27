import { test, expect } from '@playwright/test'

async function createBucket(page: any, bucketName: string) {
  await page.goto('/#/services/s3')
  await page.waitForTimeout(2000)
  
  await page.getByRole('button', { name: '+ Create Bucket' }).click()
  await page.waitForTimeout(1500)
  
  await expect(page.getByText('Create New Bucket')).toBeVisible({ timeout: 10000 })
  await page.getByPlaceholder('Enter bucket name').fill(bucketName)
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await page.waitForTimeout(5000)
  
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
}

test.describe('S3', () => {
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
  
  test('create bucket', async ({ page }) => {
    const bucketName = `test-e2e-bucket-${Date.now()}`

    await createBucket(page, bucketName)
    await page.waitForTimeout(3000)
  })
})