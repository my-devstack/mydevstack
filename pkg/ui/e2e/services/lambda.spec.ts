import { test, expect } from '../fixtures'

test.describe('Lambda', () => {
  test.beforeEach(async () => {
    // Cleanup handled by proxy mock
  })

  test('navigate to Lambda', async ({ page }) => {
    await page.goto('/#/services/lambda')
    await page.waitForTimeout(2000)
    
    await expect(page.getByRole('main').locator('h1')).toContainText('Lambda', { timeout: 10000 })
  })
  
  test('load function list', async ({ page }) => {
    await page.goto('/#/services/lambda')
    await page.waitForTimeout(2000)
    
    await expect(page.getByText('function').first()).toBeVisible({ timeout: 10000 })
  })
  
  test('open create function modal', async ({ page }) => {
    await page.goto('/#/services/lambda')
    await page.waitForTimeout(2000)
    
    await page.getByRole('button', { name: '+ Create Function' }).click()
    await page.waitForTimeout(1000)
    
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  })
})