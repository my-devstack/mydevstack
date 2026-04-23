import { describe, it, expect, vi } from 'vitest'
import { useConnectionStatus } from '@/composables/useConnectionStatus'
import { SERVICE_COLORS } from '@/types/serviceRegistry'

vi.mock('@/composables/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    status: vi.fn().mockReturnValue({
      isConnected: true,
      endpoint: 'http://localhost:4566',
      lastChecked: new Date(),
    }),
    checkConnection: vi.fn().mockResolvedValue({
      isConnected: true,
      endpoint: 'http://localhost:4566',
    }),
  }),
}))

vi.mock('@/composables/useServiceRegistry', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useServiceRegistry: () => ({
      quickStats: [
        { name: 'S3 Buckets', value: 5, icon: 'ArchiveBoxIcon', route: '/services/s3', serviceId: 's3', loading: false, color: 'text-orange-500', bgColor: 'bg-orange-500' },
        { name: 'Lambda Functions', value: 3, icon: 'BoltIcon', route: '/services/lambda', serviceId: 'lambda', loading: false, color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
      ],
      allServices: [
        { id: 's3', name: 'S3', icon: 'ArchiveBoxIcon', count: 5, status: 'healthy', loading: false, color: 'text-orange-500', bgColor: 'bg-orange-500' },
        { id: 'lambda', name: 'Lambda', icon: 'BoltIcon', count: 3, status: 'healthy', loading: false, color: 'text-yellow-500', bgColor: 'bg-yellow-500' },
      ],
      isLoading: vi.fn().mockReturnValue(false),
      lastChecked: vi.fn().mockReturnValue(new Date()),
      fetchStats: vi.fn().mockResolvedValue(undefined),
    }),
  }
})

describe('Dashboard integration', () => {
  it('should import useServiceRegistry composable', async () => {
    const { useServiceRegistry } = await import('@/composables/useServiceRegistry')
    expect(useServiceRegistry).toBeDefined()
  })

  it('should import useConnectionStatus composable', async () => {
    const { useConnectionStatus } = await import('@/composables/useConnectionStatus')
    expect(useConnectionStatus).toBeDefined()
  })

  it('should import service types', async () => {
    const { determineStatus } = await import('@/types/serviceRegistry')
    expect(SERVICE_COLORS).toBeDefined()
    expect(determineStatus).toBeDefined()
    expect(determineStatus(0)).toBe('warning')
    expect(determineStatus(5)).toBe('healthy')
    expect(determineStatus(0, true)).toBe('error')
  })

  it('should export SERVICE_COLORS from useServiceRegistry', async () => {
    const { SERVICE_COLORS: exportedColors } = await import('@/composables/useServiceRegistry')
    expect(exportedColors).toBeDefined()
    expect(exportedColors.s3).toBeDefined()
    expect(exportedColors.lambda).toBeDefined()
  })

  it('should have SERVICE_COLORS with correct structure', async () => {
    expect(SERVICE_COLORS.s3).toEqual({ text: 'text-orange-500', bg: 'bg-orange-500' })
    expect(SERVICE_COLORS.lambda).toEqual({ text: 'text-yellow-500', bg: 'bg-yellow-500' })
    expect(SERVICE_COLORS.dynamodb).toEqual({ text: 'text-blue-500', bg: 'bg-blue-500' })
  })

  it('should have icon constants in SERVICE_COLORS', () => {
    expect(SERVICE_COLORS).toHaveProperty('s3')
    expect(SERVICE_COLORS).toHaveProperty('lambda')
    expect(SERVICE_COLORS).toHaveProperty('dynamodb')
    expect(SERVICE_COLORS).toHaveProperty('sqs')
    expect(SERVICE_COLORS).toHaveProperty('sns')
    expect(SERVICE_COLORS).toHaveProperty('iam')
  })
})