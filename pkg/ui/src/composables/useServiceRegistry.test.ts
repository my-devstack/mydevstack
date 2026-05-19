import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useServiceRegistry, SERVICE_CONFIGS, ENABLED_SERVICES } from '@/composables/useServiceRegistry'

vi.mock('@/api/services/s3', () => ({
  listBuckets: vi.fn(),
}))

vi.mock('@/api/services/lambda', () => ({
  listFunctions: vi.fn(),
}))

vi.mock('@/api/services/dynamodb', () => ({
  listTables: vi.fn(),
}))

vi.mock('@/api/services/sqs', () => ({
  listQueues: vi.fn(),
}))

vi.mock('@/api/services/sns', () => ({
  listTopics: vi.fn(),
}))

vi.mock('@/api/services/iam', () => ({
  listUsers: vi.fn(),
}))

vi.mock('@/api/services/rds', () => ({
  describeDBInstances: vi.fn(),
}))

vi.mock('@/api/services/api-gateway', () => ({
  getRestApis: vi.fn(),
}))

vi.mock('@/api/services/kinesis', () => ({
  listStreams: vi.fn(),
}))

vi.mock('@/api/services/kms', () => ({
  listKeys: vi.fn(),
}))

vi.mock('@/api/services/secrets-manager', () => ({
  listSecrets: vi.fn(),
}))

vi.mock('@/api/services/elasticache', () => ({
  describeReplicationGroups: vi.fn(),
}))

vi.mock('@/api/services/opensearch', () => ({
  listDomainNames: vi.fn(),
}))

vi.mock('@/api/services/msk', () => ({
  listClustersV2: vi.fn(),
}))

vi.mock('@/api/services/ses', () => ({
  listEmailIdentities: vi.fn(),
}))

vi.mock('@/api/services/ssm', () => ({
  describeParameters: vi.fn(),
}))

vi.mock('@/api/services/cloudwatch', () => ({
  describeAlarms: vi.fn(),
}))

const mockEmulator = { value: '' }
vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    get emulator() { return mockEmulator.value },
  })),
}))

import { useSettingsStore } from '@/stores/settings'

import * as s3Api from '@/api/services/s3'
import * as lambdaApi from '@/api/services/lambda'
import * as dynamodbApi from '@/api/services/dynamodb'
import * as sqsApi from '@/api/services/sqs'
import * as snsApi from '@/api/services/sns'
import * as iamApi from '@/api/services/iam'
import * as rdsApi from '@/api/services/rds'
import * as apigwApi from '@/api/services/api-gateway'
import * as kinesisApi from '@/api/services/kinesis'
import * as kmsApi from '@/api/services/kms'
import * as secretsApi from '@/api/services/secrets-manager'
import * as elasticacheApi from '@/api/services/elasticache'
import * as ssmApi from '@/api/services/ssm'
import * as cwApi from '@/api/services/cloudwatch'

