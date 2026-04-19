<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import Button from '@/components/common/Button.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useToast } from '@/composables/useToast'

const settingsStore = useSettingsStore()
const toast = useToast()

// Types
export interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'success' | 'debug'
  service: string
  action: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ERROR' | 'PATCH'
  resource: string
  status: 'success' | 'error' | 'pending'
  duration: number
  request?: {
    method: string
    url: string
    headers: Record<string, string>
    body?: string
  }
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    body?: string
  }
}

// Constants
const MAX_LOGS = 500

// Service options
const serviceOptions = [
  { value: 'all', label: 'All Services' },
  { value: 'S3', label: 'S3' },
  { value: 'Lambda', label: 'Lambda' },
  { value: 'DynamoDB', label: 'DynamoDB' },
  { value: 'SQS', label: 'SQS' },
  { value: 'SNS', label: 'SNS' },
  { value: 'IAM', label: 'IAM' },
  { value: 'CloudFormation', label: 'CloudFormation' },
  { value: 'EC2', label: 'EC2' },
  { value: 'RDS', label: 'RDS' },
  { value: 'API Gateway', label: 'API Gateway' },
]

// Log level options
const levelOptions = [
  { value: 'all', label: 'All Levels' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'success', label: 'Success' },
  { value: 'debug', label: 'Debug' },
]

