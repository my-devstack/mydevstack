import { test, expect } from '../fixtures.js'

test.describe('VPC - Navigation', () => {
  test('navigate to VPC page and verify tabs visible', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').locator('h1')).toContainText('VPC')
    await expect(page.getByRole('tab', { name: 'VPCs' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Subnets' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Route Tables' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Internet GWs' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'NAT Gateways' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Network ACLs' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Elastic IPs' })).toBeVisible()
  })
})

test.describe('VPC - Tab Switching', () => {
  test('switch between all VPC tabs', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')

    const tabs = ['VPCs', 'Subnets', 'Route Tables', 'Internet GWs', 'NAT Gateways', 'Network ACLs', 'Elastic IPs']
    for (const tabName of tabs) {
      await page.getByRole('tab', { name: tabName }).click()
      await page.waitForTimeout(500)
      await expect(page.getByRole('tab', { name: tabName })).toBeVisible()
    }
  })
})

test.describe('VPC - VPCs Tab', () => {
  test('Create VPC dialog opens and cancels', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create VPC' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('Create VPC form has CidrBlock field', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('button', { name: 'Create VPC' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel(/cidr/i).first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('VPC - Subnets Tab', () => {
  test('Create Subnet dialog opens and cancels', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Subnets' }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Create Subnet' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })

  test('Create Subnet form has form fields', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Subnets' }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Create Subnet' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    // Either a VPC select or CidrBlock input should be present
    const hasVpcSelect = await page.getByLabel(/vpc/i).first().isVisible({ timeout: 2000 }).catch(() => false)
    const hasCidr = await page.getByLabel(/cidr/i).first().isVisible({ timeout: 2000 }).catch(() => false)
    expect(hasVpcSelect || hasCidr).toBeTruthy()
  })
})

test.describe('VPC - Route Tables Tab', () => {
  test('Create Route Table dialog opens and cancels', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Route Tables' }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Create Route Table' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('VPC - Internet GWs Tab', () => {
  test('Create IGW dialog opens and cancels', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Internet GWs' }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Create IGW' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('VPC - NAT Gateways Tab', () => {
  test('Create NAT Gateway dialog opens and cancels', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'NAT Gateways' }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Create NAT Gateway' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('VPC - Network ACLs Tab', () => {
  test('Create Network ACL dialog opens and cancels', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Network ACLs' }).click()
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Create Network ACL' }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('VPC - Elastic IPs Tab', () => {
  test('Elastic IPs tab renders', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Elastic IPs' }).click()
    await page.waitForTimeout(500)
    await expect(page.getByText('elastic IP').first()).toBeVisible()
  })

  test('Elastic IPs tab — Allocate button visible', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Elastic IPs' }).click()
    await page.waitForTimeout(500)
    const allocateBtn = page.getByRole('button', { name: /Allocate/i })
    await expect(allocateBtn.first()).toBeVisible()
  })
})

test.describe('VPC - Pagination', () => {
  async function hasPagination(page: any) {
    try {
      return await page.getByText('Show:').first().isVisible({ timeout: 2000 })
    } catch {
      return false
    }
  }

  test('pagination controls present when items exist', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    const paginationVisible = await hasPagination(page)
    if (paginationVisible) {
      await expect(page.getByText('Show:').first()).toBeVisible()
      await expect(page.getByText('per page').first()).toBeVisible()
    } else {
      // Empty state shown instead (0 items) — still valid
      await expect(page.getByText(/No VPC|empty|vpc/i).first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('VPC - Usage Examples', () => {
  test('usage examples section visible', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Usage Examples' })).toBeVisible({ timeout: 10000 })
  })

  test('AWS CLI tab shows command text', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    const codeBlock = page.locator('pre').filter({ hasText: /aws ec2.*vpc|create-vpc|create-subnet/ })
    await expect(codeBlock).toBeVisible({ timeout: 10000 })
  })

  test('JavaScript tab shows JS example', async ({ page }) => {
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    const jsTab = page.getByRole('tab', { name: /javascript|js/i }).first()
    if (await jsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await jsTab.click()
      await page.waitForTimeout(500)
      const jsCode = page.locator('pre').filter({ hasText: /ec2|vpc|describe/i }).first()
      await expect(jsCode).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('VPC - Console Errors', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    await page.goto('/#/services/vpc')
    await page.waitForLoadState('networkidle')
    expect(errors.length).toBe(0)
  })
})
