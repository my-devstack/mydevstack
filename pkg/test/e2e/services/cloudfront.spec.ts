import { test, expect } from '../fixtures.js'

const PROXY_URL = process.env.PROXY_URL || 'http://localhost:8081'

test.describe.configure({ timeout: 10000 })

test.describe('CloudFront', () => {
  let bucketName: string
  let distributionId: string
  let objectKey: string
  let markerBody: string

  test.beforeEach(async ({ page }) => {
    const ts = Date.now()
    bucketName = `test-cf-${ts}`
    objectKey = 'index.html'
    markerBody = `hello-cloudfront-${ts}`

    // Seed bucket
    const bucketResp = await page.request.post(`${PROXY_URL}/s3/buckets`, {
      data: { Bucket: bucketName },
    })
    expect(bucketResp.status()).toBe(200)

    // Seed object
    const objResp = await page.request.post(`${PROXY_URL}/s3/buckets/${bucketName}/objects`, {
      data: { Key: objectKey, ContentType: 'text/html', Body: markerBody },
    })
    expect(objResp.status()).toBe(200)

    // Seed distribution
    const distResp = await page.request.post(`${PROXY_URL}/cloudfront/distributions`, {
      data: {
        Comment: `test-dist-${ts}`,
        Enabled: true,
        Origins: [
          {
            Id: `S3-${bucketName}`,
            DomainName: `${bucketName}.s3.amazonaws.com`,
            S3OriginConfig: { OriginAccessIdentity: '' },
          },
        ],
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
          CachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
          AllowedMethods: ['GET', 'HEAD'],
        },
        PriceClass: 'PriceClass_100',
      },
    })
    expect(distResp.status()).toBe(201)
    const distJson = await distResp.json()
    distributionId = distJson.Distribution.Id
  })

  test.afterEach(async ({ page }) => {
    // Delete distribution
    if (distributionId) {
      await page.request.delete(`${PROXY_URL}/cloudfront/distributions/${distributionId}`)
    }
    // Delete object
    if (bucketName && objectKey) {
      await page.request.delete(`${PROXY_URL}/s3/buckets/${bucketName}/objects/${objectKey}`)
    }
    // Delete bucket
    if (bucketName) {
      await page.request.delete(`${PROXY_URL}/s3/buckets/${bucketName}`)
    }
  })

  test('navigate to CloudFront page', async ({ page }) => {
    await page.goto('/#/services/cloudfront')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('main').getByRole('heading', { name: 'CloudFront', exact: true })).toBeVisible({ timeout: 10000 })
  })

  test('tabs visible', async ({ page }) => {
    await page.goto('/#/services/cloudfront')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('tab', { name: 'Distributions', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Invalidations', exact: true })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Origin Access', exact: true })).toBeVisible()
  })

  test('distribution visible after seed', async ({ page }) => {
    await page.goto('/#/services/cloudfront')
    await page.waitForLoadState('networkidle')

    // Set per-page to 50 if pagination exists
    const showSelect = page.getByText('Show:').locator('..').locator('select')
    if (await showSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showSelect.selectOption('50')
    }

    // Locate distribution by unique comment
    const distRow = page.locator('div.border.rounded-lg.overflow-hidden').filter({
      hasText: `test-dist-${bucketName.split('-').pop()}`,
    })
    await expect(distRow).toBeVisible({ timeout: 10000 })
  })

  test('distribution shows domain and local URL', async ({ page }) => {
    await page.goto('/#/services/cloudfront')
    await page.waitForLoadState('networkidle')

    const showSelect = page.getByText('Show:').locator('..').locator('select')
    if (await showSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showSelect.selectOption('50')
    }

    const distRow = page.locator('div.border.rounded-lg.overflow-hidden').filter({
      hasText: `test-dist-${bucketName.split('-').pop()}`,
    })

    // Domain shown (first font-mono span = domain, second = local URL)
    const domainSpan = distRow.locator('span.font-mono').first()
    await expect(domainSpan).toContainText(distributionId)

    // Local URL button exists
    const localUrlBtn = distRow.locator('button[title="Copy local viewer URL"]')
    await expect(localUrlBtn).toBeVisible()
  })

  test('static content fetch through CloudFront local URL', async ({ page }) => {
    // Wait for distribution to be deployed
    await page.waitForTimeout(2000)

    const localUrl = `http://${distributionId.toLowerCase()}.cloudfront.localhost.floci.io:4566/${objectKey}`
    const resp = await page.request.get(localUrl)
    expect(resp.status()).toBe(200)
    const body = await resp.text()
    expect(body).toContain(markerBody)
  })

  test('create invalidation', async ({ page }) => {
    await page.goto('/#/services/cloudfront')
    await page.waitForLoadState('networkidle')

    const showSelect = page.getByText('Show:').locator('..').locator('select')
    if (await showSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showSelect.selectOption('50')
    }

    const distRow = page.locator('div.border.rounded-lg.overflow-hidden').filter({
      hasText: `test-dist-${bucketName.split('-').pop()}`,
    })

    // Click Create Invalidation button
    await distRow.locator('button[title="Create Invalidation"]').click()

    // Wait for dialog
    const dialog = page.getByRole('dialog', { name: 'Create Invalidation' })
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Fill paths (textarea has placeholder "/*", no label)
    await dialog.getByPlaceholder('/*').fill('/*')

    // Submit
    await dialog.getByRole('button', { name: 'Create' }).click()

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 10000 })

    // Switch to Invalidations tab
    await page.getByRole('tab', { name: 'Invalidations', exact: true }).click()
    await page.waitForLoadState('networkidle')

    // Invalidation should appear (may take a moment)
    await page.waitForTimeout(1000)
    await expect(page.getByText('Completed').first()).toBeVisible({ timeout: 10000 })
  })

  test('delete distribution', async ({ page }) => {
    await page.goto('/#/services/cloudfront')
    await page.waitForLoadState('networkidle')

    const showSelect = page.getByText('Show:').locator('..').locator('select')
    if (await showSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showSelect.selectOption('50')
    }

    const distRow = page.locator('div.border.rounded-lg.overflow-hidden').filter({
      hasText: `test-dist-${bucketName.split('-').pop()}`,
    })

    // Click Delete button
    await distRow.locator('button[title="Delete Distribution"]').click()

    // Wait for delete dialog
    const dialog = page.getByRole('dialog', { name: 'Delete Distribution' })
    await expect(dialog).toBeVisible({ timeout: 5000 })

    // Confirm delete
    await dialog.getByRole('button', { name: 'Delete' }).click()

    // Wait for dialog to close and list to refresh
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Distribution should no longer be visible
    await expect(distRow).not.toBeVisible({ timeout: 5000 })

    // Mark as deleted so afterEach doesn't try to delete again
    distributionId = ''
  })
})
