import { test, expect } from '../fixtures'

test.describe('SNS', () => {
  test('navigate to SNS', async ({ page }) => {
    await page.goto('/#/services/sns')
    await page.waitForTimeout(2000)
    
    await expect(page.getByRole('main').locator('h1')).toContainText('SNS', { timeout: 10000 })
  })
  
  test('load topic list', async ({ page }) => {
    await page.goto('/#/services/sns')
    await page.waitForTimeout(2000)
    
    await expect(page.getByText('topic').first()).toBeVisible({ timeout: 10000 })
  })
  
  test('open create topic modal', async ({ page }) => {
    await page.goto('/#/services/sns')
    await page.waitForTimeout(2000)
    
    await page.locator('.flex-shrink-0 button').filter({ hasText: 'Create Topic' }).click()
    await page.waitForTimeout(1000)
    
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
  })
})