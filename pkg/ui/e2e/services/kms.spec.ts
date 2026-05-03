import { test, expect } from '../fixtures.js'

// Helper function to create a KMS key
async function createKey(page: any, description: string) {
  await page.goto('/#/services/kms')
  await page.waitForLoadState('networkidle')

  // Click the Create Key button in the header
  await page.locator('button:has-text("Create Key")').first().click()

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 })
  await page.getByPlaceholder('Key description').fill(description)

  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()

  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
}

test.describe('KMS', () => {
  test('navigate to service', async ({ page }) => {
    await page.goto('http://localhost:3000/#/services/kms')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toContainText('KMS', { timeout: 10000 })
  })

  test('create key and verify in list', async ({ page }) => {
    const keyDescription = 'test-key-' + Date.now()

    await createKey(page, keyDescription)

    // Verify key appears in list
    await expect(page.locator('div.border.rounded-lg').first()).toBeVisible({ timeout: 15000 })
  })

  test('open encrypt modal and encrypt data', async ({ page }) => {
    const keyDescription = 'test-encrypt-' + Date.now()
    const plaintext = 'Hello KMS'

    await createKey(page, keyDescription)

    // Wait for list to populate
    await expect(page.locator('div.border.rounded-lg').first()).toBeVisible({ timeout: 15000 })

    // Click encrypt button
    await page.locator('button[title="Encrypt"]').first().click()

    // Verify modal
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await page.getByPlaceholder('Enter text to encrypt...').fill(plaintext)
    await page.getByRole('dialog').getByRole('button', { name: 'Encrypt' }).click()

    // Verify result
    await expect(page.getByText('Encrypted Result')).toBeVisible({ timeout: 5000 })
  })

  test('open decrypt modal and decrypt data', async ({ page }) => {
    const keyDescription = 'test-decrypt-' + Date.now()
    const plaintext = 'Test data'
    let ciphertext = ''

    await createKey(page, keyDescription)

    // Wait for list and encrypt to get ciphertext
    await expect(page.locator('div.border.rounded-lg').first()).toBeVisible({ timeout: 15000 })

    // Encrypt
    await page.locator('button[title="Encrypt"]').first().click()

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await page.getByPlaceholder('Enter text to encrypt...').fill(plaintext)
    await page.getByRole('dialog').getByRole('button', { name: 'Encrypt' }).click()

    // Get ciphertext from the result div
    const resultDiv = page.locator('.space-y-2').filter({ hasText: 'Encrypted Result' })
    await expect(resultDiv.locator('.font-mono')).toBeVisible({ timeout: 5000 })
    ciphertext = await resultDiv.locator('.font-mono').textContent() || ''

    // Close encrypt modal by clicking outside or pressing escape
    await page.keyboard.press('Escape')

    // Open decrypt modal
    await page.locator('button[title="Decrypt"]').first().click()

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await page.getByPlaceholder('Enter ciphertext to decrypt...').fill(ciphertext)
    await page.getByRole('dialog').getByRole('button', { name: 'Decrypt' }).click()

    await expect(page.getByText('Decrypted Result')).toBeVisible({ timeout: 5000 })
  })

  test('expand key and verify metadata', async ({ page }) => {
    const keyDescription = 'test-details-' + Date.now()

    await createKey(page, keyDescription)

    await expect(page.locator('div.border.rounded-lg').first()).toBeVisible({ timeout: 15000 })

    // Click to expand the first key
    await page.locator('div.border.rounded-lg').first().locator('.grid.grid-cols-12').click()

    // Verify inline details and policy (use heading role to avoid strict mode)
    await expect(page.getByRole('heading', { name: 'Key Details' })).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Key Policy' })).toBeVisible({ timeout: 5000 })
  })

  test('delete key - schedule deletion', async ({ page }) => {
    const keyDescription = 'test-delete-' + Date.now()

    await createKey(page, keyDescription)

    await expect(page.locator('div.border.rounded-lg').first()).toBeVisible({ timeout: 15000 })

    // Click delete button
    await page.locator('button[title="Delete"]').first().click()

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Schedule Key Deletion' })).toBeVisible({ timeout: 5000 })

    await page.getByRole('dialog').getByRole('button', { name: 'Schedule Deletion' }).click()

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 })
  })
})