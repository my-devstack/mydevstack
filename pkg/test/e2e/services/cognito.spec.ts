import { test, expect } from '../fixtures.js'

async function showAllItems(page: any) {
  const showLabel = page.getByText('Show:')
  if (await showLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    const perPageSelect = showLabel.locator('..').locator('select')
    await perPageSelect.selectOption('50')
    await page.waitForTimeout(300)
  }
}

async function createUserPool(page: any, poolName: string) {
  await page.goto('/#/services/cognito')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Create User Pool' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  const dialog = page.getByRole('dialog')
  const nameInput = dialog.locator('input[type="text"]').first()
  await expect(nameInput).toBeVisible({ timeout: 5000 })
  await nameInput.fill(poolName)
  const responsePromise = page.waitForResponse(
    (resp: any) => resp.url().includes('/user-pools') && resp.request().method() === 'POST',
    { timeout: 15000 }
  ).catch(() => null)
  await dialog.getByRole('button', { name: 'Create' }).click()
  await responsePromise
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  await showAllItems(page)
}

async function selectPoolOnTab(page: any, tabName: string, poolName: string) {
  await page.getByRole('tab', { name: new RegExp(tabName, 'i') }).click()
  await page.waitForLoadState('networkidle')
  const poolSelect = page.locator('label', { hasText: 'User Pool:' }).locator('..').locator('select')
  await expect(poolSelect).toBeVisible({ timeout: 10000 })
  await page.waitForLoadState('networkidle')
  const responsePromise = page.waitForResponse(
    (resp: any) => resp.url().includes('/cognito/user-pools/') &&
      (resp.url().includes('/groups') || resp.url().includes('/users') || resp.url().includes('/resource-servers') || resp.url().includes('/clients')) &&
      resp.status() === 200,
    { timeout: 15000 }
  ).catch(() => null)
  await poolSelect.selectOption({ label: poolName })
  await responsePromise
  await page.waitForLoadState('networkidle')
}

test.describe('Cognito - Navigation', () => {
  test('navigate to Cognito and verify page loads', async ({ page }) => {
    await page.goto('/#/services/cognito')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Cognito Management' })).toBeVisible({ timeout: 15000 })
  })

  test('switch between all tabs', async ({ page }) => {
    await page.goto('/#/services/cognito')
    await page.waitForLoadState('networkidle')

    await page.getByRole('tab', { name: 'User Pools' }).click()
    await expect(page.getByRole('tab', { name: 'User Pools' })).toBeVisible()

    await page.getByRole('tab', { name: 'Users' }).click()
    await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible()

    await page.getByRole('tab', { name: 'Groups' }).click()
    await expect(page.getByRole('tab', { name: 'Groups' })).toBeVisible()

    await page.getByRole('tab', { name: 'Clients' }).click()
    await expect(page.getByRole('tab', { name: 'Clients' })).toBeVisible()

    await page.getByRole('tab', { name: 'Resource Servers' }).click()
    await expect(page.getByRole('tab', { name: 'Resource Servers' })).toBeVisible()
  })
})

