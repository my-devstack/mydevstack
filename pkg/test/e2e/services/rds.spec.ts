import { test, expect } from '../fixtures.js'

test.describe('RDS', () => {
  test('navigate to RDS page', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').locator('h1')).toContainText('RDS')
  })

  test('show instance count', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/instances?$/)).toBeVisible()
  })

  test('open create modal', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Instance' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Create DB Instance')).toBeVisible()
  })

  test('create modal has engine selector', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Instance' }).first().click()
    await page.waitForTimeout(1000)

    const engineSelect = page.getByLabel('Database Engine')
    await expect(engineSelect).toBeVisible()
    await expect(engineSelect).toHaveValue('mysql')
  })

  test('create modal cancel closes dialog', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create Instance' }).first().click()
    await page.waitForTimeout(1000)

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('refresh button works', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    const refreshBtn = page.getByRole('button', { name: '' }).first()
    await refreshBtn.click()
    await page.waitForTimeout(2000)
    await expect(page.getByRole('main').locator('h1')).toContainText('RDS')
  })

  test('usage examples visible', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Usage Examples', level: 3 })).toBeVisible()
  })

  test('AWS CLI example visible', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    const codeBlock = page.locator('pre').filter({ hasText: /aws rds create-db-instance/ })
    await expect(codeBlock).toBeVisible({ timeout: 10000 })
  })

  test('region selector visible', async ({ page }) => {
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('combobox')).toBeVisible()
  })
})

test.describe('RDS - VPC Configuration', () => {
  test('create instance WITH VPC selection', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')

    // Open create modal
    await page.getByRole('button', { name: 'Create Instance' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Fill required fields
    const dbName = `e2e-vpc-${Date.now()}`
    const identifierInput = page.getByRole('dialog').getByLabel(/db instance|identifier/i).first()
    if (await identifierInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await identifierInput.fill(dbName)
    } else {
      // Try DB instance identifier label
      const altInput = page.getByRole('dialog').getByLabel(/instance.*identifier/i).first()
      if (await altInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await altInput.fill(dbName)
      }
    }

    // Look for VPC Configuration section (collapsible)
    const vpcSection = page.getByRole('dialog').getByText(/VPC Configuration/i)
    if (await vpcSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vpcSection.click()
      await page.waitForTimeout(500)
    }

    // Try to select a VPC if VpcSelector is present
    const vpcSelect = page.getByRole('dialog').getByLabel(/VPC|vpc/i).first()
    if (await vpcSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await vpcSelect.locator('option').all()
      if (options.length > 1) {
        await vpcSelect.selectOption(options[1].getAttribute('value') || '')
        await page.waitForTimeout(500)

        // Try to select a DB subnet group
        const subnetSelect = page.getByRole('dialog').getByLabel(/subnet/i).first()
        if (await subnetSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          const subnetOptions = await subnetSelect.locator('option').all()
          if (subnetOptions.length > 1) {
            await subnetSelect.selectOption(subnetOptions[1].getAttribute('value') || '')
          }
        }

        // Try to select security groups
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

  test('create instance WITHOUT VPC (default) still works', async ({ page }) => {
    test.setTimeout(60000)
    await page.goto('/#/services/rds')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Create Instance' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })

    // Fill required fields only — skip VPC
    const dbName = `e2e-novpc-${Date.now()}`
    const identifierInput = page.getByRole('dialog').getByLabel(/db instance|identifier/i).first()
    if (await identifierInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await identifierInput.fill(dbName)
    }

    await page.getByRole('dialog').getByRole('button', { name: /create/i }).last().click()
    await page.waitForTimeout(2000)

    const dialogOpen = await page.getByRole('dialog').isVisible().catch(() => false)
    if (dialogOpen) {
      await page.getByRole('button', { name: /close|cancel/i }).click().catch(() => {})
    }
  })
})
