import { test, expect } from '../fixtures'

test.describe('DynamoDB', () => {
  test('navigate via sidebar button', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
    
    await page.locator('button:has-text("DynamoDB")').first().click()
    await page.waitForTimeout(1000)
    
    await expect(page.getByRole('main').locator('h1')).toContainText('DynamoDB', { timeout: 10000 })
  })
  
  test('navigate directly to route', async ({ page }) => {
    await page.goto('/#/services/dynamodb')
    await page.waitForTimeout(2000)
    
    await expect(page.getByRole('main').locator('h1')).toContainText('DynamoDB', { timeout: 10000 })
  })
  
  test('load table list', async ({ page }) => {
    await page.goto('/#/services/dynamodb')
    await page.waitForTimeout(3000)
    
    const h1 = page.getByRole('main').locator('h1')
    await expect(h1).toContainText('DynamoDB', { timeout: 10000 })
    
    await expect(page.getByRole('button', { name: '+ Create Table' })).toBeVisible({ timeout: 10000 })
  })
  
  test('open create table modal', async ({ page }) => {
    await page.goto('/#/services/dynamodb')
    await page.waitForTimeout(2000)
    
    await page.getByRole('button', { name: '+ Create Table' }).click()
    await page.waitForTimeout(1000)
    
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('input').first()).toBeVisible()
  })
})