test.describe('Cognito - User Pools', () => {
  test('create user pool and verify in list', async ({ page }) => {
    const poolName = 'test-pool-' + Date.now()
    await createUserPool(page, poolName)
    await expect(page.getByText(poolName).first()).toBeVisible({ timeout: 15000 })
  })

  test('delete user pool', async ({ page }) => {
    const poolName = 'test-pool-del-' + Date.now()
    await createUserPool(page, poolName)
    const poolRow = page.locator('.rounded-lg').filter({ hasText: poolName }).first()
    // Delete is 2nd button (Edit=0, Delete=1)
    await poolRow.locator('button').nth(1).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(poolName).first()).not.toBeVisible({ timeout: 15000 })
  })

  test('expand user pool row and see details', async ({ page }) => {
    test.setTimeout(60000)
    const poolName = 'test-pool-expand-' + Date.now()
    await createUserPool(page, poolName)
    const poolRow = page.locator('.rounded-lg').filter({ hasText: poolName }).first()
    await poolRow.getByRole('heading', { name: poolName }).click()
    await page.waitForTimeout(500)
    await expect(poolRow.locator('label').filter({ hasText: 'Id' })).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Cognito - Users', () => {
  test('create user after selecting pool', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-users-' + Date.now()
    const userName = 'test-user-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Users', poolName)

    const createBtn = page.getByRole('button', { name: /Create User/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(userName)
    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/users') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await responsePromise
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByText(userName).first()).toBeVisible({ timeout: 15000 })
  })

  test('delete user', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-udelete-' + Date.now()
    const userName = 'test-user-del-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Users', poolName)

    const createBtn = page.getByRole('button', { name: /Create User/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(userName)
    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/users') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await responsePromise
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    const userRow = page.locator('.rounded-lg').filter({ hasText: userName }).first()
    // Delete is 4th button (Edit=0, ResetPassword=1, TestLogin=2, Delete=3)
    await userRow.locator('button').nth(3).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(userName).first()).not.toBeVisible({ timeout: 15000 })
  })

  test('expand user row and see details', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-uexpand-' + Date.now()
    const userName = 'test-user-expand-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Users', poolName)

    const createBtn = page.getByRole('button', { name: /Create User/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(userName)
    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/users') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await responsePromise
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    const userRow = page.locator('.rounded-lg').filter({ hasText: userName }).first()
    await userRow.getByRole('heading', { name: userName }).click()
    await page.waitForTimeout(500)
    await expect(userRow.locator('label').filter({ hasText: 'Status' })).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Cognito - Groups', () => {
  test('create group after selecting pool', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-groups-' + Date.now()
    const groupName = 'test-group-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Groups', poolName)

    const createBtn = page.getByRole('button', { name: /Create Group/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(groupName)
    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/groups') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await responsePromise
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByText(groupName).first()).toBeVisible({ timeout: 15000 })
  })

  test('delete group', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-gdelete-' + Date.now()
    const groupName = 'test-group-del-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Groups', poolName)

    const createBtn = page.getByRole('button', { name: /Create Group/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(groupName)
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/groups') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    const groupRow = page.locator('.rounded-lg').filter({ hasText: groupName }).first()
    // Delete is 3rd button (Edit=0, Members=1, Delete=2)
    await groupRow.locator('button').nth(2).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(groupName).first()).not.toBeVisible({ timeout: 15000 })
  })

  test('expand group row and see details', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-gexpand-' + Date.now()
    const groupName = 'test-group-expand-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Groups', poolName)

    const createBtn = page.getByRole('button', { name: /Create Group/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(groupName)
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/groups') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    const groupRow = page.locator('.rounded-lg').filter({ hasText: groupName }).first()
    await groupRow.getByRole('heading', { name: groupName }).click()
    await page.waitForTimeout(500)
    await expect(groupRow.locator('label').filter({ hasText: 'Description' })).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Cognito - Clients', () => {
  test('create client and verify in list', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-clients-' + Date.now()
    const clientName = 'test-client-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Clients', poolName)

    const createBtn = page.getByRole('button', { name: /Create Client/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(clientName)
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/clients') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByText(clientName).first()).toBeVisible({ timeout: 15000 })
  })

  test('delete client', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-cdelete-' + Date.now()
    const clientName = 'test-client-del-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Clients', poolName)

    const createBtn = page.getByRole('button', { name: /Create Client/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(clientName)
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/clients') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    const clientRow = page.locator('.rounded-lg').filter({ hasText: clientName }).first()
    // Delete is 2nd button (Edit=0, Delete=1)
    await clientRow.locator('button').nth(1).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(clientName).first()).not.toBeVisible({ timeout: 15000 })
  })
})

test.describe('Cognito - Resource Servers', () => {
  test('create resource server and verify in list', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-rs-' + Date.now()
    const rsIdentifier = 'test-api-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Resource Servers', poolName)

    const createBtn = page.getByRole('button', { name: /Create Resource Server/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const inputs = dialog.locator('input[type="text"]')
    await inputs.nth(0).fill(rsIdentifier)
    await inputs.nth(1).fill('Test API')
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/resource-servers') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
    await expect(page.getByText(rsIdentifier).first()).toBeVisible({ timeout: 15000 })
  })

  test('delete resource server', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-rsdel-' + Date.now()
    const rsIdentifier = 'test-api-del-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Resource Servers', poolName)

    const createBtn = page.getByRole('button', { name: /Create Resource Server/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const inputs = dialog.locator('input[type="text"]')
    await inputs.nth(0).fill(rsIdentifier)
    await inputs.nth(1).fill('Test API Del')
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/resource-servers') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    const rsRow = page.locator('.rounded-lg').filter({ hasText: rsIdentifier }).first()
    // Delete is the only button in row (index 0)
    await rsRow.locator('button').nth(0).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(rsIdentifier).first()).not.toBeVisible({ timeout: 15000 })
  })
})

