import { ref, computed } from 'vue'
import { listBuckets as fetchS3Buckets } from '@/api/services/s3'
import { listFunctions as fetchLambdaFunctions } from '@/api/services/lambda'
import { listTables as fetchDynamoDBTables } from '@/api/services/dynamodb'
import { listQueues as fetchSQSQueues } from '@/api/services/sqs'
import { listTopics as fetchSNSTopics } from '@/api/services/sns'
import { listEmailIdentities as fetchSESIdentities } from '@/api/services/ses'
import { listUsers } from '@/api/services/iam'
import { describeDBInstances as fetchRDSInstances } from '@/api/services/rds'
import { getRestApis as fetchAPIGatewayRestApis } from '@/api/services/api-gateway'
import { listStreams as fetchKinesisStreams } from '@/api/services/kinesis'
import { listClustersV2 as fetchMSKClusters } from '@/api/services/msk'
import { listKeys as fetchKMSKeys } from '@/api/services/kms'
import { listSecrets as fetchSecrets } from '@/api/services/secrets-manager'
import { describeReplicationGroups as fetchElastiCacheGroups } from '@/api/services/elasticache'
import { listDomainNames as fetchOpenSearchDomains } from '@/api/services/opensearch'
import { describeParameters as fetchSSMParameters } from '@/api/services/ssm'
import { describeAlarms as fetchCWAlarms } from '@/api/services/cloudwatch'
import { listUserPools as fetchCognitoUserPools } from '@/api/services/cognito'
import { listClusters as fetchECSClusters } from '@/api/services/ecs'
import { listRepositories as fetchECRRepositories } from '@/api/services/ecr'
import { listStateMachines as fetchStepFunctionsStateMachines } from '@/api/services/stepfunctions'
import { listStacks as fetchCloudFormationStacks } from '@/api/services/cloudformation'
import { useSettingsStore } from '@/stores/settings'
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
    id: 'ses',
    name: 'SES Identities',
    category: 'messaging',
    icon: 'EnvelopeIcon',
    route: '/services/ses',
    color: SERVICE_COLORS.ses.text,
    bgColor: SERVICE_COLORS.ses.bg,
    statsFetcher: async () => {
      const result = await fetchSESIdentities()
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
      const result = await listUsers()
      return result.Users?.length || 0
    },
    enabled: true,
  },
  {
    id: 'ec2',
    name: 'EC2 Instances',
    category: 'compute',
    icon: 'ServerIcon',
    route: '/services/ec2',
    color: SERVICE_COLORS.ec2.text,
    bgColor: SERVICE_COLORS.ec2.bg,
    statsFetcher: async () => 0,
    enabled: true,
  },
  {
    id: 'vpc',
    name: 'VPC',
    category: 'networking',
    icon: 'Squares2X2Icon',
    route: '/services/vpc',
    color: SERVICE_COLORS.vpc.text,
    bgColor: SERVICE_COLORS.vpc.bg,
    statsFetcher: async () => 0,
    enabled: true,
  },
  {
    id: 'rds',
    name: 'RDS Instances',
    category: 'database',
    icon: 'DatabaseIcon',
    route: '/services/rds',
    color: SERVICE_COLORS.rds.text,
    bgColor: SERVICE_COLORS.rds.bg,
    statsFetcher: async () => {
      const result = await fetchRDSInstances()
      return result.length
    },
    enabled: true,
  },
  {
    id: 'apigateway',
    name: 'API Gateway APIs',
    category: 'networking',
    icon: 'GlobeAltIcon',
    route: '/services/apigateway',
    color: SERVICE_COLORS.apigateway.text,
    bgColor: SERVICE_COLORS.apigateway.bg,
    statsFetcher: async () => {
      const result = await fetchAPIGatewayRestApis()
      return result.Items?.length || 0
    },
    enabled: true,
  },
  {
    id: 'kinesis',
    name: 'Kinesis Streams',
    category: 'analytics',
    icon: 'WaveformIcon',
    route: '/services/kinesis',
    color: SERVICE_COLORS.kinesis.text,
    bgColor: SERVICE_COLORS.kinesis.bg,
    statsFetcher: async () => {
      const result = await fetchKinesisStreams()
      return result.StreamNames?.length || 0
    },
    enabled: true,
  },
  {
    id: 'msk',
    name: 'MSK Clusters',
    category: 'analytics',
    icon: 'WaveformIcon',
    route: '/services/msk',
    color: SERVICE_COLORS.msk.text,
    bgColor: SERVICE_COLORS.msk.bg,
    statsFetcher: async () => {
      const result = await fetchMSKClusters()
      return result.ClusterInfoList?.length || 0
    },
    enabled: true,
  },
  {
    id: 'kms',
    name: 'KMS Keys',
    category: 'security',
    icon: 'KeyIcon',
    route: '/services/kms',
    color: SERVICE_COLORS.kms.text,
    bgColor: SERVICE_COLORS.kms.bg,
    statsFetcher: async () => {
      const result = await fetchKMSKeys()
      return result.Keys?.length || 0
    },
    enabled: true,
  },
  {
    id: 'secretsmanager',
    name: 'Secrets Manager Secrets',
    category: 'security',
    icon: 'LockClosedIcon',
    route: '/services/secretsmanager',
    color: SERVICE_COLORS.secretsmanager.text,
    bgColor: SERVICE_COLORS.secretsmanager.bg,
    statsFetcher: async () => {
      const result = await fetchSecrets()
      return result.SecretList?.length || 0
    },
    enabled: true,
  },
  {
    id: 'elasticache',
    name: 'ElastiCache Replication Groups',
    category: 'database',
    icon: 'ServerIcon',
    route: '/services/elasticache',
    color: SERVICE_COLORS.elasticache.text,
    bgColor: SERVICE_COLORS.elasticache.bg,
    statsFetcher: async () => {
      const result = await fetchElastiCacheGroups()
      return result.length
    },
    enabled: true,
  },
  {
    id: 'opensearch',
    name: 'OpenSearch Domains',
    category: 'analytics',
    icon: 'MagnifyingGlassIcon',
    route: '/services/opensearch',
    color: SERVICE_COLORS.opensearch.text,
    bgColor: SERVICE_COLORS.opensearch.bg,
    statsFetcher: async () => {
      const result = await fetchOpenSearchDomains()
      return result.length
    },
    enabled: true,
  },
  {
    id: 'cloudwatch',
    name: 'CloudWatch Alarms',
    category: 'monitoring',
    icon: 'ChartBarIcon',
    route: '/services/cloudwatch',
    color: SERVICE_COLORS.cloudwatch.text,
    bgColor: SERVICE_COLORS.cloudwatch.bg,
    statsFetcher: async () => {
      const result = await fetchCWAlarms()
      return result.MetricAlarms?.length || 0
    },
    enabled: true,
  },
  {
    id: 'cognito',
    name: 'Cognito User Pools',
    category: 'security',
    icon: 'UserCircleIcon',
    route: '/services/cognito',
    color: SERVICE_COLORS.cognito.text,
    bgColor: SERVICE_COLORS.cognito.bg,
    statsFetcher: async () => {
      const result = await fetchCognitoUserPools()
      return result.UserPools?.length || 0
    },
    enabled: true,
  },
  {
    id: 'ssm',
    name: 'SSM Parameters',
    category: 'parameters',
    icon: 'Cog6ToothIcon',
    route: '/services/ssm',
    color: SERVICE_COLORS.ssm.text,
    bgColor: SERVICE_COLORS.ssm.bg,
    statsFetcher: async () => {
      const result = await fetchSSMParameters()
      return result.Parameters?.length || 0
    },
    enabled: true,
  },
  {
    id: 'ecs',
    name: 'ECS Clusters',
    category: 'compute',
    icon: 'ServerIcon',
    route: '/services/ecs',
    color: SERVICE_COLORS.ecs.text,
    bgColor: SERVICE_COLORS.ecs.bg,
    statsFetcher: async () => {
      const result = await fetchECSClusters()
      return result.ClusterArns?.length || 0
    },
    enabled: true,
  },
  {
    id: 'ecr',
    name: 'ECR Repositories',
    category: 'storage',
    icon: 'ArchiveBoxIcon',
    route: '/services/ecr',
    color: SERVICE_COLORS.ecr.text,
    bgColor: SERVICE_COLORS.ecr.bg,
    statsFetcher: async () => {
      const result = await fetchECRRepositories()
      return result.Repositories?.length || 0
    },
    enabled: true,
  },
  {
    id: 'stepfunctions',
    name: 'Step Functions',
    category: 'analytics',
    icon: 'CircleStackIcon',
    route: '/services/stepfunctions',
    color: SERVICE_COLORS.stepfunctions.text,
    bgColor: SERVICE_COLORS.stepfunctions.bg,
    statsFetcher: async () => {
      const result = await fetchStepFunctionsStateMachines()
      return result.StateMachines?.length || 0
    },
    enabled: true,
  },
  {
    id: 'cloudformation',
    name: 'CloudFormation Stacks',
    category: 'analytics',
    icon: 'CloudIcon',
    route: '/services/cloudformation',
    color: SERVICE_COLORS.cloudformation.text,
    bgColor: SERVICE_COLORS.cloudformation.bg,
    statsFetcher: async () => {
      const result = await fetchCloudFormationStacks()
      return result.length || 0
    },
    enabled: true,
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

      // Skip API calls for MSK and OpenSearch on ministack
      const settingsStore = useSettingsStore()
      if (settingsStore.emulator && settingsStore.emulator.toLowerCase() === 'ministack' &&
          (service.id === 'msk' || service.id === 'opensearch')) {
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

    // Skip API calls for MSK and OpenSearch on ministack
    const settingsStore = useSettingsStore()
    if (settingsStore.emulator && settingsStore.emulator.toLowerCase() === 'ministack' &&
        (service.id === 'msk' || service.id === 'opensearch')) {
      const result = { serviceId, count: 0, status: 'unknown' as ServiceStatus, loading: false }
      stats.value.set(serviceId, result)
      return result
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