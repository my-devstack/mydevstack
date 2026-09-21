import { test, expect } from '../fixtures.js'

test.describe.configure({ timeout: 10000 })

const PROXY_URL = process.env.PROXY_URL || 'http://localhost:8081'

test.describe('Tab persistence via URL query params', () => {
  test('APIGateway tab from URL param - HTTP tab active', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/api-gateway?tab=http')
    await page.waitForLoadState('networkidle')
    
    const v2Tab = page.getByRole('tab', { name: 'API Gateway V2', exact: true })
    await expect(v2Tab).toBeVisible()
    await expect(v2Tab).toHaveAttribute('aria-selected', 'true')
  })

  test('APIGateway tab from URL param - REST tab active', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/api-gateway?tab=rest')
    await page.waitForLoadState('networkidle')
    
    const restTab = page.getByRole('tab', { name: 'API Gateway', exact: true })
    await expect(restTab).toBeVisible()
    await expect(restTab).toHaveAttribute('aria-selected', 'true')
  })

  test('ECS tab from URL param - Tasks tab active', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/ecs?tab=tasks')
    await page.waitForLoadState('networkidle')
    
    const tasksTab = page.getByRole('tab', { name: 'Tasks', exact: true })
    await expect(tasksTab).toBeVisible()
    await expect(tasksTab).toHaveAttribute('aria-selected', 'true')
  })

  test('ECS tab from URL param - Clusters tab active', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/ecs?tab=clusters')
    await page.waitForLoadState('networkidle')
    
    const clustersTab = page.getByRole('tab', { name: 'Clusters', exact: true })
    await expect(clustersTab).toBeVisible()
    await expect(clustersTab).toHaveAttribute('aria-selected', 'true')
  })

  test('ECR tab from URL param - Images tab active', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/ecr?tab=images')
    await page.waitForLoadState('networkidle')
    
    const imagesTab = page.getByRole('tab', { name: 'Images', exact: true })
    await expect(imagesTab).toBeVisible()
    await expect(imagesTab).toHaveAttribute('aria-selected', 'true')
  })

  test('ECR tab from URL param - Repositories tab active', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/ecr?tab=repositories')
    await page.waitForLoadState('networkidle')
    
    const reposTab = page.getByRole('tab', { name: 'Repositories', exact: true })
    await expect(reposTab).toBeVisible()
    await expect(reposTab).toHaveAttribute('aria-selected', 'true')
  })

  test('Reload preserves tab selection - APIGateway HTTP', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/api-gateway?tab=http')
    await page.waitForLoadState('networkidle')
    
    const v2Tab = page.getByRole('tab', { name: 'API Gateway V2', exact: true })
    await expect(v2Tab).toHaveAttribute('aria-selected', 'true')
    
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    
    await expect(v2Tab).toHaveAttribute('aria-selected', 'true')
  })

  test('Reload preserves tab selection - ECS Tasks', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/ecs?tab=tasks')
    await page.waitForLoadState('networkidle')
    
    const tasksTab = page.getByRole('tab', { name: 'Tasks', exact: true })
    await expect(tasksTab).toHaveAttribute('aria-selected', 'true')
    
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    await expect(tasksTab).toHaveAttribute('aria-selected', 'true')
  })

  test('Reload preserves tab selection - ECR Images', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/ecr?tab=images')
    await page.waitForLoadState('networkidle')
    
    const imagesTab = page.getByRole('tab', { name: 'Images', exact: true })
    await expect(imagesTab).toHaveAttribute('aria-selected', 'true')
    
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    await expect(imagesTab).toHaveAttribute('aria-selected', 'true')
  })

  test('Browser back/forward preserves tab state - APIGateway', async ({ page }) => {
    // Start on base URL (default tab)
    await page.goto('http://localhost:3000/#/services/api-gateway')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('tab', { name: 'API Gateway', exact: true })).toHaveAttribute('aria-selected', 'true')

    // Navigate to V2 tab via URL
    await page.goto('http://localhost:3000/#/services/api-gateway?tab=http')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('tab', { name: 'API Gateway V2', exact: true })).toHaveAttribute('aria-selected', 'true')

    // Go back to base URL (simulates browser back)
    await page.goto('http://localhost:3000/#/services/api-gateway')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('tab', { name: 'API Gateway', exact: true })).toHaveAttribute('aria-selected', 'true')

    // Go forward to V2 (simulates browser forward)
    await page.goto('http://localhost:3000/#/services/api-gateway?tab=http')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.getByRole('tab', { name: 'API Gateway V2', exact: true })).toHaveAttribute('aria-selected', 'true')
  })

  test('Default tab used when no query param - APIGateway', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/api-gateway')
    await page.waitForLoadState('networkidle')
    
    // Default should be REST tab
    const restTab = page.getByRole('tab', { name: 'API Gateway', exact: true })
    await expect(restTab).toBeVisible()
    await expect(restTab).toHaveAttribute('aria-selected', 'true')
  })

  test('Default tab used when no query param - ECS', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/ecs')
    await page.waitForLoadState('networkidle')
    
    // Default should be Clusters tab
    const clustersTab = page.getByRole('tab', { name: 'Clusters', exact: true })
    await expect(clustersTab).toBeVisible()
    await expect(clustersTab).toHaveAttribute('aria-selected', 'true')
  })

  test('Default tab used when no query param - ECR', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/ecr')
    await page.waitForLoadState('networkidle')
    
    // Default should be Repositories tab
    const reposTab = page.getByRole('tab', { name: 'Repositories', exact: true })
    await expect(reposTab).toBeVisible()
    await expect(reposTab).toHaveAttribute('aria-selected', 'true')
  })
})
