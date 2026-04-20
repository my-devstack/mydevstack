<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useConnectionStatus } from '@/composables/useConnectionStatus'
import ServiceCard from '@/components/layout/ServiceCard.vue'
import DataTable from '@/components/common/DataTable.vue'
import type { Service } from '@/types/services'

// Import service APIs
import { listBuckets } from '@/api/services/s3'
import { listFunctions } from '@/api/services/lambda'
import { listTables } from '@/api/services/dynamodb'
import { listQueues } from '@/api/services/sqs'
import { listTopics } from '@/api/services/sns'
import { listUsers, listRoles } from '@/api/services/iam'

const router = useRouter()
const settingsStore = useSettingsStore()
const { status: connectionStatus, checkConnection } = useConnectionStatus()

// Types
interface ServiceStats {
  name: string
  value: number
  icon: string
  route: string
  serviceId: string
  loading: boolean
}

interface ActivityItem {
  id: string
  service: string
  action: string
  resource: string
  timestamp: Date
  type: 's3' | 'lambda' | 'dynamodb' | 'sqs' | 'sns' | 'iam' | 'info' | 'success' | 'error'
}

interface ServiceHealth {
  id: string
  name: string
  icon: string
  count: number
  status: 'healthy' | 'warning' | 'error' | 'unknown'
  loading: boolean
}

// State
const isLoading = ref(true)
const connectionLoading = ref(false)
const lastChecked = ref<Date | null>(null)

const stats = ref<ServiceStats[]>([
  { name: 'S3 Buckets', value: 0, icon: 'ArchiveBoxIcon', route: '/services/s3', serviceId: 's3', loading: false },
  { name: 'Lambda Functions', value: 0, icon: 'BoltIcon', route: '/services/lambda', serviceId: 'lambda', loading: false },
  { name: 'DynamoDB Tables', value: 0, icon: 'TableCellsIcon', route: '/services/dynamodb', serviceId: 'dynamodb', loading: false },
  { name: 'SQS Queues', value: 0, icon: 'QueueListIcon', route: '/services/sqs', serviceId: 'sqs', loading: false },
  { name: 'SNS Topics', value: 0, icon: 'MegaphoneIcon', route: '/services/sns', serviceId: 'sns', loading: false },
  { name: 'IAM Users', value: 0, icon: 'UserGroupIcon', route: '/services/iam', serviceId: 'iam', loading: false },
])

const recentActivity = ref<ActivityItem[]>([])

const allServices = ref<ServiceHealth[]>([
  { id: 's3', name: 'S3', icon: 'ArchiveBoxIcon', count: 0, status: 'unknown', loading: false },
  { id: 'lambda', name: 'Lambda', icon: 'BoltIcon', count: 0, status: 'unknown', loading: false },
  { id: 'dynamodb', name: 'DynamoDB', icon: 'TableCellsIcon', count: 0, status: 'unknown', loading: false },
  { id: 'sqs', name: 'SQS', icon: 'QueueListIcon', count: 0, status: 'unknown', loading: false },
  { id: 'sns', name: 'SNS', icon: 'MegaphoneIcon', count: 0, status: 'unknown', loading: false },
  { id: 'iam', name: 'IAM', icon: 'UserGroupIcon', count: 0, status: 'unknown', loading: false },
  { id: 'ec2', name: 'EC2', icon: 'ServerIcon', count: 0, status: 'unknown', loading: false },
  { id: 'rds', name: 'RDS', icon: 'DatabaseIcon', count: 0, status: 'unknown', loading: false },
  { id: 'vpc', name: 'VPC', icon: 'GlobeAltIcon', count: 0, status: 'unknown', loading: false },
  { id: 'cloudwatch', name: 'CloudWatch', icon: 'ChartBarIcon', count: 0, status: 'unknown', loading: false },
  { id: 'apigateway', name: 'API Gateway', icon: 'GlobeAltIcon', count: 0, status: 'unknown', loading: false },
  { id: 'eventbridge', name: 'EventBridge', icon: 'WaveformIcon', count: 0, status: 'unknown', loading: false },
  { id: 'kinesis', name: 'Kinesis', icon: 'WaveformIcon', count: 0, status: 'unknown', loading: false },
  { id: 'stepfunctions', name: 'Step Functions', icon: 'ArrowsRightLeftIcon', count: 0, status: 'unknown', loading: false },
  { id: 'cognito', name: 'Cognito', icon: 'IdentificationIcon', count: 0, status: 'unknown', loading: false },
  { id: 'secretsmanager', name: 'Secrets Manager', icon: 'LockClosedIcon', count: 0, status: 'unknown', loading: false },
  { id: 'kms', name: 'KMS', icon: 'KeyIcon', count: 0, status: 'unknown', loading: false },
  // { id: 'cloudformation', name: 'CloudFormation', icon: 'DocumentTextIcon', count: 0, status: 'unknown', loading: false },
  { id: 'elasticache', name: 'ElastiCache', icon: 'ServerIcon', count: 0, status: 'unknown', loading: false },
  { id: 'ssm', name: 'SSM', icon: 'Cog6ToothIcon', count: 0, status: 'unknown', loading: false },
])

