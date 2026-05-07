import { test, expect } from './fixtures'

test.describe('Health Endpoint', () => {
  test('should return latestVersion and githubRepo', async ({ request }) => {
    const proxyURL = process.env.PROXY_URL || 'http://localhost:8081'
    
    const response = await request.get(`${proxyURL}/health`)
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
    
    const response = await request.get(`${proxyURL}/health`)
    expect(response.status()).toBe(200)
  })
})