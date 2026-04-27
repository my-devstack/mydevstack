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
  
  test('create bucket, upload, download and delete', async ({ page }) => {
  const bucketName = `test-e2e-bucket-${Date.now()}`

  await page.goto('/#/services/s3')
  await page.waitForTimeout(2000)

  await page.getByRole('button', { name: '+ Create Bucket' }).click()
  await page.waitForTimeout(1000)
  await expect(page.getByText('Create New Bucket')).toBeVisible({ timeout: 5000 })

  await page.getByPlaceholder('Enter bucket name').fill(bucketName)
  await page.getByRole('button', { name: 'Create' }).click()
  await page.waitForTimeout(3000)

  await expect(page.getByText(bucketName)).toBeVisible({ timeout: 10000 })

  await page.getByText(bucketName).click()
  await page.waitForTimeout(2000)

  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'test-file.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Hello S3 Test Content')
  } as never)
  await page.waitForTimeout(3000)

  await expect(page.getByText('test-file.txt')).toBeVisible({ timeout: 10000 })

  await page.getByRole('button', { name: 'Download' }).first().click()
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Delete' }).first().click()
  await page.waitForTimeout(1000)
  await expect(page.getByText(/Delete "test-file.txt"\?/i)).toBeVisible()
  await page.getByRole('button', { name: 'Delete' }).last().click()
  await page.waitForTimeout(3000)

  await expect(page.getByText('test-file.txt')).not.toBeVisible({ timeout: 10000 })

  await page.getByRole('button', { name: '← Back' }).click()
  await page.waitForTimeout(1000)

  await page.getByRole('button', { name: 'Delete' }).filter({ hasText: bucketName }).click()
  await page.waitForTimeout(1000)
  await expect(page.getByText(/Delete ".*"\?/i)).toBeVisible()
  await page.getByRole('button', { name: 'Delete' }).last().click()
  await page.waitForTimeout(3000)

  await expect(page.getByText(bucketName)).not.toBeVisible({ timeout: 10000 })
  })
})