describe('useServiceRegistry', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // Set default mocks for all API calls
    vi.mocked(s3Api.listBuckets).mockResolvedValue([{ Name: 'bucket1' }])
    vi.mocked(lambdaApi.listFunctions).mockResolvedValue({ Functions: [{ FunctionName: 'fn1' }] })
    vi.mocked(dynamodbApi.listTables).mockResolvedValue({ TableNames: ['table1'] })
    vi.mocked(sqsApi.listQueues).mockResolvedValue(['queue1'])
    vi.mocked(snsApi.listTopics).mockResolvedValue([{ TopicArn: 'topic1' }])
    vi.mocked(iamApi.listUsers).mockResolvedValue({ Users: [{ UserName: 'user1' }] })
    vi.mocked(rdsApi.describeDBInstances).mockResolvedValue([{ DBInstanceIdentifier: 'db1' }])
    vi.mocked(apigwApi.getRestApis).mockResolvedValue({ Items: [{ Id: 'api1' }] })
    vi.mocked(kinesisApi.listStreams).mockResolvedValue({ StreamNames: ['stream1'] })
    vi.mocked(kmsApi.listKeys).mockResolvedValue({ Keys: [{ KeyId: 'key1' }] })
    vi.mocked(secretsApi.listSecrets).mockResolvedValue({ SecretList: [{ Name: 'secret1' }] })
    vi.mocked(elasticacheApi.describeReplicationGroups).mockResolvedValue([{ ReplicationGroupId: 'rg1' }])
    vi.mocked(ssmApi.describeParameters).mockResolvedValue({ Parameters: [{ Name: 'param1' }] })
    vi.mocked(cwApi.describeAlarms).mockResolvedValue({ MetricAlarms: [{ AlarmName: 'alarm1' }] })
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

  describe('fetchStats', () => {
    it('fetches stats for all enabled services', async () => {
      const { fetchStats, stats, isLoading, quickStats, allServices } = useServiceRegistry()

      await fetchStats()

      expect(isLoading.value).toBe(false)
      expect(stats.value.size).toBe(SERVICE_CONFIGS.length)
      // S3 should have count 1 (from mock)
      expect(stats.value.get('s3')?.count).toBe(1)
      expect(stats.value.get('s3')?.status).toBe('healthy')
      expect(stats.value.get('ec2')?.count).toBe(0)
      expect(stats.value.get('ec2')?.status).toBe('healthy')
    })

    it('quickStats reflects fetched stats', async () => {
      const { fetchStats, quickStats } = useServiceRegistry()

      await fetchStats()

      const s3Stat = quickStats.value.find(s => s.serviceId === 's3')
      expect(s3Stat).toBeDefined()
      expect(s3Stat!.value).toBe(1)
      expect(s3Stat!.loading).toBe(false)
    })

    it('allServices reflects fetched stats', async () => {
      const { fetchStats, allServices } = useServiceRegistry()

      await fetchStats()

      const s3Service = allServices.value.find(s => s.id === 's3')
      expect(s3Service).toBeDefined()
      expect(s3Service!.count).toBe(1)
      expect(s3Service!.loading).toBe(false)
    })

    it('handles API errors gracefully', async () => {
      vi.mocked(s3Api.listBuckets).mockRejectedValue(new Error('S3 error'))

      const { fetchStats, stats } = useServiceRegistry()

      await fetchStats()

      expect(stats.value.get('s3')?.status).toBe('error')
      expect(stats.value.get('s3')?.count).toBe(0)
      expect(stats.value.get('s3')?.loading).toBe(false)
    })

    it('lastChecked is set after fetch', async () => {
      const { fetchStats, lastChecked } = useServiceRegistry()

      await fetchStats()

      expect(lastChecked.value).toBeInstanceOf(Date)
    })

    it('fetchStats skips MSK and OpenSearch on ministack', async () => {
      mockEmulator.value = 'ministack'
      const { fetchStats, stats } = useServiceRegistry()

      await fetchStats()

      // MSK and OpenSearch should be skipped (count 0, status unknown)
      expect(stats.value.get('msk')?.status).toBe('unknown')
      expect(stats.value.get('msk')?.count).toBe(0)
      expect(stats.value.get('opensearch')?.status).toBe('unknown')
      expect(stats.value.get('opensearch')?.count).toBe(0)
      // Other services should still be fetched
      expect(stats.value.get('s3')?.status).toBe('healthy')
      expect(stats.value.get('s3')?.count).toBe(1)
      mockEmulator.value = ''
    })
  })

  describe('fetchServiceStats', () => {
    it('fetches stats for a specific service', async () => {
      const { fetchServiceStats, stats } = useServiceRegistry()

      const result = await fetchServiceStats('s3')

      expect(result).not.toBeNull()
      expect(result!.count).toBe(1)
      expect(result!.status).toBe('healthy')
      expect(stats.value.get('s3')?.count).toBe(1)
    })

    it('returns null for unknown service', async () => {
      const { fetchServiceStats } = useServiceRegistry()

      const result = await fetchServiceStats('unknown')

      expect(result).toBeNull()
    })

    it('handles API error', async () => {
      vi.mocked(s3Api.listBuckets).mockRejectedValue(new Error('S3 error'))

      const { fetchServiceStats } = useServiceRegistry()

      const result = await fetchServiceStats('s3')

      expect(result).not.toBeNull()
      expect(result!.status).toBe('error')
      expect(result!.count).toBe(0)
    })

    it('fetchServiceStats skips MSK on ministack', async () => {
      mockEmulator.value = 'ministack'
      const { fetchServiceStats, stats } = useServiceRegistry()

      const result = await fetchServiceStats('msk')

      expect(result).not.toBeNull()
      expect(result!.status).toBe('unknown')
      expect(result!.count).toBe(0)
      expect(stats.value.get('msk')?.status).toBe('unknown')
      mockEmulator.value = ''
    })
  })

  describe('quickStats computed', () => {
    it('returns empty stats when nothing fetched', () => {
      const { quickStats } = useServiceRegistry()
      expect(quickStats.value.length).toBeGreaterThan(0)
      quickStats.value.forEach(stat => {
        expect(stat.value).toBe(0)
        expect(stat.loading).toBe(false)
      })
    })
  })

  describe('allServices computed', () => {
    it('returns unknown status when nothing fetched', () => {
      const { allServices } = useServiceRegistry()
      allServices.value.forEach(service => {
        expect(service.status).toBe('unknown')
      })
    })
  })
})