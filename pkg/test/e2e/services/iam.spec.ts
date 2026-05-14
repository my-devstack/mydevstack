import { test, expect } from '../fixtures.js'

test.setTimeout(120000)

async function switchTab(page: any, tabName: string) {
  await page.goto('/#/services/iam')
  await page.waitForLoadState('networkidle')
  await page.getByRole('tab', { name: tabName }).click()
  await expect(page.getByRole('tab', { name: tabName })).toBeVisible()
}

async function createUser(page: any, userName: string) {
  await page.goto('/#/services/iam')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('button', { name: 'Create User' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Create User' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  await page.getByPlaceholder('username').fill(userName)
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 })
}

async function createRole(page: any, roleName: string) {
  await switchTab(page, 'Roles')
  await expect(page.getByRole('button', { name: 'Create Role' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Create Role' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  await page.getByPlaceholder('my-role').fill(roleName)
  await page.locator('textarea').first().fill(JSON.stringify({
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Principal: { Service: 'ec2.amazonaws.com' }, Action: 'sts:AssumeRole' }]
  }))
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 })
}

async function createGroup(page: any, groupName: string) {
  await switchTab(page, 'Groups')
  await expect(page.getByRole('button', { name: 'Create Group' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Create Group' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  await page.getByPlaceholder('my-group').fill(groupName)
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 })
}

async function createPolicy(page: any, policyName: string) {
  await switchTab(page, 'Policies')
  await page.waitForTimeout(1000)
  await expect(page.getByRole('button', { name: 'Create' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Create' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  await page.getByPlaceholder('MyPolicy').fill(policyName)
  await page.locator('textarea').first().fill(JSON.stringify({
    Version: '2012-10-17',
    Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'], Resource: '*' }]
  }))
  await page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 30000 })
}

test.describe('IAM - Users', () => {
  test('create user and verify in list', async ({ page }) => {
    const userName = 'test-user-' + Date.now()
    await createUser(page, userName)
    await expect(page.getByText(userName).first()).toBeVisible({ timeout: 30000 })
  })

  test('delete user', async ({ page }) => {
    const userName = 'test-user-del-' + Date.now()
    await createUser(page, userName)
    const userRow = page.locator('.rounded-lg').filter({ hasText: userName }).first()
    await userRow.locator('button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(userName).first()).not.toBeVisible({ timeout: 30000 })
  })

  test('expand user row and see access keys section', async ({ page }) => {
    const userName = 'test-user-expand-' + Date.now()
    await createUser(page, userName)
    const userRow = page.locator('.rounded-lg').filter({ hasText: userName }).first()
    await userRow.locator('h3').click()
    await expect(page.getByRole('button', { name: 'Create Key' })).toBeVisible({ timeout: 15000 })
  })

  test('create access key for user', async ({ page }) => {
    const userName = 'test-user-key-' + Date.now()
    await createUser(page, userName)
    const userRow = page.locator('.rounded-lg').filter({ hasText: userName }).first()
    await userRow.locator('h3').click()
    await page.getByRole('button', { name: 'Create Key' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('IAM - Roles', () => {
  test('create role and verify in list', async ({ page }) => {
    const roleName = 'test-role-' + Date.now()
    await createRole(page, roleName)
    await expect(page.getByText(roleName).first()).toBeVisible({ timeout: 30000 })
  })

  test('delete role', async ({ page }) => {
    const roleName = 'test-role-del-' + Date.now()
    await createRole(page, roleName)
    const roleRow = page.locator('.rounded-lg').filter({ hasText: roleName }).first()
    await roleRow.locator('button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(roleName).first()).not.toBeVisible({ timeout: 30000 })
  })

  test('expand role row and see attach policy button', async ({ page }) => {
    const roleName = 'test-role-expand-' + Date.now()
    await createRole(page, roleName)
    const roleRow = page.locator('.rounded-lg').filter({ hasText: roleName }).first()
    await roleRow.locator('h3').click()
    await expect(page.getByRole('button', { name: 'Attach Policy' })).toBeVisible({ timeout: 15000 })
  })

  test('open attach policy modal', async ({ page }) => {
    const roleName = 'test-role-attach-' + Date.now()
    await createRole(page, roleName)
    const roleRow = page.locator('.rounded-lg').filter({ hasText: roleName }).first()
    await roleRow.locator('h3').click()
    await page.getByRole('button', { name: 'Attach Policy' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('IAM - Policies', () => {
  test('create policy and verify in list', async ({ page }) => {
    const policyName = 'test-policy-' + Date.now()
    await createPolicy(page, policyName)
    await expect(page.getByText(policyName).first()).toBeVisible({ timeout: 30000 })
  })

  test('delete policy', async ({ page }) => {
    const policyName = 'test-policy-del-' + Date.now()
    await createPolicy(page, policyName)
    await expect(page.getByText(policyName).first()).toBeVisible({ timeout: 30000 })
    const policyRow = page.locator('.rounded-lg').filter({ hasText: policyName }).first()
    await policyRow.locator('button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(policyName).first()).not.toBeVisible({ timeout: 30000 })
  })

  test('expand policy row', async ({ page }) => {
    const policyName = 'test-policy-expand-' + Date.now()
    await createPolicy(page, policyName)
    const policyRow = page.locator('.rounded-lg').filter({ hasText: policyName }).first()
    await policyRow.locator('h3').click()
    await expect(policyRow.getByText('Name', { exact: true })).toBeVisible({ timeout: 15000 })
  })
})

test.describe('IAM - Groups', () => {
  test('create group and verify in list', async ({ page }) => {
    const groupName = 'test-group-' + Date.now()
    await createGroup(page, groupName)
    await expect(page.getByText(groupName).first()).toBeVisible({ timeout: 30000 })
  })

  test('delete group', async ({ page }) => {
    const groupName = 'test-group-del-' + Date.now()
    await createGroup(page, groupName)
    const groupRow = page.locator('.rounded-lg').filter({ hasText: groupName }).first()
    await groupRow.locator('button').first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText(groupName).first()).not.toBeVisible({ timeout: 30000 })
  })

  test('expand group row and see add user button', async ({ page }) => {
    const groupName = 'test-group-expand-' + Date.now()
    await createGroup(page, groupName)
    const groupRow = page.locator('.rounded-lg').filter({ hasText: groupName }).first()
    await groupRow.locator('h3').click()
    await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible({ timeout: 15000 })
  })

  test('open add user to group modal', async ({ page }) => {
    const userName = 'test-user-for-group-' + Date.now()
    const groupName = 'test-group-adduser-' + Date.now()
    await createUser(page, userName)
    await createGroup(page, groupName)
    const groupRow = page.locator('.rounded-lg').filter({ hasText: groupName }).first()
    await groupRow.locator('h3').click()
    await page.getByRole('button', { name: 'Add User' }).click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 })
  })
})

test.describe('IAM - Usage Examples', () => {
  test('usage examples section visible', async ({ page }) => {
    await page.goto('/#/services/iam')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Usage Examples' })).toBeVisible()
  })
})

test.describe('IAM - Navigation', () => {
  test('navigate to IAM and verify page loads', async ({ page }) => {
    await page.goto('/#/services/iam')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'IAM Management' })).toBeVisible({ timeout: 15000 })
  })

  test('switch between all tabs', async ({ page }) => {
    await page.goto('/#/services/iam')
    await page.waitForLoadState('networkidle')
    await page.getByRole('tab', { name: 'Roles' }).click()
    await expect(page.getByRole('tab', { name: 'Roles' })).toBeVisible()
    await page.getByRole('tab', { name: 'Policies' }).click()
    await expect(page.getByRole('tab', { name: 'Policies' })).toBeVisible()
    await page.getByRole('tab', { name: 'Groups' }).click()
    await expect(page.getByRole('tab', { name: 'Groups' })).toBeVisible()
    await page.getByRole('tab', { name: 'Users' }).click()
    await expect(page.getByRole('tab', { name: 'Users' })).toBeVisible()
  })

  test('create button shows on Users tab', async ({ page }) => {
    await page.goto('/#/services/iam')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('button', { name: 'Create User' }).first()).toBeVisible({ timeout: 10000 })
  })
})