import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { mockPost, mockGet } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
}))

vi.mock('../client', () => ({
  api: {
    post: mockPost,
    get: mockGet,
  },
}))

import { setRegion, getRegion } from './region'

describe('Region Service', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockPost.mockReset()
    mockGet.mockReset()
  })

  describe('setRegion', () => {
    it('posts region to backend', async () => {
      mockPost.mockResolvedValue({ data: { region: 'us-west-2', message: 'Region set' } })
      const result = await setRegion('us-west-2')
      expect(result.region).toBe('us-west-2')
      expect(result.message).toBe('Region set')
      expect(mockPost).toHaveBeenCalledWith('/proxy/region', { region: 'us-west-2' })
    })
  })

  describe('getRegion', () => {
    it('returns region from health endpoint', async () => {
      mockGet.mockResolvedValue({ data: { region: 'eu-central-1' } })
      const result = await getRegion()
      expect(result).toBe('eu-central-1')
      expect(mockGet).toHaveBeenCalledWith('/health')
    })

    it('returns default region when not provided', async () => {
      mockGet.mockResolvedValue({ data: {} })
      const result = await getRegion()
      expect(result).toBe('us-east-1')
    })
  })
})
