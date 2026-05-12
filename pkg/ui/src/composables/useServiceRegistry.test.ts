import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useServiceRegistry, SERVICE_CONFIGS, ENABLED_SERVICES } from '@/composables/useServiceRegistry'

vi.mock('@/api/services/s3', () => ({
  listBuckets: vi.fn().mockResolvedValue([{ Name: 'bucket1' }, { Name: 'bucket2' }]),
}))

vi.mock('@/api/services/lambda', () => ({
  listFunctions: vi.fn().mockResolvedValue({ Functions: [{ FunctionName: 'fn1' }, { FunctionName: 'fn2' }, { FunctionName: 'fn3' }] }),
}))

vi.mock('@/api/services/dynamodb', () => ({
  listTables: vi.fn().mockResolvedValue({ TableNames: ['table1'] }),
}))

vi.mock('@/api/services/sqs', () => ({
  listQueues: vi.fn().mockResolvedValue(['queue1', 'queue2', 'queue3', 'queue4']),
}))

vi.mock('@/api/services/sns', () => ({
  listTopics: vi.fn().mockResolvedValue([{ TopicArn: 'topic1' }]),
}))

vi.mock('@/api/services/iam', () => ({
  listUsers: vi.fn().mockResolvedValue({ Users: [{ UserName: 'user1' }] }),
}))

vi.mock('@/api/services/rds', () => ({
  describeDBInstances: vi.fn().mockResolvedValue([{ DBInstanceIdentifier: 'db1' }, { DBInstanceIdentifier: 'db2' }]),
}))

vi.mock('@/api/services/api-gateway', () => ({
  getRestApis: vi.fn().mockResolvedValue({ Items: [{ Id: 'api1' }] }),
}))

vi.mock('@/api/services/kinesis', () => ({
  listStreams: vi.fn().mockResolvedValue({ StreamNames: ['stream1', 'stream2'] }),
}))

vi.mock('@/api/services/kms', () => ({
  listKeys: vi.fn().mockResolvedValue({ Keys: [{ KeyId: 'key1' }] }),
}))

vi.mock('@/api/services/secrets-manager', () => ({
  listSecrets: vi.fn().mockResolvedValue({ SecretList: [{ Name: 'secret1' }, { Name: 'secret2' }, { Name: 'secret3' }] }),
}))

vi.mock('@/api/services/elasticache', () => ({
  describeReplicationGroups: vi.fn().mockResolvedValue([{ ReplicationGroupId: 'rg1' }]),
}))

vi.mock('@/api/services/ssm', () => ({
  describeParameters: vi.fn().mockResolvedValue({ Parameters: [{ Name: 'param1' }] }),
}))

describe('useServiceRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('service configurations', () => {
    it('should have all service configs defined', () => {
      expect(SERVICE_CONFIGS.length).toBeGreaterThan(0)
    })

    it('should have enabled services configured', () => {
      expect(ENABLED_SERVICES.length).toBeGreaterThan(0)
      ENABLED_SERVICES.forEach(service => {
        expect(service.enabled).toBe(true)
      })
    })

    it('should have valid service properties', () => {
      const s3Service = SERVICE_CONFIGS.find(s => s.id === 's3')
      expect(s3Service).toBeDefined()
      expect(s3Service?.name).toBe('S3 Buckets')
      expect(s3Service?.category).toBe('storage')
      expect(s3Service?.route).toBe('/services/s3')
      expect(s3Service?.color).toBeDefined()
      expect(s3Service?.bgColor).toBeDefined()
      expect(s3Service?.statsFetcher).toBeInstanceOf(Function)
    })
  })

  describe('useServiceRegistry composable', () => {
    it('should return services', () => {
      const { services } = useServiceRegistry()
      expect(services.value).toBeDefined()
      expect(services.value.length).toBeGreaterThan(0)
    })

    it('should return stats map', () => {
      const { stats } = useServiceRegistry()
      expect(stats.value).toBeInstanceOf(Map)
    })

    it('should return loading state', () => {
      const { isLoading } = useServiceRegistry()
      expect(isLoading.value).toBe(false)
    })

    it('should return lastChecked as null initially', () => {
      const { lastChecked } = useServiceRegistry()
      expect(lastChecked.value).toBeNull()
    })

    it('should return quickStats computed', () => {
      const { quickStats } = useServiceRegistry()
      expect(quickStats.value).toBeDefined()
      expect(Array.isArray(quickStats.value)).toBe(true)
    })

    it('should return allServices computed', () => {
      const { allServices } = useServiceRegistry()
      expect(allServices.value).toBeDefined()
      expect(Array.isArray(allServices.value)).toBe(true)
    })

    it('should have fetchStats function', () => {
      const { fetchStats } = useServiceRegistry()
      expect(fetchStats).toBeInstanceOf(Function)
    })

    it('should have fetchServiceStats function', () => {
      const { fetchServiceStats } = useServiceRegistry()
      expect(fetchServiceStats).toBeInstanceOf(Function)
    })

    it('should have getService function', () => {
      const { getService } = useServiceRegistry()
      expect(getService).toBeInstanceOf(Function)
    })

    it('should have getServicesByCategory function', () => {
      const { getServicesByCategory } = useServiceRegistry()
      expect(getServicesByCategory).toBeInstanceOf(Function)
    })

    it('should have getEnabledServices function', () => {
      const { getEnabledServices } = useServiceRegistry()
      expect(getEnabledServices).toBeInstanceOf(Function)
    })
  })

  describe('getService', () => {
    it('should return service by id', () => {
      const { getService } = useServiceRegistry()
      const s3Service = getService('s3')
      expect(s3Service).toBeDefined()
      expect(s3Service?.id).toBe('s3')
    })

    it('should return undefined for unknown service', () => {
      const { getService } = useServiceRegistry()
      const unknownService = getService('unknown')
      expect(unknownService).toBeUndefined()
    })
  })

  describe('getServicesByCategory', () => {
    it('should return services by category', () => {
      const { getServicesByCategory } = useServiceRegistry()
      const storageServices = getServicesByCategory('storage')
      expect(storageServices.length).toBeGreaterThan(0)
      storageServices.forEach(service => {
        expect(service.category).toBe('storage')
      })
    })

    it('should return empty array for unknown category', () => {
      const { getServicesByCategory } = useServiceRegistry()
      const unknownServices = getServicesByCategory('unknown' as any)
      expect(unknownServices).toEqual([])
    })
  })

  describe('getEnabledServices', () => {
    it('should return only enabled services', () => {
      const { getEnabledServices } = useServiceRegistry()
      const enabled = getEnabledServices()
      expect(enabled.length).toBe(ENABLED_SERVICES.length)
      enabled.forEach(service => {
        expect(service.enabled).toBe(true)
      })
    })
  })
})