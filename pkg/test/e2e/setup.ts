import { test as setup } from '@playwright/test'

setup('wait for services', async ({ page }) => {
  const baseURL = process.env.BASE_URL || 'http://localhost:3000'
  const proxyURL = process.env.PROXY_URL || 'http://localhost:8081'
  const maxRetries = 30
  let retries = 0

  while (retries < maxRetries) {
    try {
      const response = await page.request.get(`${proxyURL}/health`)
      if (response.ok()) {
        console.log('Services ready')
        return
      }
    } catch {
      // Services not ready yet
    }
    retries++
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  throw new Error('Services did not become ready in time')
})