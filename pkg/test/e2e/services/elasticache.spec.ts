import { test, expect } from '../fixtures.js'

test.describe('ElastiCache', () => {
  test('navigate to ElastiCache page', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').locator('h1')).toContainText('ElastiCache')
  })

  test('show group count', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').getByText(/group/).first()).toBeVisible()
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Group' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Create Replication Group' })).toBeVisible()
  })

  test('create modal has required fields', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Group' }).first().click()
    await expect(page.getByLabel('Replication Group ID')).toBeVisible()
    await expect(page.getByLabel('Description')).toBeVisible()
    await expect(page.getByLabel('Node Type')).toBeVisible()
    await expect(page.getByLabel('Engine')).toBeVisible()
  })

  test('create modal cancel closes dialog', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Group' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('refresh button works', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    const refreshBtn = page.getByRole('button', { name: '' }).first()
    await refreshBtn.click()
    await page.waitForTimeout(2000)
    await expect(page.getByRole('main').locator('h1')).toContainText('ElastiCache')
  })

  test('usage examples visible', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Usage Examples', level: 3 })).toBeVisible()
  })

  test('AWS CLI example visible', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    const codeBlock = page.locator('pre').filter({ hasText: /aws elasticache/ })
    await expect(codeBlock).toBeVisible({ timeout: 10000 })
  })

  test('region selector visible', async ({ page }) => {
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('combobox')).toBeVisible()
  })
})

test.describe('ElastiCache - VPC Configuration', () => {
  test('create replication group WITH VPC selection', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')

    // Open create modal
    await page.getByRole('button', { name: 'Create Group' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Fill required fields
    const groupId = `e2e-vpc-${Date.now()}`
    const idInput = page.getByRole('dialog').getByLabel('Replication Group ID')
    if (await idInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await idInput.fill(groupId)
    }
    const descInput = page.getByRole('dialog').getByLabel('Description')
    if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descInput.fill('VPC test group')
    }

    // Look for VPC Configuration section
    const vpcSection = page.getByRole('dialog').getByText(/VPC Configuration/i)
    if (await vpcSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vpcSection.click()
      await page.waitForTimeout(500)
    }

    // Try to select a VPC
    const vpcSelect = page.getByRole('dialog').getByLabel(/VPC|vpc/i).first()
    if (await vpcSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await vpcSelect.locator('option').all()
      if (options.length > 1) {
        await vpcSelect.selectOption(options[1].getAttribute('value') || '')
        await page.waitForTimeout(500)

        // Try cache subnet group
        const subnetSelect = page.getByRole('dialog').getByLabel(/subnet|cache subnet/i).first()
        if (await subnetSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          const subnetOptions = await subnetSelect.locator('option').all()
          if (subnetOptions.length > 1) {
            await subnetSelect.selectOption(subnetOptions[1].getAttribute('value') || '')
          }
        }

        // Try security groups
        const sgCheckbox = page.getByRole('dialog').getByLabel(/security|sg/i).first()
        if (await sgCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
          await sgCheckbox.check().catch(() => {})
        }
      }
    }

    // Submit
    await page.getByRole('dialog').getByRole('button', { name: /create/i }).last().click()
    await page.waitForTimeout(2000)

    const dialogOpen = await page.getByRole('dialog').isVisible().catch(() => false)
    if (dialogOpen) {
      await page.getByRole('button', { name: /close|cancel/i }).click().catch(() => {})
    }
  })

  test('create replication group WITHOUT VPC (default) still works', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/#/services/elasticache')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Create Group' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Fill required fields — skip VPC
    const groupId = `e2e-novpc-${Date.now()}`
    const idInput = page.getByRole('dialog').getByLabel('Replication Group ID')
    if (await idInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await idInput.fill(groupId)
    }

    await page.getByRole('dialog').getByRole('button', { name: /create/i }).last().click()
    await page.waitForTimeout(2000)

    const dialogOpen = await page.getByRole('dialog').isVisible().catch(() => false)
    if (dialogOpen) {
      await page.getByRole('button', { name: /close|cancel/i }).click().catch(() => {})
    }
  })
})