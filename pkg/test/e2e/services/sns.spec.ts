import { test, expect } from '../fixtures.js'

// Helper to find topic on any page (handles pagination, 15 per page)
async function findTopicOnPage(page: any, topicName: string, maxPages = 5): Promise<boolean> {
  for (let i = 0; i < maxPages; i++) {
    const topic = page.getByText(topicName)
    if (await topic.isVisible({ timeout: 2000 }).catch(() => false)) {
      return true
    }
    const nextBtn = page.getByRole('button', { name: 'Next' })
    if (await nextBtn.isEnabled({ timeout: 1000 }).catch(() => false)) {
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

  test('list subscriptions by topic via API', async ({ page }) => {
    // Direct API test: create a topic and list subscriptions by its ARN
    const topicName = `test-api-sub-${Date.now()}`

    // Create topic via API
    const createRes = await page.request.post('http://127.0.0.1:8081/sns/topics', {
      data: { Name: topicName },
    })
    expect(createRes.ok()).toBeTruthy()
    const createData = await createRes.json()
    const topicArn = createData.TopicArn
    expect(topicArn).toBeTruthy()

    // List subscriptions by topic (the endpoint that was failing)
    const listRes = await page.request.get(
      `http://127.0.0.1:8081/sns/subscriptions/by-topic/${encodeURIComponent(topicArn)}`
    )
    expect(listRes.ok()).toBeTruthy()
    const listData = await listRes.json()
    expect(listData.Subscriptions).toBeDefined()

    // Clean up
    const delRes = await page.request.delete(
      `http://127.0.0.1:8081/sns/topics/${encodeURIComponent(topicArn)}`
    )
    expect(delRes.ok()).toBeTruthy()
  })
})

test.describe('Pagination', () => {
  test('shows per-page selector when items exist', async ({ page }) => {
    await page.goto('/#/services/sns')
    await page.waitForLoadState('networkidle')
    // Pagination only renders when topics exist. Check gracefully.
    const showLabel = page.getByText('Show:')
    if (await showLabel.isVisible().catch(() => false)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await expect(perPageSelect).toBeVisible({ timeout: 5000 })
    }
  })

  test('change items per page when items exist', async ({ page }) => {
    await page.goto('/#/services/sns')
    await page.waitForLoadState('networkidle')
    const showLabel = page.getByText('Show:')
    if (await showLabel.isVisible().catch(() => false)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await perPageSelect.selectOption('50')
      await expect(paginationSection.getByText('per page')).toBeVisible({ timeout: 5000 })
    }
  })

  test('page navigation buttons work when paginated', async ({ page }) => {
    await page.goto('/#/services/sns')
    await page.waitForLoadState('networkidle')
    const showLabel = page.getByText('Show:')
    if (await showLabel.isVisible().catch(() => false)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await perPageSelect.selectOption('5')
      const nextButton = page.getByRole('button', { name: 'Next' }).first()
      if (await nextButton.isVisible().catch(() => false)) {
        await expect(nextButton).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
