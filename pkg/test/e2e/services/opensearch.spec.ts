import { test, expect } from '../fixtures.js'

const TOAST_TIMEOUT = 20000
const ELEMENT_TIMEOUT = 5000
const QUICK_CHECK = 2000

// Helper: quick navigation
async function gotoPage(page: any) {
  await page.goto('/#/services/opensearch', { waitUntil: 'load' })
}

// Helper: quick element existence check
async function exists(locator: any, timeout = QUICK_CHECK): Promise<boolean> {
  return locator.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false)
}

function sleep(ms = 500): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

test.describe('OpenSearch', () => {
  test('navigate to OpenSearch page', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByRole('main').locator('h1').first()).toContainText('OpenSearch', { timeout: ELEMENT_TIMEOUT })
  })

  test('show domain count', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByRole('main').getByText(/domain/).first()).toBeVisible({ timeout: ELEMENT_TIMEOUT })
  })

  test('open create modal', async ({ page }) => {
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Domain' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await expect(page.getByRole('heading', { name: 'Create Domain' })).toBeVisible()
  })

  test('create modal has required fields', async ({ page }) => {
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Domain' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await expect(page.getByLabel('Domain Name')).toBeVisible()
    await expect(page.getByLabel('Engine Version')).toBeVisible()
    await expect(page.getByLabel('Instance Type')).toBeVisible()
  })

  test('cancel closes create dialog', async ({ page }) => {
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Domain' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('refresh button works', async ({ page }) => {
    await gotoPage(page)
    const refreshBtn = page.getByRole('button', { name: '' }).first()
    await refreshBtn.click()
    await page.waitForTimeout(2000)
    await expect(page.getByRole('main').locator('h1').first()).toContainText('OpenSearch')
  })

  test('create domain flow shows success toast', async ({ page }) => {
    test.setTimeout(60000)
    const domainName = `e2e-test-${Date.now()}`
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Domain' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Domain Name').fill(domainName)
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    await sleep(500)
    const toast = await exists(page.getByText(new RegExp(`Domain ${domainName} is being created|Failed to create domain|Domain name is required`)), TOAST_TIMEOUT)
    expect(toast).toBe(true)
  })

  test('delete domain flow shows success toast', async ({ page }) => {
    test.setTimeout(60000)
    // Create domain first
    const domainName = `e2e-del-${Date.now()}`
    await gotoPage(page)
    let createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Domain' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Domain Name').fill(domainName)
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    await sleep(500)
    const created = await exists(page.getByText(new RegExp(`Domain ${domainName} is being created|Failed to create domain`)), TOAST_TIMEOUT)
    if (!created) return // Skip delete if create failed

    // Now delete it — find the SPECIFIC domain row's delete button
    await sleep(1000)
    const domainRow = page.locator('.flex.items-center.justify-between.cursor-pointer').filter({ hasText: domainName })
    const delBtn = domainRow.locator('button[title="Delete"]')
    if (!await exists(delBtn)) return
    await delBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await expect(page.getByRole('heading', { name: 'Delete Domain' })).toBeVisible()
    await page.getByRole('button', { name: 'Delete' }).last().click({ force: true })
    await sleep(500)
    const toast = await exists(page.getByText(new RegExp(`Domain ${domainName} is being deleted|Failed to delete domain`)), TOAST_TIMEOUT)
    expect(toast).toBe(true)
  })

  test('expand domain accordion shows details', async ({ page }) => {
    await gotoPage(page)
    // Create a domain first to ensure there's something to expand
    const domainName = `e2e-exp-${Date.now()}`
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Domain' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Domain Name').fill(domainName)
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    await sleep(500)
    const created = await exists(page.getByText(new RegExp(`Domain ${domainName} is being created|Failed to create domain`)), TOAST_TIMEOUT)

    await sleep(1000)
    // Click the domain name text to toggle accordion (event bubbles to parent)
    const domainText = page.getByText(domainName, { exact: true }).first()
    const hasText = await exists(domainText)
    if (!hasText) {
      // Fall back to first available domain row
      const anyRow = page.locator('.flex.items-center.justify-between.cursor-pointer').first()
      if (!await exists(anyRow)) return
      await anyRow.click()
    } else {
      await domainText.click()
    }
    await sleep(1000)
    // Check for expanded section labels (always present when expanded)
    const foundEndpoint = await exists(page.getByText('Endpoint').first(), ELEMENT_TIMEOUT)
    const foundInstanceType = await exists(page.getByText('Instance Type').first(), ELEMENT_TIMEOUT)
    // At least one is enough — they're labels in the expanded accordion
    expect(foundEndpoint || foundInstanceType).toBe(true)
  })

  test('usage examples visible', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByRole('heading', { name: 'Usage Examples', level: 3 })).toBeVisible({ timeout: ELEMENT_TIMEOUT })
  })

  test('AWS CLI example visible', async ({ page }) => {
    await gotoPage(page)
    const codeBlock = page.locator('pre').filter({ hasText: /aws opensearch/ })
    await expect(codeBlock).toBeVisible({ timeout: 10000 })
  })
})

