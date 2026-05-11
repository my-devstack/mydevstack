import { test, expect } from '../fixtures'

// Helper to find topic on any page (handles pagination, 15 per page)
async function findTopicOnPage(page: any, topicName: string, maxPages = 5): Promise<boolean> {
  for (let i = 0; i < maxPages; i++) {
    const topic = page.getByText(topicName)
    if (await topic.isVisible({ timeout: 2000 }).catch(() => false)) {
      return true
    }
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

test.describe('SNS', () => {
  test('navigate to SNS', async ({ page }) => {
    await page.goto('/#/services/sns')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('main').locator('h1')).toContainText('SNS', { timeout: 10000 })
  })

  test('load topic list', async ({ page }) => {
    await page.goto('/#/services/sns')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('topic').first()).toBeVisible({ timeout: 10000 })
  })

  test('open create topic modal', async ({ page }) => {
    await page.goto('/#/services/sns')
    await page.waitForLoadState('networkidle')

    await page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Topic' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
  })

  test('create topic flow', async ({ page }) => {
    const topicName = `test-topic-${Date.now()}`
    await page.goto('/#/services/sns')
    await page.waitForLoadState('networkidle')

    // Open create modal
    await page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Topic' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Fill form
    await page.getByLabel('Topic Name').fill(topicName)

    // Submit
    await page.getByRole('button', { name: 'Create' }).last().click()

    // Wait for topic to appear (search across pages due to pagination)
    await page.waitForTimeout(2000)
    const found = await findTopicOnPage(page, topicName)
    expect(found).toBe(true)
  })
})
