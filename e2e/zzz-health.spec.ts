import { test, expect } from './fixtures.js'

test.describe('Health Endpoint', () => {
  test('should return latestVersion and githubRepo', async ({ request }) => {
    const proxyURL = process.env.PROXY_URL || 'http://localhost:8081'

    // Wait for server to be ready
    await new Promise(r => setTimeout(r, 5000))

    // Retry a few times in case server is still starting
    let response
    for (let i = 0; i < 10; i++) {
      response = await request.get(`${proxyURL}/health`)
      if (response.ok()) break
      console.log(`Health check attempt ${i+1} failed, retrying...`)
      await new Promise(r => setTimeout(r, 2000))
    }

    expect(response.ok()).toBe(true)

    const data = await response.json()

    // Verify latestVersion field exists
    expect(data).toHaveProperty('latestVersion')
    // latestVersion can be empty string if GitHub API fails or no releases
    expect(typeof data.latestVersion).toBe('string')

    // Verify github_repo field exists
    expect(data).toHaveProperty('github_repo')
    expect(typeof data.github_repo).toBe('string')
    expect(data.github_repo).toBeTruthy()
  })

  test('health endpoint should be accessible', async ({ request }) => {
    const proxyURL = process.env.PROXY_URL || 'http://localhost:8081'

    // Wait for server to be ready
    await new Promise(r => setTimeout(r, 5000))

    // Retry a few times in case server is still starting
    let response
    for (let i = 0; i < 10; i++) {
      response = await request.get(`${proxyURL}/health`)
      if (response.ok()) break
      console.log(`Health check attempt ${i+1} failed, retrying...`)
      await new Promise(r => setTimeout(r, 2000))
    }

    expect(response.status()).toBe(200)
  })
})