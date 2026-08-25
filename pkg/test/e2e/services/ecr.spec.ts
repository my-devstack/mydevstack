import { test, expect } from '../fixtures.js'

// Navigate through pagination to find item on any page
async function findItemOnPage(page: any, itemName: string, maxPages = 10): Promise<boolean> {
  for (let i = 0; i < maxPages; i++) {
    const item = page.getByText(itemName, { exact: true })
    if (await item.isVisible({ timeout: 2000 }).catch(() => false)) {
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

// Find delete button for a specific item by filtering the item's row
async function findDeleteButtonForItem(page: any, itemName: string) {
  // Each repo row is a div.border.rounded-lg containing the item text + a button[title="Delete"]
  const row = page.locator('div.border.rounded-lg').filter({ hasText: itemName }).first()
  return row.locator('button[title="Delete"]')
}

test.describe('ECR', () => {
  test('navigate to ECR page', async ({ page }) => {
    await page.goto('/#/services/ecr')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'ECR' }).first()).toBeVisible({ timeout: 15000 })
  })

  test('verify Repositories tab loads', async ({ page }) => {
    await page.goto('/#/services/ecr')
    await page.waitForLoadState('networkidle')
    // Should show repository count
    await expect(page.getByText('repository(ies)')).toBeVisible({ timeout: 10000 })
  })

  test('create a repository', async ({ page }) => {
    await page.goto('/#/services/ecr')
    await page.waitForLoadState('networkidle')

    const repoName = `test-repo-${Date.now()}`

    // Click create button
    await page.getByRole('button', { name: '+ Create Repository' }).first().click()
    await page.waitForTimeout(1000)

    // Modal heading should appear
    await expect(page.getByRole('heading', { name: 'Create ECR Repository' })).toBeVisible({ timeout: 10000 })

    // Fill repository name
    const nameInput = page.getByLabel('Repository Name')
    await expect(nameInput).toBeVisible()
    await nameInput.fill(repoName)

    // Click Create
    await page.getByRole('button', { name: 'Create', exact: true }).last().click()

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Create ECR Repository' })).not.toBeVisible({ timeout: 10000 })

    // Navigate pages to find newly created repo (may be on page 2+)
    const found = await findItemOnPage(page, repoName)
    expect(found).toBe(true)
  })

  test('view repository details', async ({ page }) => {
    await page.goto('/#/services/ecr')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Find and click on a repository to expand details
    const repoRow = page.locator('div.border.rounded-lg').first()
    if (await repoRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await repoRow.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1500)

      // Verify URI is visible in the row
      const hasUri = await page.getByText('.dkr.ecr.').first().isVisible().catch(() => false)
      // Verify image count or tab is visible
      const hasImages = await page.getByRole('tab', { name: 'Images' }).isVisible().catch(() => false)
      expect(hasUri || hasImages).toBe(true)
    }
  })

  test('delete repository', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/#/services/ecr')
    await page.waitForLoadState('networkidle')

    const repoName = `test-delete-${Date.now()}`

    // First create a repo to delete
    await page.getByRole('button', { name: '+ Create Repository' }).first().click()
    await page.waitForTimeout(1000)
    await expect(page.getByRole('heading', { name: 'Create ECR Repository' })).toBeVisible({ timeout: 10000 })
    await page.getByLabel('Repository Name').fill(repoName)
    await page.getByRole('button', { name: 'Create', exact: true }).last().click()

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Create ECR Repository' })).not.toBeVisible({ timeout: 10000 })

    // Navigate pages to find the newly created repo
    const found = await findItemOnPage(page, repoName)
    expect(found).toBe(true)

    // Find delete button scoped to this repo's row
    const deleteBtn = await findDeleteButtonForItem(page, repoName)
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click()
      await page.waitForTimeout(500)

      // Handle confirmation dialog if present
      const confirmBtn = page.getByRole('button', { name: 'Confirm' })
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click()
        await page.waitForTimeout(2000)
      }

      // Verify repo removed — must search through all pages
      const stillFound = await findItemOnPage(page, repoName)
      expect(stillFound).toBe(false)
    }
  })

  test('verify code examples section shows AWS CLI push/pull commands', async ({ page }) => {
    await page.goto('/#/services/ecr')
    await page.waitForLoadState('networkidle')

    // Code Examples is a static section at the bottom, not a tab
    // Scroll down to make it visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    // Verify code examples heading
    await expect(page.getByRole('heading', { name: 'ECR Usage Examples' })).toBeVisible({ timeout: 10000 })

    // Verify AWS CLI commands are visible
    const hasGetLogin = await page.getByText('get-login-password').isVisible().catch(() => false)
    const hasDockerLogin = await page.getByText('docker login').isVisible().catch(() => false)
    const hasDockerPush = await page.getByText('docker push').isVisible().catch(() => false)
    const hasDockerPull = await page.getByText('docker pull').isVisible().catch(() => false)

    expect(hasGetLogin || hasDockerLogin || hasDockerPush || hasDockerPull).toBe(true)
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/ecr')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: '+ Create Repository' }).first().click()
    await expect(page.getByRole('heading', { name: 'Create ECR Repository' })).toBeVisible({ timeout: 10000 })
  })

  test('cancel closes create dialog', async ({ page }) => {
    await page.goto('/#/services/ecr')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: '+ Create Repository' }).first().click()
    await expect(page.getByRole('heading', { name: 'Create ECR Repository' })).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('heading', { name: 'Create ECR Repository' })).not.toBeVisible({ timeout: 5000 })
  })
})