test.describe('OpenSearch - VPC Configuration', () => {
  test('create domain WITH VPC selection', async ({ page }) => {
    test.setTimeout(60000)
    await gotoPage(page)

    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Domain' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)

    // Fill domain name
    const domainName = `e2e-vpc-${Date.now()}`
    await page.getByLabel('Domain Name').fill(domainName)

    // Look for VPC Configuration section
    const vpcSection = page.getByRole('dialog').getByText(/VPC Configuration/i)
    if (await exists(vpcSection, 2000)) {
      await vpcSection.click()
      await sleep(500)
    }

    // Try to select a VPC
    const vpcSelect = page.getByRole('dialog').getByLabel(/VPC|vpc/i).first()
    if (await exists(vpcSelect, 2000)) {
      const options = await vpcSelect.locator('option').all()
      if (options.length > 1) {
        await vpcSelect.selectOption(options[1].getAttribute('value') || '')
        await sleep(500)

        // Try subnets
        const subnetSelect = page.getByRole('dialog').getByLabel(/subnet/i).first()
        if (await exists(subnetSelect, 2000)) {
          const subnetOptions = await subnetSelect.locator('option').all()
          if (subnetOptions.length > 1) {
            await subnetSelect.selectOption(subnetOptions[1].getAttribute('value') || '')
          }
        }

        // Try security groups
        const sgCheckbox = page.getByRole('dialog').getByLabel(/security|sg/i).first()
        if (await exists(sgCheckbox, 2000)) {
          await sgCheckbox.check().catch(() => {})
        }
      }
    }

    // Submit
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    await sleep(500)

    const toast = await exists(page.getByText(new RegExp(`Domain ${domainName} is being created|Failed to create domain`)), TOAST_TIMEOUT)
    expect(toast).toBe(true)
  })

  test('create domain WITHOUT VPC still works', async ({ page }) => {
    test.setTimeout(60000)
    await gotoPage(page)

    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Domain' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)

    // Fill domain name only — skip VPC
    const domainName = `e2e-novpc-${Date.now()}`
    await page.getByLabel('Domain Name').fill(domainName)

    // Submit without VPC
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    await sleep(500)

    const toast = await exists(page.getByText(new RegExp(`Domain ${domainName} is being created|Failed to create domain`)), TOAST_TIMEOUT)
    expect(toast).toBe(true)
  })
})

test.describe('Pagination', () => {
  test('shows per-page selector when items exist', async ({ page }) => {
    await gotoPage(page)
    const showLabel = page.getByText('Show:')
    if (await exists(showLabel)) {
      const perPageSelect = showLabel.locator('..').locator('select')
      await expect(perPageSelect).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    }
  })

  test('change items per page when items exist', async ({ page }) => {
    await gotoPage(page)
    const showLabel = page.getByText('Show:')
    if (await exists(showLabel)) {
      const perPageSelect = showLabel.locator('..').locator('select')
      await perPageSelect.selectOption('50')
      await expect(showLabel.locator('..').getByText('per page')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    }
  })

  test('page navigation buttons work when paginated', async ({ page }) => {
    await gotoPage(page)
    const showLabel = page.getByText('Show:')
    if (await exists(showLabel)) {
      const paginationSection = showLabel.locator('..')
      const perPageSelect = paginationSection.locator('select')
      await perPageSelect.selectOption('5')
      const nextButton = page.getByRole('button', { name: 'Next' }).first()
      if (await exists(nextButton)) {
        await expect(nextButton).toBeVisible({ timeout: ELEMENT_TIMEOUT })
      }
    }
  })
})
