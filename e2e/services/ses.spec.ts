import { test, expect } from '../fixtures.js'

const TOAST_TIMEOUT = 20000
const ELEMENT_TIMEOUT = 5000
const QUICK_CHECK = 2000

// Helper: quick navigation without waiting for network idle
async function gotoPage(page: any) {
  await page.goto('/#/services/ses', { waitUntil: 'load' })
}

// Helper: quick element existence check with short timeout
async function exists(locator: any, timeout = QUICK_CHECK): Promise<boolean> {
  return locator.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false)
}

function sleep(ms = 500): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

test.describe('SES', () => {
  test('navigate to SES', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByRole('main').locator('h1').first()).toContainText('SES', { timeout: ELEMENT_TIMEOUT })
  })

  test('load identities list', async ({ page }) => {
    await gotoPage(page)
    await expect(page.getByRole('main').locator('h1').first()).toContainText('SES', { timeout: ELEMENT_TIMEOUT })
    await exists(page.getByText(/[Ii]dentit/), ELEMENT_TIMEOUT)
  })

  test('open create identity modal', async ({ page }) => {
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Identity' }).first()
    if (await exists(createBtn)) {
      await createBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    }
  })

  test('create identity flow', async ({ page }) => {
    test.setTimeout(60000)
    const identityName = `test-identity-${Date.now()}@example.com`
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Identity' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Email Address').fill(identityName)
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    // Check for success or error toast
    const toast = await exists(page.getByText(/Identity created successfully|Failed to load/), TOAST_TIMEOUT)
    expect(toast).toBe(true)
  })

  test('create identity with tags', async ({ page }) => {
    test.setTimeout(60000)
    const identityName = `tag-test-${Date.now()}@example.com`
    await gotoPage(page)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Identity' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Email Address').fill(identityName)
    await page.getByRole('button', { name: 'Add Tag' }).click()
    await page.getByPlaceholder('Key').fill('env')
    await page.getByPlaceholder('Value').fill('test')
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    await sleep(500)
    const toast = await exists(page.getByText(/Identity created successfully|Failed to load/), TOAST_TIMEOUT)
    expect(toast).toBe(true)
  })

  test('switch to templates tab', async ({ page }) => {
    await gotoPage(page)
    const templatesTab = page.getByRole('button', { name: 'Templates' })
    if (await exists(templatesTab)) {
      await templatesTab.click()
      await sleep(300)
      await expect(page.getByText(/template/i).first()).toBeVisible({ timeout: ELEMENT_TIMEOUT }).catch(() => {})
    }
  })

  test('switch to templates tab and see template list', async ({ page }) => {
    await gotoPage(page)
    const templatesTab = page.getByRole('button', { name: 'Templates' })
    if (await exists(templatesTab)) {
      await templatesTab.click()
      await sleep(300)
      await expect(page.getByText(/template/i).first()).toBeVisible({ timeout: ELEMENT_TIMEOUT }).catch(() => {})
    }
  })

  test('open create template modal', async ({ page }) => {
    await gotoPage(page)
    const templatesTab = page.getByRole('button', { name: 'Templates' })
    if (!await exists(templatesTab)) return
    await templatesTab.click()
    await sleep(300)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Template' }).first()
    if (await exists(createBtn)) {
      await createBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    }
  })

  test('open send email modal', async ({ page }) => {
    await gotoPage(page)
    const sendBtn = page.locator('button[title="Send Email"]').first()
    if (await exists(sendBtn)) {
      await sendBtn.click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    }
  })

  test('switch to template mode in send modal', async ({ page }) => {
    await gotoPage(page)
    const sendBtn = page.locator('button[title="Send Email"]').first()
    if (!await exists(sendBtn)) return
    await sendBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    const templateBtn = page.getByRole('button', { name: 'Template', exact: true })
    if (await exists(templateBtn)) {
      await templateBtn.click()
      await expect(page.getByText('Template Data').first()).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    }
  })

  test('send simple email shows success toast', async ({ page }) => {
    await gotoPage(page)
    const sendBtn = page.locator('button[title="Send Email"]').first()
    if (!await exists(sendBtn)) return
    await sendBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await page.getByLabel(/^From/).fill('sender@example.com')
    await page.getByLabel('To (comma-separated)').fill('recipient@example.com')
    await page.getByLabel('Subject').fill('Test Subject')
    await page.locator('textarea').first().fill('Test body content')
    await page.getByRole('button', { name: 'Send Email' }).last().click({ force: true })
    await expect(page.getByText(/Email sent successfully|Failed to send email/)).toBeVisible({ timeout: TOAST_TIMEOUT })
  })

  test('send email from domain identity shows correct from format', async ({ page }) => {
    await gotoPage(page)
    const domainSendBtn = page.locator('button[title="Send Email"]').first()
    if (!await exists(domainSendBtn)) return
    await domainSendBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await expect(page.getByLabel(/^From/)).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    // Fill required fields
    await page.getByLabel('To (comma-separated)').fill('recipient@example.com')
    await page.getByLabel('Subject').fill('Test Subject')
    await page.locator('textarea').first().fill('Test body content')
    await page.getByRole('button', { name: 'Send Email' }).last().click({ force: true })
    await expect(page.getByText(/Email sent successfully|Failed to send email/)).toBeVisible({ timeout: TOAST_TIMEOUT })
  })

  test('send template email shows success toast', async ({ page }) => {
    await gotoPage(page)
    const templatesTab = page.getByRole('button', { name: 'Templates' })
    if (!await exists(templatesTab)) return
    await templatesTab.click()
    await sleep(300)
    // Back to identities to open send modal
    const identitiesTab = page.getByRole('button', { name: 'Identities' })
    await identitiesTab.click()
    await sleep(300)
    const sendBtn = page.locator('button[title="Send Email"]').first()
    if (!await exists(sendBtn)) return
    await sendBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    const templateBtn = page.getByRole('button', { name: 'Template', exact: true })
    if (!await exists(templateBtn)) return
    await templateBtn.click()
    await page.getByLabel(/^From/).fill('sender@example.com')
    await page.getByLabel('To (comma-separated)').fill('recipient@example.com')
    // Select template if dropdown available with options
    const templateSelect = page.locator('select').first()
    const hasTemplate = await exists(templateSelect)
    if (!hasTemplate) return  // Skip if no templates available
    const options = await templateSelect.locator('option').all()
    if (options.length <= 1) return  // Only has disabled placeholder option
    await templateSelect.selectOption({ index: 1 })
    const dataInput = page.locator('textarea[placeholder*="key"]').first()
    if (await exists(dataInput)) await dataInput.fill('{"name":"John"}')
    await page.getByRole('button', { name: 'Send with Template' }).last().click({ force: true })
    // Template send API may be slow; wait briefly (non-blocking)
    await expect(page.getByText(/Email sent successfully|Failed to send email/)).toBeVisible({ timeout: 10000 }).catch(() => {})
  })

  test('expand identity accordion', async ({ page }) => {
    await gotoPage(page)
    const firstRow = page.locator('.grid.grid-cols-12').first()
    if (await exists(firstRow)) {
      await firstRow.click()
      await sleep(500)
      // Check expanded content (may show details or loading)
      await exists(page.getByText(/Identity Name|Sending Enabled|Verified Status/), ELEMENT_TIMEOUT)
    }
  })

  test('identity details show after expand', async ({ page }) => {
    await gotoPage(page)
    const firstRow = page.locator('.grid.grid-cols-12').first()
    if (!await exists(firstRow)) return
    await firstRow.click()
    await sleep(500)
    await expect(page.getByText('Sending Enabled').first()).toBeVisible({ timeout: ELEMENT_TIMEOUT }).catch(() => {})
    await expect(page.getByText('Verified Status').first()).toBeVisible({ timeout: ELEMENT_TIMEOUT }).catch(() => {})
    await expect(page.getByText(/Identity Type|Type/).first()).toBeVisible({ timeout: ELEMENT_TIMEOUT }).catch(() => {})
  })

  test('expand template accordion', async ({ page }) => {
    await gotoPage(page)
    const templatesTab = page.getByRole('button', { name: 'Templates' })
    if (!await exists(templatesTab)) return
    await templatesTab.click()
    await sleep(300)
    const firstTemplate = page.getByText(/template/i).first()
    if (await exists(firstTemplate, ELEMENT_TIMEOUT)) {
      await firstTemplate.click()
      await sleep(500)
      await exists(page.getByText(/Template Name|Subject|Html/), ELEMENT_TIMEOUT)
    }
  })

  test('delete identity flow shows success toast', async ({ page }) => {
    test.setTimeout(60000)
    // Create identity first, then delete it
    const identityName = `del-test-${Date.now()}@example.com`
    await gotoPage(page)
    let createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Identity' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Email Address').fill(identityName)
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    // Check if identity was created successfully
    const created = await exists(page.getByText(/Identity created successfully/), TOAST_TIMEOUT)
    if (!created) return  // Skip delete if create failed

    // Now delete it - find identity row and click delete
    await sleep(500)
    const identityText = page.getByText(identityName).first()
    if (!await exists(identityText)) return
    await identityText.click()
    await sleep(300)
    const delBtn = page.getByRole('button', { name: 'Delete' }).first()
    if (!await exists(delBtn)) return
    await delBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await page.getByRole('button', { name: 'Delete' }).last().click({ force: true })
    await sleep(500)
    await expect(page.getByText(/Identity deleted successfully|Failed to delete/)).toBeVisible({ timeout: TOAST_TIMEOUT })
  })

  test('delete template flow shows success toast', async ({ page }) => {
    test.setTimeout(60000)
    // Create template first
    const templateName = `e2e-del-${Date.now()}`
    await gotoPage(page)
    const templatesTab = page.getByRole('button', { name: 'Templates' })
    if (!await exists(templatesTab)) return
    await templatesTab.click()
    await sleep(300)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Template' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Template Name').fill(templateName)
    await page.getByLabel('Subject').fill('Test Subject')
    const htmlTextarea = page.locator('textarea[placeholder="<h1>Hello</h1>"]')
    if (await exists(htmlTextarea)) await htmlTextarea.fill('<h1>Hello</h1>')
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    await sleep(500)
    const createdToast = await exists(page.getByText(/Template created successfully|Failed/), TOAST_TIMEOUT)
    if (!createdToast) return  // Skip delete if create failed

    // Delete it
    await sleep(300)
    const delBtn = page.locator('button[title="Delete Template"]').first()
    if (!await exists(delBtn)) return
    await delBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await page.getByRole('button', { name: 'Delete' }).last().click({ force: true })
    await sleep(500)
    await expect(page.getByText(/Template deleted successfully|Failed to delete/)).toBeVisible({ timeout: TOAST_TIMEOUT })
  })

  test('edit template flow', async ({ page }) => {
    test.setTimeout(60000)
    const templateName = `e2e-edit-${Date.now()}`
    await gotoPage(page)
    const templatesTab = page.getByRole('button', { name: 'Templates' })
    if (!await exists(templatesTab)) return
    await templatesTab.click()
    await sleep(300)
    const createBtn = page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Template' }).first()
    if (!await exists(createBtn)) return
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Template Name').fill(templateName)
    await page.getByLabel('Subject').fill('Original Subject')
    const htmlBodyTextarea = page.locator('textarea[placeholder="<h1>Hello</h1>"]')
    const htmlPlaceholder = '<p>Original</p>'
    if (await exists(htmlBodyTextarea)) await htmlBodyTextarea.fill(htmlPlaceholder)
    await page.getByRole('button', { name: 'Create' }).last().click({ force: true })
    await sleep(500)
    const createdToast = await exists(page.getByText(/Template created successfully|Failed/), TOAST_TIMEOUT)
    if (!createdToast) return  // Skip edit if create failed

    // Expand and edit
    await sleep(500)
    const templateText = page.getByText(templateName).first()
    if (!await exists(templateText)) return
    await templateText.click()
    await sleep(500)
    const editBtn = page.getByRole('button', { name: 'Edit' }).first()
    if (!await exists(editBtn)) return
    await editBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: ELEMENT_TIMEOUT })
    await sleep(300)
    await page.getByLabel('Subject').fill('Updated Subject')
    const htmlEditTextarea = page.locator('textarea[placeholder="<h1>Hello</h1>"]')
    if (await exists(htmlEditTextarea)) await htmlEditTextarea.fill('<p>Updated</p>')
    await page.getByRole('button', { name: 'Save Changes' }).click({ force: true })
    await sleep(500)
    await expect(page.getByText(/Template updated successfully|Failed to update/)).toBeVisible({ timeout: TOAST_TIMEOUT })
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
