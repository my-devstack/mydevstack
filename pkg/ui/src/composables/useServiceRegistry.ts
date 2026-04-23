import { ref, computed } from 'vue'
import { listBuckets as fetchS3Buckets } from '@/api/services/s3'
import { listFunctions as fetchLambdaFunctions } from '@/api/services/lambda'
import { listTables as fetchDynamoDBTables } from '@/api/services/dynamodb'
import { listQueues as fetchSQSQueues } from '@/api/services/sqs'
import { listTopics as fetchSNSTopics } from '@/api/services/sns'
import { listUsers, listRoles } from '@/api/services/iam'
import type { ServiceCategory } from '@/types/services'
import { SERVICE_COLORS, type ServiceStats, type ServiceStatus, determineStatus } from '@/types/serviceRegistry'

export interface ServiceConfig {
  id: string
  name: string
  category: ServiceCategory
  icon: string
  route: string
  color: string
  bgColor: string
  statsFetcher: () => Promise<number>
  enabled?: boolean
}

const SERVICE_CONFIGS: ServiceConfig[] = [
  {
    id: 's3',
    name: 'S3 Buckets',
    category: 'storage',
    icon: 'ArchiveBoxIcon',
    route: '/services/s3',
    color: SERVICE_COLORS.s3.text,
    bgColor: SERVICE_COLORS.s3.bg,
    statsFetcher: async () => {
      const result = await fetchS3Buckets()
      return result.length
    },
    enabled: true,
  },
  {
    id: 'lambda',
    name: 'Lambda Functions',
    category: 'compute',
    icon: 'BoltIcon',
    route: '/services/lambda',
    color: SERVICE_COLORS.lambda.text,
    bgColor: SERVICE_COLORS.lambda.bg,
    statsFetcher: async () => {
      const result = await fetchLambdaFunctions()
      return result.Functions?.length || 0
    },
    enabled: true,
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB Tables',
    category: 'database',
    icon: 'TableCellsIcon',
    route: '/services/dynamodb',
    color: SERVICE_COLORS.dynamodb.text,
    bgColor: SERVICE_COLORS.dynamodb.bg,
    statsFetcher: async () => {
      const result = await fetchDynamoDBTables()
      return result.TableNames?.length || 0
    },
    enabled: true,
  },
  {
    id: 'sqs',
    name: 'SQS Queues',
    category: 'messaging',
    icon: 'QueueListIcon',
    route: '/services/sqs',
    color: SERVICE_COLORS.sqs.text,
    bgColor: SERVICE_COLORS.sqs.bg,
    statsFetcher: async () => {
      const result = await fetchSQSQueues()
      return result.length || 0
    },
    enabled: true,
  },
  {
    id: 'sns',
    name: 'SNS Topics',
    category: 'messaging',
    icon: 'MegaphoneIcon',
    route: '/services/sns',
    color: SERVICE_COLORS.sns.text,
    bgColor: SERVICE_COLORS.sns.bg,
    statsFetcher: async () => {
      const result = await fetchSNSTopics()
      return result.length || 0
    },
    enabled: true,
  },
  {
    id: 'iam',
    name: 'IAM Users',
    category: 'security',
    icon: 'UserGroupIcon',
    route: '/services/iam',
    color: SERVICE_COLORS.iam.text,
    bgColor: SERVICE_COLORS.iam.bg,
    statsFetcher: async () => {
      const [users, roles] = await Promise.all([fetchUsers(), fetchRoles()])
      return (users.Users?.length || 0) + (roles.Roles?.length || 0)
    },
    enabled: true,
  },
  {
    id: 'ec2',
    name: 'EC2',
    category: 'compute',
    icon: 'ServerIcon',
    route: '/services/ec2',
    color: SERVICE_COLORS.ec2.text,
    bgColor: SERVICE_COLORS.ec2.bg,
    statsFetcher: async () => 0,
  },
  {
    id: 'rds',
    name: 'RDS',
    category: 'database',
    icon: 'DatabaseIcon',
    route: '/services/rds',
    color: SERVICE_COLORS.rds.text,
    bgColor: SERVICE_COLORS.rds.bg,
    statsFetcher: async () => 0,
  },
  {
    id: 'apigateway',
    name: 'API Gateway',
    category: 'networking',
    icon: 'GlobeAltIcon',
    route: '/services/apigateway',
    color: SERVICE_COLORS.apigateway.text,
    bgColor: SERVICE_COLORS.apigateway.bg,
    statsFetcher: async () => 0,
  },
  {
    id: 'kinesis',
    name: 'Kinesis',
    category: 'analytics',
    icon: 'WaveformIcon',
    route: '/services/kinesis',
    color: SERVICE_COLORS.kinesis.text,
    bgColor: SERVICE_COLORS.kinesis.bg,
    statsFetcher: async () => 0,
  },
  {
    id: 'kms',
    name: 'KMS',
    category: 'security',
    icon: 'KeyIcon',
    route: '/services/kms',
    color: SERVICE_COLORS.kms.text,
    bgColor: SERVICE_COLORS.kms.bg,
    statsFetcher: async () => 0,
  },
  {
    id: 'secretsmanager',
    name: 'Secrets Manager',
    category: 'security',
    icon: 'LockClosedIcon',
    route: '/services/secretsmanager',
    color: SERVICE_COLORS.secretsmanager.text,
    bgColor: SERVICE_COLORS.secretsmanager.bg,
    statsFetcher: async () => 0,
  },
  {
    id: 'elasticache',
    name: 'ElastiCache',
    category: 'database',
    icon: 'ServerIcon',
    route: '/services/elasticache',
    color: SERVICE_COLORS.elasticache.text,
    bgColor: SERVICE_COLORS.elasticache.bg,
    statsFetcher: async () => 0,
  },
  {
    id: 'ssm',
    name: 'SSM',
    category: 'parameters',
    icon: 'Cog6ToothIcon',
    route: '/services/ssm',
    color: SERVICE_COLORS.ssm.text,
    bgColor: SERVICE_COLORS.ssm.bg,
    statsFetcher: async () => 0,
  },
]

