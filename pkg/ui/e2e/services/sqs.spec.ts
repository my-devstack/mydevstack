import { test, expect } from '@playwright/test'

test('create FIFO queue and verify in list and attributes', async ({ page }) => {
  const queueName = 'test-fifo-' + Date.now()
  
  await page.goto('/#/services/sqs')
  await page.waitForTimeout(1500)
  
  await page.getByRole('button', { name: '+ Create Queue' }).click()
  await page.waitForTimeout(500)
  
  await page.getByPlaceholder('my-queue').fill(queueName)
  await page.getByLabel('FIFO Queue').check()
  
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await page.waitForTimeout(2000)
  
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  
  await expect(page.getByText(queueName + '.fifo')).toBeVisible({ timeout: 5000 })
  
  await page.getByText(queueName + '.fifo').click()
  await page.waitForTimeout(1500)
  
  const fifoValue = page.locator('td:text("FifoQueue") ~ td').first()
  await expect(fifoValue).toContainText('true')
})

test('create standard queue and verify in list', async ({ page }) => {
  const queueName = 'test-std-' + Date.now()
  
  await page.goto('/#/services/sqs')
  await page.waitForTimeout(1500)
  
  await page.getByRole('button', { name: '+ Create Queue' }).click()
  await page.waitForTimeout(500)
  
  await page.getByPlaceholder('my-queue').fill(queueName)
  
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await page.waitForTimeout(2000)
  
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  
  await expect(page.getByText(queueName, { exact: true })).toBeVisible({ timeout: 5000 })
  
  await page.getByText(queueName, { exact: true }).click()
  await page.waitForTimeout(1500)
  
  await expect(page.getByText('ApproximateNumberOfMessages').first()).toBeVisible({ timeout: 3000 })
})