// Time range options
const timeRangeOptions = [
  { value: '15m', label: 'Last 15 minutes' },
  { value: '30m', label: 'Last 30 minutes' },
  { value: '1h', label: 'Last 1 hour' },
  { value: '6h', label: 'Last 6 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: 'custom', label: 'Custom' },
]

// State
const logs = ref<LogEntry[]>([])
const selectedService = ref('all')
const selectedLevel = ref('all')
const searchQuery = ref('')
const timeRange = ref('30m')
const selectedLog = ref<LogEntry | null>(null)
const isDetailOpen = ref(false)
const isLoading = ref(false)
const exportMenuOpen = ref(false)

// Generate mock logs
const generateMockLogs = (count: number): LogEntry[] => {
  const services = ['S3', 'Lambda', 'DynamoDB', 'SQS', 'SNS', 'IAM', 'CloudFormation', 'EC2', 'RDS', 'API Gateway']
  const actions: LogEntry['action'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  const levels: LogEntry['level'][] = ['info', 'warning', 'error', 'success', 'debug']
  const statuses: LogEntry['status'][] = ['success', 'error', 'pending']
  const resources = ['my-bucket', 'hello-world-function', 'users-table', 'my-queue', 'my-topic', 'admin-role', 'main-stack', 'web-server', 'main-db', 'api-endpoint']

  return Array.from({ length: count }, (_, i) => {
    const service = services[Math.floor(Math.random() * services.length)]
    const action = actions[Math.floor(Math.random() * actions.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const duration = Math.floor(Math.random() * 5000) + 50
    const timestamp = new Date(Date.now() - Math.random() * 3600000 * 24)

    return {
      id: `log-${i}-${Date.now()}`,
      timestamp,
      level,
      service,
      action,
      resource: `${resources[Math.floor(Math.random() * resources.length)]}-${Math.floor(Math.random() * 100)}`,
      status,
      duration,
      request: {
        method: action,
        url: `https://${service.toLowerCase()}.localhost.localstack.cloud:4566/${resources[Math.floor(Math.random() * resources.length)]}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ***',
          'X-Request-ID': `req-${Math.random().toString(36).slice(2, 11)}`,
        },
        body: level !== 'error' ? JSON.stringify({ key: 'value', data: 'sample' }, null, 2) : undefined,
      },
      response: {
        status: status === 'success' ? 200 : status === 'error' ? 500 : 201,
        statusText: status === 'success' ? 'OK' : status === 'error' ? 'Internal Server Error' : 'Created',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': `req-${Math.random().toString(36).slice(2, 11)}`,
          'X-Response-Time': `${duration}ms`,
        },
        body: status === 'success' ? JSON.stringify({ result: 'success', id: '12345' }, null, 2) : JSON.stringify({ error: 'Something went wrong' }, null, 2),
      },
    }
  })
}

// Initialize logs
onMounted(() => {
  logs.value = generateMockLogs(200)
  isLoading.value = false
})

// Filtered logs
const filteredLogs = computed(() => {
  let result = [...logs.value]

  // Filter by service
  if (selectedService.value !== 'all') {
    result = result.filter(log => log.service === selectedService.value)
  }

  // Filter by level
  if (selectedLevel.value !== 'all') {
    result = result.filter(log => log.level === selectedLevel.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(log => 
      log.message?.toLowerCase().includes(query) ||
      log.service.toLowerCase().includes(query) ||
      log.resource.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query)
    )
  }

  // Filter by time range
  const now = Date.now()
  const ranges: Record<string, number> = {
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
  }
  
  if (timeRange.value !== 'custom' && ranges[timeRange.value]) {
    const cutoff = now - ranges[timeRange.value]
    result = result.filter(log => log.timestamp.getTime() > cutoff)
  }

  // Sort by timestamp (newest first)
  result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return result
})

// Statistics
const stats = computed(() => {
  const total = filteredLogs.value.length
  const errors = filteredLogs.value.filter(l => l.status === 'error').length
  const avgDuration = filteredLogs.value.length > 0
    ? Math.round(filteredLogs.value.reduce((sum, l) => sum + l.duration, 0) / filteredLogs.value.length)
    : 0
  
  // Request count by service
  const byService = filteredLogs.value.reduce((acc, log) => {
    acc[log.service] = (acc[log.service] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    total,
    errors,
    errorRate: total > 0 ? Math.round((errors / total) * 100) : 0,
    avgDuration,
    byService,
  }
})

// Level colors
const levelColors: Record<string, { bg: string, text: string, border: string }> = {
  info: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  warning: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' },
  error: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  success: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  debug: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
}

// Service icons (simple color mapping)
const serviceColors: Record<string, string> = {
  S3: 'text-orange-500',
  Lambda: 'text-purple-500',
  DynamoDB: 'text-blue-500',
  SQS: 'text-yellow-500',
  SNS: 'text-red-500',
  IAM: 'text-pink-500',
  CloudFormation: 'text-teal-500',
  EC2: 'text-green-500',
  RDS: 'text-indigo-500',
  'API Gateway': 'text-cyan-500',
}

// Format timestamp
function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

// Format duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// Open log detail
function openLogDetail(log: LogEntry) {
  selectedLog.value = log
  isDetailOpen.value = true
}

// Close log detail
function closeLogDetail() {
  isDetailOpen.value = false
  selectedLog.value = null
}

// Clear logs
function clearLogs() {
  logs.value = []
  toast.info('Logs cleared', 'All logs have been cleared.')
}

// Export to JSON
function exportToJson() {
  const data = JSON.stringify(filteredLogs.value, null, 2)
  downloadFile(data, 'logs.json', 'application/json')
  exportMenuOpen.value = false
  toast.success('Export complete', 'Logs exported to JSON.')
}

// Export to CSV
function exportToCsv() {
  const headers = ['Timestamp', 'Level', 'Service', 'Action', 'Resource', 'Status', 'Duration (ms)']
  const rows = filteredLogs.value.map(log => [
    log.timestamp.toISOString(),
    log.level,
    log.service,
    log.action,
    log.resource,
    log.status,
    log.duration.toString(),
  ])
  
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  downloadFile(csv, 'logs.csv', 'text/csv')
  exportMenuOpen.value = false
  toast.success('Export complete', 'Logs exported to CSV.')
}

// Download file helper
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Copy to clipboard
async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text)
  toast.success('Copied', 'Content copied to clipboard.')
}

// Refresh logs
async function refreshLogs() {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 1000))
  logs.value = generateMockLogs(200)
  isLoading.value = false
  toast.success('Logs refreshed', 'Log data has been updated.')
}
</script>

<template>
  <div class="h-full flex flex-col space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-shrink-0">
      <div>
        <h2
          class="text-2xl font-bold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Logs
        </h2>
        <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
          View and analyze application logs.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="isLoading"
          @click="refreshLogs"
        >
          <template #icon-left>
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </template>
          Refresh
        </Button>
        <div class="relative">
          <Button
            variant="secondary"
            size="sm"
            @click="exportMenuOpen = !exportMenuOpen"
          >
            <template #icon-left>
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            </template>
            Export
          </Button>
          <div
            v-if="exportMenuOpen"
            class="absolute right-0 mt-2 w-40 rounded-md shadow-lg py-1 z-10"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
          >
            <button
              class="w-full px-4 py-2 text-sm text-left"
              :class="settingsStore.darkMode ? 'text-dark-text hover:bg-dark-bg' : 'text-light-text hover:bg-light-bg'"
              @click="exportToJson"
            >
              Export as JSON
            </button>
            <button
              class="w-full px-4 py-2 text-sm text-left"
              :class="settingsStore.darkMode ? 'text-dark-text hover:bg-dark-bg' : 'text-light-text hover:bg-light-bg'"
              @click="exportToCsv"
            >
              Export as CSV
            </button>
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          @click="clearLogs"
        >
          Clear Logs
        </Button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-4 gap-4 flex-shrink-0">
      <div
        class="p-4 rounded-xl border"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Total Requests
        </p>
        <p
          class="text-2xl font-bold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ stats.total }}
        </p>
      </div>
      <div
        class="p-4 rounded-xl border"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Error Rate
        </p>
        <p
          class="text-2xl font-bold"
          :class="stats.errorRate > 10 ? 'text-red-500' : 'text-green-500'"
        >
          {{ stats.errorRate }}%
        </p>
      </div>
      <div
        class="p-4 rounded-xl border"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Avg Response Time
        </p>
        <p
          class="text-2xl font-bold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ formatDuration(stats.avgDuration) }}
        </p>
      </div>
      <div
        class="p-4 rounded-xl border"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <p
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Services Active
        </p>
        <p
          class="text-2xl font-bold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ Object.keys(stats.byService).length }}
        </p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div
      class="flex items-center gap-4 flex-wrap flex-shrink-0 p-4 rounded-xl border"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
    >
      <FormSelect
        v-model="selectedService"
        :options="serviceOptions"
        class="w-40"
      />
      <FormSelect
        v-model="selectedLevel"
        :options="levelOptions"
        class="w-36"
      />
      <FormSelect
        v-model="timeRange"
        :options="timeRangeOptions"
        class="w-44"
      />
      <div class="flex-1 min-w-[200px]">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search logs..."
            class="w-full pl-10 pr-4 py-2 rounded-lg border"
            :class="settingsStore.darkMode ? 'bg-dark-bg border-dark-border text-dark-text' : 'bg-light-bg border-light-border text-light-text'"
          >
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      <div
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
      >
        {{ filteredLogs.length }} logs
      </div>
    </div>

    <!-- Log List -->
    <div
      class="flex-1 min-h-0 overflow-hidden rounded-xl border"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
    >
      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="h-full flex items-center justify-center"
      >
        <LoadingSpinner size="lg" />
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredLogs.length === 0"
        class="h-full"
      >
        <EmptyState
          icon="document"
          title="No logs found"
          :description="searchQuery ? 'Try adjusting your search or filters.' : 'No logs have been captured yet.'"
        />
      </div>

      <!-- Log List -->
      <div
        v-else
        class="h-full overflow-y-auto"
      >
        <div
          class="divide-y"
          :class="settingsStore.darkMode ? 'divide-dark-border' : 'divide-light-border'"
        >
          <div
            v-for="log in filteredLogs"
            :key="log.id"
            class="px-4 py-3 flex items-center gap-4 cursor-pointer transition-colors hover:bg-opacity-50"
            :class="[
              settingsStore.darkMode ? 'hover:bg-dark-bg' : 'hover:bg-light-bg',
            ]"
            @click="openLogDetail(log)"
          >
            <!-- Timestamp -->
            <div
              class="w-36 text-sm font-mono flex-shrink-0"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              {{ formatTimestamp(log.timestamp) }}
            </div>
            
            <!-- Level Badge -->
            <div class="w-20 flex-shrink-0">
              <span 
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="[levelColors[log.level].bg, levelColors[log.level].text]"
              >
                {{ log.level.toUpperCase() }}
              </span>
            </div>
            
            <!-- Service -->
            <div class="w-28 flex-shrink-0 flex items-center gap-2">
              <span :class="serviceColors[log.service] || 'text-gray-500'">●</span>
              <span
                class="text-sm font-medium truncate"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                {{ log.service }}
              </span>
            </div>
            
            <!-- Action -->
            <div class="w-20 flex-shrink-0">
              <span 
                class="px-2 py-0.5 text-xs font-mono rounded"
                :class="{
                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': log.action === 'GET',
                  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': log.action === 'POST',
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': log.action === 'PUT',
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': log.action === 'DELETE',
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': log.action === 'PATCH',
                }"
              >
                {{ log.action }}
              </span>
            </div>
            
            <!-- Resource -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm truncate"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                {{ log.resource }}
              </p>
            </div>
            
            <!-- Status -->
            <div class="w-20 flex-shrink-0">
              <span 
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="log.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : log.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'"
              >
                {{ log.status }}
              </span>
            </div>
            
            <!-- Duration -->
            <div
              class="w-20 text-sm flex-shrink-0 text-right"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              {{ formatDuration(log.duration) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Panel Slide-over -->
    <div
      v-if="isDetailOpen && selectedLog"
      class="fixed inset-y-0 right-0 w-full md:w-[600px] shadow-xl z-50 flex flex-col"
      :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-4 border-b"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <h3
          class="text-lg font-semibold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Log Details
        </h3>
        <button
          class="p-2 rounded-lg transition-colors"
          :class="settingsStore.darkMode ? 'hover:bg-dark-bg text-dark-muted' : 'hover:bg-light-bg text-light-muted'"
          @click="closeLogDetail"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <!-- Summary -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Timestamp
            </p>
            <p
              class="font-mono"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              {{ selectedLog.timestamp.toISOString() }}
            </p>
          </div>
          <div>
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Duration
            </p>
            <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
              {{ selectedLog.duration }}ms
            </p>
          </div>
          <div>
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Service
            </p>
            <p :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'">
              {{ selectedLog.service }}
            </p>
          </div>
          <div>
            <p
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              Status
            </p>
            <span 
              class="px-2 py-0.5 text-xs font-medium rounded-full"
              :class="selectedLog.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
            >
              {{ selectedLog.status }}
            </span>
          </div>
        </div>

        <!-- Request Section -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4
              class="font-semibold"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Request
            </h4>
            <Button
              variant="ghost"
              size="sm"
              @click="copyToClipboard(JSON.stringify(selectedLog.request, null, 2))"
            >
              Copy
            </Button>
          </div>
          <div
            class="rounded-lg p-4"
            :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-light-bg'"
          >
            <div class="space-y-2">
              <div>
                <span
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >Method:</span>
                <span
                  class="ml-2 font-mono"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >{{ selectedLog.request?.method }}</span>
              </div>
              <div>
                <span
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >URL:</span>
                <p
                  class="font-mono text-sm break-all"
                  :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                >
                  {{ selectedLog.request?.url }}
                </p>
              </div>
              <div v-if="selectedLog.request?.headers">
                <span
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >Headers:</span>
                <pre
                  class="mt-1 text-xs font-mono p-2 rounded overflow-x-auto"
                  :class="settingsStore.darkMode ? 'bg-dark-surface text-dark-text' : 'bg-light-surface text-light-text'"
                >{{ JSON.stringify(selectedLog.request.headers, null, 2) }}</pre>
              </div>
              <div v-if="selectedLog.request?.body">
                <span
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >Body:</span>
                <pre
                  class="mt-1 text-xs font-mono p-2 rounded overflow-x-auto"
                  :class="settingsStore.darkMode ? 'bg-dark-surface text-dark-text' : 'bg-light-surface text-light-text'"
                >{{ selectedLog.request.body }}</pre>
              </div>
            </div>
          </div>
        </div>

        <!-- Response Section -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4
              class="font-semibold"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Response
            </h4>
            <Button
              variant="ghost"
              size="sm"
              @click="copyToClipboard(JSON.stringify(selectedLog.response, null, 2))"
            >
              Copy
            </Button>
          </div>
          <div
            class="rounded-lg p-4"
            :class="settingsStore.darkMode ? 'bg-dark-bg' : 'bg-light-bg'"
          >
            <div class="space-y-2">
              <div>
                <span
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >Status:</span>
                <span 
                  class="ml-2 font-mono"
                  :class="selectedLog.response?.status && selectedLog.response.status < 300 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ selectedLog.response?.status }} {{ selectedLog.response?.statusText }}
                </span>
              </div>
              <div v-if="selectedLog.response?.headers">
                <span
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >Headers:</span>
                <pre
                  class="mt-1 text-xs font-mono p-2 rounded overflow-x-auto"
                  :class="settingsStore.darkMode ? 'bg-dark-surface text-dark-text' : 'bg-light-surface text-light-text'"
                >{{ JSON.stringify(selectedLog.response.headers, null, 2) }}</pre>
              </div>
              <div v-if="selectedLog.response?.body">
                <span
                  class="text-sm font-medium"
                  :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                >Body:</span>
                <pre
                  class="mt-1 text-xs font-mono p-2 rounded overflow-x-auto"
                  :class="settingsStore.darkMode ? 'bg-dark-surface text-dark-text' : 'bg-light-surface text-light-text'"
                >{{ selectedLog.response.body }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop for slide-over -->
    <div
      v-if="isDetailOpen"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeLogDetail"
    />
  </div>
</template>