test.describe('Cognito - Group Membership', () => {
  test('add user to group and remove', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-members-' + Date.now()
    const userName = 'test-user-member-' + Date.now()
    const groupName = 'test-group-member-' + Date.now()

    // Create pool + user
    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Users', poolName)
    const createUserBtn = page.getByRole('button', { name: /Create User/i }).first()
    await expect(createUserBtn).toBeVisible({ timeout: 10000 })
    await createUserBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(userName)
    const userResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/users') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await userResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Create group
    await selectPoolOnTab(page, 'Groups', poolName)
    const createGroupBtn = page.getByRole('button', { name: /Create Group/i }).first()
    await expect(createGroupBtn).toBeVisible({ timeout: 10000 })
    await createGroupBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const groupDialog = page.getByRole('dialog')
    const groupNameInput = groupDialog.locator('input[type="text"]').first()
    await expect(groupNameInput).toBeVisible({ timeout: 5000 })
    await groupNameInput.fill(groupName)
    const groupResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/groups') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await groupDialog.getByRole('button', { name: 'Create' }).click()
    await groupResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Click Members on group row — icon-only button, use nth(1) (Edit=0, Members=1)
    const groupRow = page.locator('.rounded-lg').filter({ hasText: groupName }).first()
    const membersBtn = groupRow.locator('button').nth(1)
    await expect(membersBtn).toBeVisible({ timeout: 10000 })
    await membersBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    // Add user to group
    const addBtn = page.getByRole('dialog').getByRole('button', { name: /Add/i }).first()
    await expect(addBtn).toBeVisible({ timeout: 5000 })
    const userSelect = page.getByRole('dialog').locator('select')
    if (await userSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userSelect.selectOption({ label: userName })
    } else {
      const userInput = page.getByRole('dialog').locator('input[type="text"]').first()
      if (await userInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userInput.fill(userName)
      }
    }
    await addBtn.click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(userName).first()).toBeVisible({ timeout: 10000 })

    // Remove user from group
    const removeBtn = page.getByRole('dialog').getByRole('button', { name: /Remove/i }).first()
    if (await removeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await removeBtn.click()
      await page.waitForLoadState('networkidle')
    }
    // Close modal
    const closeBtn = page.getByRole('dialog').getByRole('button', { name: /Close|Cancel|X/i }).first()
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click()
    }
  })
})

test.describe('Cognito - Reset Password', () => {
  test('reset user password via modal', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-resetpw-' + Date.now()
    const userName = 'test-user-resetpw-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Users', poolName)

    // Create user
    const createBtn = page.getByRole('button', { name: /Create User/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const createDialog = page.getByRole('dialog')
    const nameInput = createDialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(userName)
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/users') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await createDialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Click Reset Password on user row — icon-only button, nth(1) (Edit=0, ResetPassword=1)
    const userRow = page.locator('.rounded-lg').filter({ hasText: userName }).first()
    const resetBtn = userRow.locator('button').nth(1)
    await expect(resetBtn).toBeVisible({ timeout: 10000 })
    await resetBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    // Enter new password — use password input
    const resetDialog = page.getByRole('dialog')
    const pwInput = resetDialog.locator('input[type="password"]').first()
    await expect(pwInput).toBeVisible({ timeout: 5000 })
    await pwInput.fill('NewPass123!')
    const resetResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/password') && resp.request().method() === 'PUT',
      { timeout: 15000 }
    ).catch(() => null)
    await resetDialog.getByRole('button', { name: /Confirm|Save|Update|Reset Password/i }).first().click()
    await resetResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  })
})

