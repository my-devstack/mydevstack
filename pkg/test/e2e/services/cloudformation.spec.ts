import { test, expect } from '../fixtures.js'

test.describe('CloudFormation', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    // Close any open modals before each test
    const modal = page.getByRole('dialog')
    if (await modal.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Cancel' }).first().click()
      await expect(modal).not.toBeVisible({ timeout: 5000 })
    }
  })

  test.afterEach(async ({ page }) => {
    // Cleanup: close any open modals - handle detached elements gracefully
    try {
      const modal = page.getByRole('dialog')
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.getByRole('button', { name: 'Cancel' }).first().click({ timeout: 3000 })
        await expect(modal).not.toBeVisible({ timeout: 5000 })
      }
    } catch (e) {
      // Modal closed or element detached - ignore
    }
  })

  test('navigate to CloudFormation', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })
    await expect(page.getByRole('main').locator('h1')).toContainText('CloudFormation', { timeout: 10000 })
  })

  test('load stack list', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    // Wait for either stacks or empty state
    await page.waitForSelector('text=/stack|No stacks found/i', { timeout: 10000 })
    const hasStacks = await page.getByText('stack', { exact: false }).first().isVisible().catch(() => false)
    const hasEmpty = await page.getByText('No stacks found').isVisible().catch(() => false)

    expect(hasStacks || hasEmpty).toBe(true)
  })

  test('open create stack modal', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    await page.getByText('+ Create Stack').first().click()
    await expect(page.getByText('Create New Stack')).toBeVisible({ timeout: 10000 })
  })

  test('create stack flow', async ({ page }) => {
    test.setTimeout(60000) // CF creation async, need more time

    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    // Step 1: Click to open modal
    await page.getByText('+ Create Stack').first().click()

    // Step 2: Wait for modal to be visible (critical - modal must be open before fill)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Create New Stack')).toBeVisible()

    // Step 3: Now fill form (modal is open)
    const stackName = `test-stack-${Date.now()}`
    await page.getByPlaceholder('Enter stack name').fill(stackName)
    await page.locator('textarea').fill(JSON.stringify({
      AWSTemplateFormatVersion: '2010-09-09',
      Resources: {},
    }))

    // Step 4: Click Create button inside modal
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

    // Step 5: Wait for modal to close (creation success)
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 20000 })

    // Step 6: Wait for page reload (triggered by window.location.reload())
    await page.waitForLoadState('networkidle')

    // Step 7: Wait for the new stack to appear in the list (CF async, use long timeout)
    // Handle pagination - search through pages to find the stack
    const maxPages = 10
    let stackRow = page.locator('.cursor-pointer').filter({ hasText: stackName })
    let found = await stackRow.isVisible().catch(() => false)

    for (let i = 0; i < maxPages && !found; i++) {
      if (i > 0) {
        const nextBtn = page.getByRole('button', { name: 'Next' })
        const isDisabled = await nextBtn.isDisabled().catch(() => true)
        if (isDisabled) break
        await nextBtn.click()
        await page.waitForLoadState('networkidle')
      }
      stackRow = page.locator('.cursor-pointer').filter({ hasText: stackName })
      found = await stackRow.isVisible().catch(() => false)
    }

    expect(found).toBe(true)
    await stackRow.first().click()
    await expect(page.getByText('Stack ID')).toBeVisible({ timeout: 5000 })
  })

  test('accordion expands and collapses', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    // Find a stack to test
    const stackRow = page.locator('div.cursor-pointer').first()
    const isVisible = await stackRow.isVisible().catch(() => false)

    if (!isVisible) {
      test.skip()
      return
    }

    // Get stack name from the row
    const stackName = await stackRow.textContent()

    // Click to expand
    await stackRow.click()

    // Verify expanded content appears (inline details)
    await expect(page.getByRole('heading', { name: 'Description' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Creation Time')).toBeVisible({ timeout: 5000 })

    // Click again to collapse
    await stackRow.click()

    // Verify content collapses (Description should disappear)
    await expect(page.getByRole('heading', { name: 'Description' })).not.toBeVisible({ timeout: 5000 })
  })

  test('delete stack flow', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    // Find a test stack to delete
    const stackName = 'test-stack'
    const stackRow = page.locator('div.cursor-pointer').filter({ hasText: stackName }).first()

    const isVisible = await stackRow.isVisible().catch(() => false)
    if (!isVisible) {
      test.skip()
      return
    }

    // Click delete button (trash icon) within the row
    // The delete button has aria-label="Delete"
    const deleteButton = stackRow.locator('button[aria-label="Delete"]')
    await deleteButton.click()

    // Confirm deletion text appears
    await expect(page.getByText('Delete Stack', { exact: true })).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('This action cannot be undone')).toBeVisible({ timeout: 5000 })

    // Confirm deletion - click Delete button in confirm section
    await page.getByRole('button', { name: 'Delete' }).last().click()

    // Wait for confirm to disappear
    await expect(page.getByText('Delete Stack', { exact: true })).not.toBeVisible({ timeout: 10000 })

    // Verify stack removed from list
    await expect(page.getByText(stackName, { exact: true })).not.toBeVisible({ timeout: 10000 })
  })

  test('error state - invalid template', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    // Step 1: Click to open modal
    await page.getByText('+ Create Stack').first().click()

    // Step 2: Wait for modal to be visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Create New Stack')).toBeVisible()

    // Step 3: Fill with invalid JSON (modal is open)
    await page.getByPlaceholder('Enter stack name').fill(`invalid-stack-${Date.now()}`)
    await page.locator('textarea').fill('{ invalid json }')

    // Step 4: Click Create button inside modal
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

    // Should show validation error
    await expect(page.getByText('Invalid JSON:')).toBeVisible({ timeout: 5000 })
  })

  test('error state - missing stack name', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    // Step 1: Click to open modal
    await page.getByText('+ Create Stack').first().click()

    // Step 2: Wait for modal to be visible
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Create New Stack')).toBeVisible()

    // Step 3: Fill only template, leave name empty (modal is open)
    await page.locator('textarea').fill(JSON.stringify({ Resources: {} }))

    // Step 4: Click Create button inside modal
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

    // Should show validation error
    await expect(page.getByText('Stack name is required')).toBeVisible({ timeout: 5000 })
  })

  test('switch to YAML format', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    // Open modal
    await page.getByText('+ Create Stack').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Default should be JSON selected
    await expect(page.getByRole('button', { name: 'JSON' })).toHaveClass(/bg-primary-600/)

    // Click YAML button
    await page.getByRole('button', { name: 'YAML' }).click()

    // YAML should now be selected
    await expect(page.getByRole('button', { name: 'YAML' })).toHaveClass(/bg-primary-600/)
  })

  test('create stack with YAML template', async ({ page }) => {
    test.setTimeout(60000)

    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    // Open modal
    await page.getByText('+ Create Stack').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Switch to YAML
    await page.getByRole('button', { name: 'YAML' }).click()

    // Fill form with YAML
    const stackName = `yaml-stack-${Date.now()}`
    await page.getByPlaceholder('Enter stack name').fill(stackName)
    await page.locator('textarea').fill(`AWSTemplateFormatVersion: "2010-09-09"
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-test-bucket`)

    // Create stack
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

    // Wait for modal to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 20000 })

    // Wait for page reload
    await page.waitForLoadState('networkidle')

    // Verify the stack appears in list
    const maxPages = 10
    let stackRow = page.locator('.cursor-pointer').filter({ hasText: stackName })
    let found = await stackRow.isVisible().catch(() => false)

    for (let i = 0; i < maxPages && !found; i++) {
      if (i > 0) {
        const nextBtn = page.getByRole('button', { name: 'Next' })
        const isDisabled = await nextBtn.isDisabled().catch(() => true)
        if (isDisabled) break
        await nextBtn.click()
        await page.waitForLoadState('networkidle')
      }
      stackRow = page.locator('.cursor-pointer').filter({ hasText: stackName })
      found = await stackRow.isVisible().catch(() => false)
    }

    expect(found).toBe(true)
  })

  test('validation error with invalid YAML', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })

    // Open modal
    await page.getByText('+ Create Stack').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Switch to YAML
    await page.getByRole('button', { name: 'YAML' }).click()

    // Fill with YAML containing CloudFormation tags (should be allowed now)
    await page.getByPlaceholder('Enter stack name').fill('test-stack')
    await page.locator('textarea').fill(`AWSTemplateFormatVersion: "2010-09-09"
Resources:
  MyQueue:
    Type: AWS::SQS::Queue
  MyFunction:
    Type: AWS::Lambda::Function
  MyESM:
    Type: AWS::Lambda::EventSourceMapping
    Properties:
      FunctionName: !Ref MyFunction
      EventSourceArn: !GetAtt MyQueue.Arn`)

    // Try to create - should now work (AWS validates server-side)
    await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

    // Should NOT show validation error (CF tags allowed)
    await expect(page.getByText('Invalid YAML')).not.toBeVisible({ timeout: 5000 })
  })

  test('usage examples section visible', async ({ page }) => {
    await page.goto('/#/services/cloudformation', { waitUntil: 'networkidle' })
    await expect(page.getByRole('heading', { name: 'Usage Examples' })).toBeVisible()
  })
})
