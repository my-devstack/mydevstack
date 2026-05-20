import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConnectionStatus, connectionStatus, checkConnection, startMonitoring, stopMonitoring, getEndpoint } from './useConnectionStatus'
import { useSettingsStore } from '@/stores/settings'

// Mock config
vi.mock('@/config', () => ({
  PROXY_BACKEND: 'http://127.0.0.1:8081'
}))

// Mock fetch globally
global.fetch = vi.fn()

// Mock setInterval and clearInterval
vi.useFakeTimers()

describe('useConnectionStatus', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.resetAllMocks()
  })

  describe('connectionStatus', () => {
    it('should have default status', () => {
      expect(connectionStatus.value).toBeDefined()
      expect(connectionStatus.value.isConnected).toBe(false)
      expect(connectionStatus.value.isReachable).toBe(false)
      expect(connectionStatus.value.lastChecked).toBeNull()
    })

    it('should have default endpoint', () => {
      expect(connectionStatus.value.endpoint).toBe('http://127.0.0.1:8081')
    })
  })

  describe('getEndpoint', () => {
    it('should return proxy backend URL', () => {
      expect(getEndpoint()).toBe('http://127.0.0.1:8081')
    })
  })

  describe('checkConnection', () => {
    it('should return true when health endpoint responds', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ region: 'us-east-1' })
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      const result = await checkConnection()
      expect(result).toBe(true)
      expect(connectionStatus.value.isConnected).toBe(true)
      expect(connectionStatus.value.isReachable).toBe(true)
    })

    it('should return true when S3 endpoint responds', async () => {
      const healthResponse = { ok: false, status: 500 }
      const s3Response = { ok: true }
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce(healthResponse)
        .mockResolvedValueOnce(s3Response)

      const result = await checkConnection()
      expect(result).toBe(true)
    })

    it('should return true when Lambda endpoint responds', async () => {
      const healthResponse = { ok: false, status: 500 }
      const s3Response = { ok: false, status: 500 }
      const lambdaResponse = { ok: true }
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce(healthResponse)
        .mockResolvedValueOnce(s3Response)
        .mockResolvedValueOnce(lambdaResponse)

      const result = await checkConnection()
      expect(result).toBe(true)
    })

    it('should return false when all endpoints fail', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await checkConnection()
      expect(result).toBe(false)
      expect(connectionStatus.value.isConnected).toBe(false)
      expect(connectionStatus.value.isReachable).toBe(false)
    })

    it('should update lastChecked on connection check', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({}) }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)

      await checkConnection()
      expect(connectionStatus.value.lastChecked).toBeInstanceOf(Date)
    })

    it('should succeed when health returns status 403 (unauthorized)', async () => {
      const response403 = { ok: false, status: 403, json: vi.fn().mockResolvedValue({}) }
      global.fetch = vi.fn().mockResolvedValue(response403)
      const result = await checkConnection()
      expect(result).toBe(true)
    })

    it('should succeed when health returns status 404', async () => {
      const response404 = { ok: false, status: 404, json: vi.fn().mockResolvedValue({}) }
      global.fetch = vi.fn().mockResolvedValue(response404)
      const result = await checkConnection()
      expect(result).toBe(true)
    })

    it('should succeed when first strategy throws but S3 succeeds', async () => {
      const s3Response = { ok: true, json: vi.fn().mockResolvedValue({}) }
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('health fail'))
        .mockResolvedValueOnce(s3Response)
      const result = await checkConnection()
      expect(result).toBe(true)
    })

    it('should succeed when health returns opaque type', async () => {
      const opaqueResponse = { ok: false, status: 0, type: 'opaque', json: vi.fn().mockResolvedValue({}) }
      global.fetch = vi.fn().mockResolvedValue(opaqueResponse)
      const result = await checkConnection()
      expect(result).toBe(true)
    })

    it('should sync region from backend when region differs', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.region = 'eu-west-1'
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ region: 'us-east-1' })
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      await checkConnection()
      expect(settingsStore.region).toBe('us-east-1')
    })

    it('should set MINISTACK emulator and us-east-1 region', async () => {
      const settingsStore = useSettingsStore()
      settingsStore.region = 'eu-west-1'
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ region: 'eu-west-1', target: 'http://localhost:4566', emulator: 'MINISTACK' })
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      await checkConnection()
      expect(settingsStore.region).toBe('us-east-1')
      expect(settingsStore.emulator).toBe('MINISTACK')
    })

    it('should set non-MINISTACK emulator without changing region', async () => {
      const settingsStore = useSettingsStore()
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ region: 'us-east-1', emulator: 'FLOCI' })
      }
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      await checkConnection()
      expect(settingsStore.emulator).toBe('FLOCI')
    })
  })

  describe('startMonitoring', () => {
    it('should set hasStartedMonitoring flag', () => {
      startMonitoring()
      expect(connectionStatus.value.lastChecked).not.toBeNull()
    })

    it('should not restart if already monitoring', () => {
      startMonitoring()
      const lastChecked = connectionStatus.value.lastChecked
      
      // Call again should not re-run
      startMonitoring()
      expect(connectionStatus.value.lastChecked).toEqual(lastChecked)
    })
  })

  describe('stopMonitoring', () => {
    it('should stop monitoring', () => {
      startMonitoring()
      stopMonitoring()
      expect(connectionStatus.value.lastChecked).not.toBeNull()
    })

    it('should be safe to call when not monitoring', () => {
      // Should not throw when checkInterval is null
      expect(() => stopMonitoring()).not.toThrow()
    })
  })

  describe('useConnectionStatus', () => {
    it('should return status as computed', () => {
      const { status } = useConnectionStatus()
      expect(status).toBeDefined()
      expect(typeof status.value).toBe('object')
    })

    it('should return isConnected as computed', () => {
      const { isConnected } = useConnectionStatus()
      expect(isConnected).toBeDefined()
      expect(typeof isConnected.value).toBe('boolean')
    })

    it('should return checkConnection function', () => {
      const { checkConnection: check } = useConnectionStatus()
      expect(typeof check).toBe('function')
    })

    it('should return startMonitoring and stopMonitoring functions', () => {
      const { startMonitoring: start, stopMonitoring: stop } = useConnectionStatus()
      expect(typeof start).toBe('function')
      expect(typeof stop).toBe('function')
    })
  })
})