// Computed
const isConnected = computed(() => connectionStatus.value.isConnected)
const endpoint = computed(() => connectionStatus.value.endpoint || settingsStore.endpoint)
const region = computed(() => settingsStore.region)

const formattedLastChecked = computed(() => {
  if (!connectionStatus.value.lastChecked) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(connectionStatus.value.lastChecked)
})

const activityColumns = [
  { key: 'service', label: 'Service', sortable: true },
  { key: 'action', label: 'Action', sortable: true },
  { key: 'resource', label: 'Resource', sortable: false },
  { key: 'timestamp', label: 'Time', sortable: true },
]

const activityData = computed(() => 
  recentActivity.value.map(activity => ({
    ...activity,
    timestamp: formatTimestamp(activity.timestamp),
  }))
)

// Functions
async function fetchStats() {
  isLoading.value = true
  
  // Reset all services loading state
  stats.value.forEach(s => s.loading = true)
  allServices.value.forEach(s => s.loading = true)
  
  // Fetch S3 stats
  try {
    const result = await listBuckets()
    const count = result.length || 0
    stats.value[0].value = count
    allServices.value[0].count = count
    allServices.value[0].status = count > 0 ? 'healthy' : 'warning'
  } catch {
    stats.value[0].value = 0
    allServices.value[0].count = 0
    allServices.value[0].status = 'error'
  }
  stats.value[0].loading = false
  allServices.value[0].loading = false

  // Fetch Lambda stats
  try {
    const result = await listFunctions()
    const count = result.Functions?.length || 0
    const idx1 = stats.value.findIndex(s => s.serviceId === 'lambda')
    const idx2 = allServices.value.findIndex(s => s.id === 'lambda')
    if (idx1 >= 0) stats.value[idx1].value = count
    if (idx2 >= 0) {
      allServices.value[idx2].count = count
      allServices.value[idx2].status = count > 0 ? 'healthy' : 'warning'
    }
  } catch {
    const idx1 = stats.value.findIndex(s => s.serviceId === 'lambda')
    const idx2 = allServices.value.findIndex(s => s.id === 'lambda')
    if (idx1 >= 0) stats.value[idx1].value = 0
    if (idx2 >= 0) {
      allServices.value[idx2].count = 0
      allServices.value[idx2].status = 'error'
    }
  }
  const idx1 = stats.value.findIndex(s => s.serviceId === 'lambda')
  const idx2 = allServices.value.findIndex(s => s.id === 'lambda')
  if (idx1 >= 0) stats.value[idx1].loading = false
  if (idx2 >= 0) allServices.value[idx2].loading = false

  // Fetch DynamoDB stats
  try {
    const result = await listTables()
    const count = result.TableNames?.length || 0
    const idx1 = stats.value.findIndex(s => s.serviceId === 'dynamodb')
    const idx2 = allServices.value.findIndex(s => s.id === 'dynamodb')
    if (idx1 >= 0) stats.value[idx1].value = count
    if (idx2 >= 0) {
      allServices.value[idx2].count = count
      allServices.value[idx2].status = count > 0 ? 'healthy' : 'warning'
    }
  } catch {
    const idx1 = stats.value.findIndex(s => s.serviceId === 'dynamodb')
    const idx2 = allServices.value.findIndex(s => s.id === 'dynamodb')
    if (idx1 >= 0) stats.value[idx1].value = 0
    if (idx2 >= 0) {
      allServices.value[idx2].count = 0
      allServices.value[idx2].status = 'error'
    }
  }
  const idx1d = stats.value.findIndex(s => s.serviceId === 'dynamodb')
  const idx2d = allServices.value.findIndex(s => s.id === 'dynamodb')
  if (idx1d >= 0) stats.value[idx1d].loading = false
  if (idx2d >= 0) allServices.value[idx2d].loading = false

  // Fetch SQS stats
  try {
    const result = await listQueues()
    const count = result.QueueUrls?.length || result.length || 0
    const idx1 = stats.value.findIndex(s => s.serviceId === 'sqs')
    const idx2 = allServices.value.findIndex(s => s.id === 'sqs')
    if (idx1 >= 0) stats.value[idx1].value = count
    if (idx2 >= 0) {
      allServices.value[idx2].count = count
      allServices.value[idx2].status = count > 0 ? 'healthy' : 'warning'
    }
  } catch {
    const idx1 = stats.value.findIndex(s => s.serviceId === 'sqs')
    const idx2 = allServices.value.findIndex(s => s.id === 'sqs')
    if (idx1 >= 0) stats.value[idx1].value = 0
    if (idx2 >= 0) {
      allServices.value[idx2].count = 0
      allServices.value[idx2].status = 'error'
    }
  }
  const idx1s = stats.value.findIndex(s => s.serviceId === 'sqs')
  const idx2s = allServices.value.findIndex(s => s.id === 'sqs')
  if (idx1s >= 0) stats.value[idx1s].loading = false
  if (idx2s >= 0) allServices.value[idx2s].loading = false

  // Fetch SNS stats
  try {
    const result = await listTopics()
    const count = result.length || 0
    const idx1 = stats.value.findIndex(s => s.serviceId === 'sns')
    const idx2 = allServices.value.findIndex(s => s.id === 'sns')
    if (idx1 >= 0) stats.value[idx1].value = count
    if (idx2 >= 0) {
      allServices.value[idx2].count = count
      allServices.value[idx2].status = count > 0 ? 'healthy' : 'warning'
    }
  } catch {
    const idx1 = stats.value.findIndex(s => s.serviceId === 'sns')
    const idx2 = allServices.value.findIndex(s => s.id === 'sns')
    if (idx1 >= 0) stats.value[idx1].value = 0
    if (idx2 >= 0) {
      allServices.value[idx2].count = 0
      allServices.value[idx2].status = 'error'
    }
  }
  const idx1n = stats.value.findIndex(s => s.serviceId === 'sns')
  const idx2n = allServices.value.findIndex(s => s.id === 'sns')
  if (idx1n >= 0) stats.value[idx1n].loading = false
  if (idx2n >= 0) allServices.value[idx2n].loading = false

  // Fetch IAM stats
  try {
    const [usersResult, rolesResult] = await Promise.all([
      listUsers(),
      listRoles(),
    ])
    const count = (usersResult.Users?.length || 0) + (rolesResult.Roles?.length || 0)
    const idx1 = stats.value.findIndex(s => s.serviceId === 'iam')
    const idx2 = allServices.value.findIndex(s => s.id === 'iam')
    if (idx1 >= 0) stats.value[idx1].value = count
    if (idx2 >= 0) {
      allServices.value[idx2].count = count
      allServices.value[idx2].status = count > 0 ? 'healthy' : 'warning'
    }
  } catch {
    const idx1 = stats.value.findIndex(s => s.serviceId === 'iam')
    const idx2 = allServices.value.findIndex(s => s.id === 'iam')
    if (idx1 >= 0) stats.value[idx1].value = 0
    if (idx2 >= 0) {
      allServices.value[idx2].count = 0
      allServices.value[idx2].status = 'error'
    }
  }
  const idx1i = stats.value.findIndex(s => s.serviceId === 'iam')
  const idx2i = allServices.value.findIndex(s => s.id === 'iam')
  if (idx1i >= 0) stats.value[idx1i].loading = false
  if (idx2i >= 0) allServices.value[idx2i].loading = false

  // Mark remaining services as unknown
  const knownServices = ['s3', 'lambda', 'dynamodb', 'sqs', 'sns', 'iam']
  for (let i = 0; i < allServices.value.length; i++) {
    if (!knownServices.includes(allServices.value[i].id)) {
      allServices.value[i].status = 'unknown'
      allServices.value[i].loading = false
    }
  }

  isLoading.value = false
  lastChecked.value = new Date()
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function getServiceColor(serviceId: string): string {
  const colors: Record<string, string> = {
    s3: 'text-orange-500',
    lambda: 'text-yellow-500',
    dynamodb: 'text-blue-500',
    sqs: 'text-red-500',
    sns: 'text-purple-500',
    iam: 'text-green-500',
  }
  return colors[serviceId] || 'text-gray-500'
}

function getActivityTypeColor(type: string): string {
  const colors: Record<string, string> = {
    s3: 'bg-orange-500',
    lambda: 'bg-yellow-500',
    dynamodb: 'bg-blue-500',
    sqs: 'bg-red-500',
    sns: 'bg-purple-500',
    iam: 'bg-green-500',
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
  }
  return colors[type] || 'bg-gray-500'
}

async function testConnection() {
  connectionLoading.value = true
  await checkConnection()
  connectionLoading.value = false
  if (connectionStatus.value.isConnected) {
    await fetchStats()
  }
}

function navigateToService(route: string) {
  router.push(route)
}

function addActivity(activity: Omit<ActivityItem, 'id'>) {
  recentActivity.value.unshift({
    ...activity,
    id: crypto.randomUUID(),
  })
  // Keep only last 10
  if (recentActivity.value.length > 10) {
    recentActivity.value = recentActivity.value.slice(0, 10)
  }
}

// Initial load
onMounted(async () => {
  if (connectionStatus.value.isConnected) {
    await fetchStats()
  } else {
    isLoading.value = false
  }
})

// Watch for connection changes
watch(() => connectionStatus.value.isConnected, async (connected) => {
  if (connected) {
    await fetchStats()
  }
})
</script>

<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h1
          class="text-2xl font-bold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Dashboard
        </h1>
        <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
          Overview of your local AWS environment
        </p>
      </div>
    </div>

    <!-- Connection Status Panel -->
    <div 
      class="rounded-xl border p-6 transition-all duration-300"
      :class="[
        settingsStore.darkMode 
          ? 'bg-dark-surface border-dark-border' 
          : 'bg-light-surface border-light-border',
        isConnected 
          ? 'hover:shadow-lg hover:shadow-green-500/10' 
          : 'hover:shadow-lg hover:shadow-red-500/10'
      ]"
    >
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex items-center gap-4">
          <!-- Status Indicator -->
          <div 
            class="w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300"
            :class="isConnected 
              ? 'bg-green-500/20 dark:bg-green-500/30' 
              : 'bg-red-500/20 dark:bg-red-500/30'"
          >
            <div class="relative">
              <span 
                class="w-4 h-4 rounded-full block"
                :class="isConnected ? 'bg-green-500' : 'bg-red-500'"
              />
              <span 
                v-if="isConnected"
                class="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75"
              />
            </div>
          </div>
          
          <div>
            <h2 
              class="text-lg font-semibold"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ isConnected ? 'Connected to AWS' : 'Not Connected' }}
            </h2>
            <p 
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Endpoint: <span class="font-mono">{{ endpoint }}</span>
            </p>
            <p 
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Region: <span class="font-medium">{{ region }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-right">
            <p 
              class="text-xs uppercase tracking-wide"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Last Checked
            </p>
            <p 
              class="text-sm font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ formattedLastChecked }}
            </p>
          </div>
          
          <button
            :disabled="connectionLoading"
            class="px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            :class="isConnected
              ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30'
              : 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30'"
            @click="testConnection"
          >
            <span
              v-if="connectionLoading"
              class="flex items-center gap-2"
            >
              <svg
                class="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Testing...
            </span>
            <span v-else>{{ isConnected ? 'Test Connection' : 'Retry Connection' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div>
      <h2 
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Quick Stats
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.name"
          class="group p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
          :class="[
            settingsStore.darkMode 
              ? 'bg-dark-surface border-dark-border hover:border-primary-500' 
              : 'bg-light-surface border-light-border hover:border-primary-500',
          ]"
          @click="navigateToService(stat.route)"
        >
          <div class="flex items-center justify-between mb-2">
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
              :class="getServiceColor(stat.serviceId) + '/20'"
            >
              <!-- S3 Icon -->
              <svg
                v-if="stat.icon === 'ArchiveBoxIcon'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                :class="'w-5 h-5 ' + getServiceColor(stat.serviceId)"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              <!-- Lambda Icon -->
              <svg
                v-else-if="stat.icon === 'BoltIcon'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                :class="'w-5 h-5 ' + getServiceColor(stat.serviceId)"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
              <!-- DynamoDB Icon -->
              <svg
                v-else-if="stat.icon === 'TableCellsIcon'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                :class="'w-5 h-5 ' + getServiceColor(stat.serviceId)"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5"
                />
              </svg>
              <!-- SQS Icon -->
              <svg
                v-else-if="stat.icon === 'QueueListIcon'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                :class="'w-5 h-5 ' + getServiceColor(stat.serviceId)"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <!-- SNS Icon -->
              <svg
                v-else-if="stat.icon === 'MegaphoneIcon'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                :class="'w-5 h-5 ' + getServiceColor(stat.serviceId)"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
                />
              </svg>
              <!-- IAM Icon -->
              <svg
                v-else-if="stat.icon === 'UserGroupIcon'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                :class="'w-5 h-5 ' + getServiceColor(stat.serviceId)"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
              />
            </svg>
          </div>
          <p 
            class="text-sm font-medium"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            {{ stat.name }}
          </p>
          <p 
            class="text-2xl font-bold mt-1"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            <span
              v-if="isLoading"
              class="animate-pulse"
            >-</span>
            <span v-else-if="stat.value > 0">{{ stat.value }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Quick Actions & Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Quick Actions -->
      <div 
        class="p-6 rounded-xl border"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h3 
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Quick Actions
        </h3>
        <div class="grid grid-cols-2 gap-3">
          <router-link
            to="/services/s3"
            class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            :class="settingsStore.darkMode 
              ? 'border-dark-border hover:bg-dark-bg hover:border-primary-500/50' 
              : 'border-light-border hover:bg-light-bg hover:border-primary-500/50'"
          >
            <div class="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 text-orange-500"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
            </div>
            <div>
              <span
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                class="font-medium block text-sm"
              >Create Bucket</span>
              <span
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                class="text-xs"
              >S3 storage</span>
            </div>
          </router-link>
          
          <router-link
            to="/services/lambda"
            class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            :class="settingsStore.darkMode 
              ? 'border-dark-border hover:bg-dark-bg hover:border-primary-500/50' 
              : 'border-light-border hover:bg-light-bg hover:border-primary-500/50'"
          >
            <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 text-yellow-500"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <div>
              <span
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                class="font-medium block text-sm"
              >Deploy Function</span>
              <span
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                class="text-xs"
              >Lambda compute</span>
            </div>
          </router-link>
          
          <router-link
            to="/services/dynamodb"
            class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            :class="settingsStore.darkMode 
              ? 'border-dark-border hover:bg-dark-bg hover:border-primary-500/50' 
              : 'border-light-border hover:bg-light-bg hover:border-primary-500/50'"
          >
            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 text-blue-500"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5"
                />
              </svg>
            </div>
            <div>
              <span
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                class="font-medium block text-sm"
              >Create Table</span>
              <span
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                class="text-xs"
              >DynamoDB</span>
            </div>
          </router-link>
          
          <router-link
            to="/services/sqs"
            class="flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            :class="settingsStore.darkMode 
              ? 'border-dark-border hover:bg-dark-bg hover:border-primary-500/50' 
              : 'border-light-border hover:bg-light-bg hover:border-primary-500/50'"
          >
            <div class="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-5 h-5 text-red-500"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
            </div>
            <div>
              <span
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                class="font-medium block text-sm"
              >Create Queue</span>
              <span
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                class="text-xs"
              >SQS messaging</span>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Recent Activity -->
      <div 
        class="p-6 rounded-xl border"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h3 
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Recent Activity
        </h3>
        <div
          v-if="recentActivity.length > 0"
          class="space-y-3 max-h-64 overflow-y-auto"
        >
          <div
            v-for="activity in recentActivity"
            :key="activity.id"
            class="flex items-start gap-3 p-2 rounded-lg transition-colors hover:bg-opacity-50"
            :class="settingsStore.darkMode ? 'hover:bg-dark-bg' : 'hover:bg-light-bg'"
          >
            <div
              class="w-2 h-2 rounded-full mt-2 flex-shrink-0"
              :class="getActivityTypeColor(activity.type)"
            />
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-medium truncate"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                {{ activity.action }}
              </p>
              <p
                class="text-xs truncate"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                {{ activity.service }} · {{ activity.resource }}
              </p>
            </div>
            <span
              class="text-xs flex-shrink-0"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              {{ formatTimestamp(activity.timestamp) }}
            </span>
          </div>
        </div>
        <div
          v-else
          class="text-center py-8"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            class="text-sm"
          >
            No recent activity yet
          </p>
          <p
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            class="text-xs mt-1"
          >
            Start using services to see activity here
          </p>
        </div>
      </div>
    </div>

    <!-- Getting Started Panel -->
    <div 
      class="rounded-xl border p-6 overflow-hidden relative"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
    >
      <!-- Background gradient -->
      <div 
        class="absolute inset-0 opacity-10 dark:opacity-5"
        :class="settingsStore.darkMode ? 'bg-gradient-to-br from-primary-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'"
      />
      
      <div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="flex items-center gap-4">
          <!-- Logo -->
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-8 h-8 text-white"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"
              />
            </svg>
          </div>
          
          <div>
            <h3 
              class="text-lg font-semibold"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Configure AWS Connection
            </h3>
            <p
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-sm"
            >
              Use real AWS credentials or connect to a local emulator
            </p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <p 
              class="text-xs uppercase tracking-wide mb-2"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Quick Setup (Local Emulator)
            </p>
            <div 
              class="p-3 rounded-lg font-mono text-sm"
              :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-light-bg'"
            >
              <span class="text-green-500">docker run</span>
              <span :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"> --rm -p 4566:4566</span>
              <span class="text-primary-500"> your-aws-emulator</span>
            </div>
          </div>
          
          <div class="flex items-end">
            <button
              class="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              :class="settingsStore.darkMode 
                ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30' 
                : 'bg-primary-500/20 text-primary-600 hover:bg-primary-500/30'"
              @click="router.push('/settings')"
            >
              <span>Go to Settings</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scrollbar styling for activity feed */
.max-h-64::-webkit-scrollbar {
  width: 4px;
}

.max-h-64::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-64::-webkit-scrollbar-thumb {
  background: rgb(148 163 184 / 0.3);
  border-radius: 2px;
}

.max-h-64::-webkit-scrollbar-thumb:hover {
  background: rgb(148 163 184 / 0.5);
}

.dark .max-h-64::-webkit-scrollbar-thumb {
  background: rgb(71 85 105 / 0.3);
}

.dark .max-h-64::-webkit-scrollbar-thumb:hover {
  background: rgb(71 85 105 / 0.5);
}
</style>