const ENABLED_SERVICES = SERVICE_CONFIGS.filter(s => s.enabled)

export function useServiceRegistry() {
  const services = ref<ServiceConfig[]>(SERVICE_CONFIGS)
  const stats = ref<Map<string, ServiceStats>>(new Map())
  const isLoading = ref(false)
  const lastChecked = ref<Date | null>(null)

  const quickStats = computed(() => {
    return ENABLED_SERVICES.map(service => {
      const stat = stats.value.get(service.id)
      return {
        name: service.name,
        value: stat?.count ?? 0,
        icon: service.icon,
        route: service.route,
        serviceId: service.id,
        loading: stat?.loading ?? false,
        color: service.color,
        bgColor: service.bgColor,
      }
    })
  })

  const allServices = computed(() => {
    return SERVICE_CONFIGS.map(service => {
      const stat = stats.value.get(service.id)
      return {
        id: service.id,
        name: service.name,
        icon: service.icon,
        count: stat?.count ?? 0,
        status: stat?.status ?? 'unknown' as ServiceStatus,
        loading: stat?.loading ?? false,
        color: service.color,
        bgColor: service.bgColor,
      }
    })
  })

  async function fetchStats(): Promise<void> {
    isLoading.value = true

    for (const service of services.value) {
      stats.value.set(service.id, {
        serviceId: service.id,
        count: 0,
        status: 'unknown',
        loading: true,
      })
    }

    for (const service of services.value) {
      if (!service.enabled) {
        stats.value.set(service.id, {
          serviceId: service.id,
          count: 0,
          status: 'unknown',
          loading: false,
        })
        continue
      }

      try {
        const count = await service.statsFetcher()
        stats.value.set(service.id, {
          serviceId: service.id,
          count,
          status: determineStatus(count),
          loading: false,
        })
      } catch {
        stats.value.set(service.id, {
          serviceId: service.id,
          count: 0,
          status: 'error',
          loading: false,
        })
      }
    }

    isLoading.value = false
    lastChecked.value = new Date()
  }

  async function fetchServiceStats(serviceId: string): Promise<ServiceStats | null> {
    const service = services.value.find(s => s.id === serviceId)
    if (!service) return null

    if (!service.enabled) {
      return { serviceId, count: 0, status: 'unknown', loading: false }
    }

    try {
      const count = await service.statsFetcher()
      const result = {
        serviceId,
        count,
        status: determineStatus(count),
        loading: false,
      }
      stats.value.set(serviceId, result)
      return result
    } catch {
      return { serviceId, count: 0, status: 'error', loading: false }
    }
  }

  function getService(id: string): ServiceConfig | undefined {
    return services.value.find(s => s.id === id)
  }

  function getServicesByCategory(category: ServiceCategory): ServiceConfig[] {
    return services.value.filter(s => s.category === category)
  }

  function getEnabledServices(): ServiceConfig[] {
    return ENABLED_SERVICES
  }

  return {
    services,
    stats,
    isLoading,
    lastChecked,
    quickStats,
    allServices,
    fetchStats,
    fetchServiceStats,
    getService,
    getServicesByCategory,
    getEnabledServices,
  }
}

export { SERVICE_CONFIGS, ENABLED_SERVICES, SERVICE_COLORS }
export default useServiceRegistry