test.describe('Cognito - Test Login', () => {
  test('test login for user and verify tokens', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-login-' + Date.now()
    const userName = 'test-user-login-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Users', poolName)

    // Create user
    const createBtn = page.getByRole('button', { name: /Create User/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const createDialog = page.getByRole('dialog')
    const nameInput = createDialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(userName)
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/users') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await createDialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Create a user pool client (required for test login)
    await selectPoolOnTab(page, 'Clients', poolName)
    const createClientBtn = page.getByRole('button', { name: /Create Client/i }).first()
    await expect(createClientBtn).toBeVisible({ timeout: 10000 })
    await createClientBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const clientDialog = page.getByRole('dialog')
    const clientNameInput = clientDialog.locator('input[type="text"]').first()
    await expect(clientNameInput).toBeVisible({ timeout: 5000 })
    await clientNameInput.fill('test-client-' + Date.now())
    await clientDialog.getByRole('button', { name: 'Create' }).click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Go back to Users tab
    await page.getByRole('tab', { name: 'Users' }).click()
    await page.waitForLoadState('networkidle')

    // Set password first (via Reset Password) — icon-only button, nth(1)
    const userRow = page.locator('.rounded-lg').filter({ hasText: userName }).first()
    const resetBtn = userRow.locator('button').nth(1)
    await expect(resetBtn).toBeVisible({ timeout: 10000 })
    await resetBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const resetDialog = page.getByRole('dialog')
    const pwInput = resetDialog.locator('input[type="password"]').first()
    await expect(pwInput).toBeVisible({ timeout: 5000 })
    await pwInput.fill('TestPass123!')
    const resetResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/password') && resp.request().method() === 'PUT',
      { timeout: 15000 }
    ).catch(() => null)
    await resetDialog.getByRole('button', { name: /Confirm|Save|Update|Reset Password/i }).first().click()
    await resetResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Click Test Login — icon-only button, nth(2) (Edit=0, ResetPassword=1, TestLogin=2)
    const testLoginBtn = userRow.locator('button').nth(2)
    await expect(testLoginBtn).toBeVisible({ timeout: 10000 })
    await testLoginBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    // Enter password and test
    const loginDialog = page.getByRole('dialog')

    // Select the client from dropdown
    const clientSelect = loginDialog.locator('select').first()
    await expect(clientSelect).toBeVisible({ timeout: 5000 })
    // Select the first (and only) client option (index 0 is "Select a client...")
    await clientSelect.selectOption({ index: 1 })

    const loginPwInput = loginDialog.locator('input[type="password"]').first()
    await expect(loginPwInput).toBeVisible({ timeout: 5000 })
    await loginPwInput.fill('TestPass123!')
    const authResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/admin-initiate-auth'),
      { timeout: 15000 }
    ).catch(() => null)
    await loginDialog.getByRole('button', { name: /Test|Login|Submit/i }).first().click()
    await authResponse
    await page.waitForLoadState('networkidle')

    // Verify tokens displayed
    await expect(page.getByText(/AccessToken|IdToken|access.token/i).first()).toBeVisible({ timeout: 15000 })

    // Close modal
    const closeBtn = page.getByRole('dialog').getByRole('button', { name: /Close|Cancel|X/i }).first()
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click()
    }
  })
})

test.describe('Cognito - Tags', () => {
  test('add tag in edit modal and verify persistence', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-tags-' + Date.now()
    const tagKey = 'Environment'
    const tagValue = 'qa'

    await createUserPool(page, poolName)

    // Click edit on the pool — icon-only button, nth(0) (Edit=0, Delete=1)
    const poolRow = page.locator('.rounded-lg').filter({ hasText: poolName }).first()
    const editBtn = poolRow.locator('button').nth(0)
    await expect(editBtn).toBeVisible({ timeout: 10000 })
    await editBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    // Add tag
    const keyInput = page.getByRole('dialog').getByPlaceholder(/key/i).first()
    const valueInput = page.getByRole('dialog').getByPlaceholder(/value/i).first()
    if (await keyInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await keyInput.fill(tagKey)
    }
    if (await valueInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await valueInput.fill(tagValue)
    }
    // Click Add button to persist tag (addRow + emitUpdate)
    const addTagBtn = page.getByRole('dialog').getByRole('button', { name: /Add/i }).first()
    await addTagBtn.click()
    await page.waitForLoadState('networkidle')

    // Save
    await page.getByRole('dialog').getByRole('button', { name: /Save|Update/i }).first().click()
    // Wait for pool update PUT
    await page.waitForResponse(
      (resp: any) => resp.url().includes('/user-pools') && resp.request().method() === 'PUT',
      { timeout: 15000 }
    ).catch(() => null)
    // Wait for tags PUT
    await page.waitForResponse(
      (resp: any) => resp.url().includes('/tags') && resp.request().method() === 'PUT',
      { timeout: 15000 }
    ).catch(() => null)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Re-open edit and verify tag persists
    await editBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const tagKeyInput = page.getByRole('dialog').locator('input[value="Environment"]')
    const tagValueInput = page.getByRole('dialog').locator('input[value="qa"]')
    await expect(tagKeyInput.first()).toBeVisible({ timeout: 10000 })
    await expect(tagValueInput.first()).toBeVisible({ timeout: 10000 })

    // Close
    const closeBtn = page.getByRole('dialog').getByRole('button', { name: /Close|Cancel|X/i }).first()
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click()
    }
  })
})

