import { test, expect } from '../fixtures.js'

// Helper to find queue on any page (handles pagination)
async function findQueueOnPage(page: any, queueName: string, maxPages = 5): Promise<boolean> {
  for (let i = 0; i < maxPages; i++) {
    const queue = page.getByText(queueName, { exact: true })
    if (await queue.isVisible({ timeout: 2000 }).catch(() => false)) {
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

async function createQueue(page: any, queueName: string, fifo = false) {
  await page.goto('/#/services/sqs')
  await page.waitForLoadState('networkidle')

  await page.getByRole('button', { name: '+ Create Queue' }).click()
  await page.waitForTimeout(1500)

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
  await page.getByPlaceholder('my-queue').fill(queueName)

  if (fifo) {
    await page.getByLabel('FIFO Queue').check()
  }

  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await page.waitForTimeout(5000)

  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 20000 })
}

test('create FIFO queue and verify in list and attributes', async ({ page }) => {
  const queueName = 'test-fifo-' + Date.now()

  await createQueue(page, queueName, true)

  const found = await findQueueOnPage(page, queueName + '.fifo')
  expect(found).toBe(true)

  await page.getByText(queueName + '.fifo').click()
  await page.waitForTimeout(2000)

  const fifoValue = page.locator('td:text("FifoQueue") ~ td').first()
  await expect(fifoValue).toContainText('true')
})

test('create standard queue and verify in list', async ({ page }) => {
  const queueName = 'test-std-' + Date.now()

  await createQueue(page, queueName, false)

  const found = await findQueueOnPage(page, queueName)
  expect(found).toBe(true)

  await page.getByText(queueName, { exact: true }).click()
  await page.waitForTimeout(2000)

  await expect(page.getByText('ApproximateNumberOfMessages').first()).toBeVisible({ timeout: 5000 })
})

test('open view messages modal and close via close button', async ({ page }) => {
  const queueName = 'test-view-' + Date.now()

  await createQueue(page, queueName, false)

  const found = await findQueueOnPage(page, queueName)
  expect(found).toBe(true)

  const queueRow = page.locator('span').filter({ hasText: queueName }).locator('..').locator('..')
  await queueRow.locator('button[title="View Messages"]').click()
  await page.waitForTimeout(1500)

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('heading', { name: `Messages - ${queueName}` })).toBeVisible({ timeout: 5000 })

  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click()
  await page.waitForTimeout(500)

  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
})

test('open view messages modal and close via X button', async ({ page }) => {
  const queueName = 'test-viewx-' + Date.now()

  await createQueue(page, queueName, false)

  const found = await findQueueOnPage(page, queueName)
  expect(found).toBe(true)

  const queueRow = page.locator('span').filter({ hasText: queueName }).locator('..').locator('..')
  await queueRow.locator('button[title="View Messages"]').click()
  await page.waitForTimeout(1500)

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  await expect(page.getByRole('heading', { name: `Messages - ${queueName}` })).toBeVisible({ timeout: 5000 })

  await page.getByRole('dialog').getByRole('button').filter({ has: page.locator('svg') }).click()
  await page.waitForTimeout(500)

  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
})