test.describe('Cognito - Edit Operations', () => {
  test('edit user pool modal opens with disabled name', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-edit-' + Date.now()

    await createUserPool(page, poolName)

    const poolRow = page.locator('.rounded-lg').filter({ hasText: poolName }).first()
    const editBtn = poolRow.locator('button').nth(0)
    await expect(editBtn).toBeVisible({ timeout: 10000 })
    await editBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    // Verify pool name input is disabled (Floci limitation)
    const nameInput = page.getByRole('dialog').locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await expect(nameInput).toBeDisabled()

    // Close modal
    await page.getByRole('dialog').getByRole('button', { name: /Cancel/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  })

  test('edit user attributes', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-uedit-' + Date.now()
    const userName = 'test-user-uedit-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Users', poolName)

    const createBtn = page.getByRole('button', { name: /Create User/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const createDialog = page.getByRole('dialog')
    const nameInput = createDialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(userName)
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/users') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await createDialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Edit user — icon-only button, nth(0)
    const userRow = page.locator('.rounded-lg').filter({ hasText: userName }).first()
    const editBtn = userRow.locator('button').nth(0)
    await expect(editBtn).toBeVisible({ timeout: 10000 })
    await editBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    // Change email
    const emailInput = page.getByRole('dialog').locator('input[type="text"]').first()
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.clear()
      await emailInput.fill('updated@example.com')
    }
    await page.getByRole('dialog').getByRole('button', { name: /Save|Update/i }).first().click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  })

  test('edit group description', async ({ page }) => {
    test.setTimeout(120000)
    const poolName = 'test-pool-gedit-' + Date.now()
    const groupName = 'test-group-gedit-' + Date.now()
    const newDesc = 'Updated description'

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Groups', poolName)

    const createBtn = page.getByRole('button', { name: /Create Group/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const createDialog = page.getByRole('dialog')
    const nameInput = createDialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(groupName)
    const createResponse = page.waitForResponse(
      (resp: any) => resp.url().includes('/groups') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await createDialog.getByRole('button', { name: 'Create' }).click()
    await createResponse
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    // Edit group — icon-only button, nth(0)
    const groupRow = page.locator('.rounded-lg').filter({ hasText: groupName }).first()
    const editBtn = groupRow.locator('button').nth(0)
    await expect(editBtn).toBeVisible({ timeout: 10000 })
    await editBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })

    const descInput = page.getByRole('dialog').locator('input[type="text"]').last()
    if (await descInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await descInput.clear()
      await descInput.fill(newDesc)
    }
    await page.getByRole('dialog').getByRole('button', { name: /Save|Update/i }).first().click()
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })
  })
})

test.describe('Cognito - Pagination', () => {
  test('show per-page selector on User Pools tab', async ({ page }) => {
    await page.goto('/#/services/cognito')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Show:').first()).toBeVisible()
    await expect(page.getByText('per page').first()).toBeVisible()
  })

  test('show per-page selector on Users tab', async ({ page }) => {
    test.setTimeout(60000)
    const poolName = 'test-pool-uperpage-' + Date.now()
    const userName = 'test-user-perpage-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Users', poolName)

    const createBtn = page.getByRole('button', { name: /Create User/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(userName)
    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/users') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await responsePromise
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    await expect(page.getByText('Show:').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('per page').first()).toBeVisible()
  })

  test('show per-page selector on Groups tab', async ({ page }) => {
    test.setTimeout(60000)
    const poolName = 'test-pool-gperpage-' + Date.now()
    const groupName = 'test-group-perpage-' + Date.now()

    await createUserPool(page, poolName)
    await selectPoolOnTab(page, 'Groups', poolName)

    const createBtn = page.getByRole('button', { name: /Create Group/i }).first()
    await expect(createBtn).toBeVisible({ timeout: 10000 })
    await createBtn.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    const dialog = page.getByRole('dialog')
    const nameInput = dialog.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })
    await nameInput.fill(groupName)
    const responsePromise = page.waitForResponse(
      (resp: any) => resp.url().includes('/groups') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await responsePromise
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15000 })

    await expect(page.getByText('Show:').first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('per page').first()).toBeVisible()
  })
})

test.describe('Cognito - Usage Examples', () => {
  test('usage examples section visible', async ({ page }) => {
    await page.goto('/#/services/cognito')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Usage Examples' })).toBeVisible()
  })
})
