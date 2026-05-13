<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { PROXY_BACKEND } from '@/config'

interface Service {
  name: string
  path: string
  icon: string
  color: string
}

const props = defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

// Version checking state
const currentVersion = ref('')
const latestVersion = ref('')
const githubRepo = ref('')
const showVersionNotification = ref(false)

// Compare versions - returns true if latest > current
function isNewerVersionAvailable(): boolean {
  if (!latestVersion.value || !currentVersion.value) return false

  const current = currentVersion.value.replace(/^v/, '').split('-')[0]
  const latest = latestVersion.value.replace(/^v/, '').split('-')[0]

  const currentParts = current.split('.').map(Number)
  const latestParts = latest.split('.').map(Number)

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0
    const l = latestParts[i] || 0
    if (l > c) return true
    if (l < c) return false
  }
  return false
}

// Build release URL
function getReleaseUrl(): string {
  if (!latestVersion.value || !githubRepo.value) return ''
  const version = latestVersion.value.replace(/^v/, '')
  return `${githubRepo.value}/releases/tag/v${version}`
}

// Fetch versions
async function fetchVersions() {
  try {
    // Get current version from /VERSION file
    const versionRes = await fetch('/VERSION')
    if (versionRes.ok) {
      currentVersion.value = (await versionRes.text()).trim()
    }

    // Get latest version from health endpoint
    const healthRes = await fetch(`${PROXY_BACKEND}/health`)
    if (healthRes.ok) {
      const healthData = await healthRes.json()
      latestVersion.value = healthData.latestVersion || ''
      githubRepo.value = healthData.github_repo || ''

      showVersionNotification.value = isNewerVersionAvailable()
    }
  } catch (e) {
    console.error('Failed to fetch version info:', e)
  }
}

onMounted(() => {
  fetchVersions()
})

const services: Service[] = [
  { name: 'S3', path: '/services/s3', icon: 's3', color: 'service-s3' },
  { name: 'Lambda', path: '/services/lambda', icon: 'lambda', color: 'service-lambda' },
  { name: 'Lambda ESM', path: '/services/lambda-event-source-mapping', icon: 'lambda', color: 'service-lambda' },
  { name: 'DynamoDB', path: '/services/dynamodb', icon: 'dynamodb', color: 'service-dynamodb' },
  { name: 'SQS', path: '/services/sqs', icon: 'sqs', color: 'service-sqs' },
  { name: 'SNS', path: '/services/sns', icon: 'sns', color: 'service-sns' },
  { name: 'SES', path: '/services/ses', icon: 'ses', color: 'service-ses' },
  { name: 'IAM', path: '/services/iam', icon: 'iam', color: 'service-iam' },
  { name: 'KMS', path: '/services/kms', icon: 'kms', color: 'service-kms' },
  { name: 'Secrets', path: '/services/secrets-manager', icon: 'secrets', color: 'service-secretsmanager' },
  { name: 'API Gateway', path: '/services/api-gateway', icon: 'apigateway', color: 'service-apigateway' },
  { name: 'Kinesis', path: '/services/kinesis', icon: 'kinesis', color: 'service-kinesis' },
  { name: 'CloudFormation', path: '/services/cloudformation', icon: 'cloudformation', color: 'service-cloudformation' },
  { name: 'SSM', path: '/services/ssm', icon: 'ssm', color: 'service-ssm' },
  { name: 'Step Functions', path: '/services/step-functions', icon: 'stepfunctions', color: 'service-stepfunctions' },
  { name: 'ElastiCache', path: '/services/elasticache', icon: 'elasticache', color: 'service-elasticache' },
  { name: 'RDS', path: '/services/rds', icon: 'rds', color: 'service-rds' },
]

const navItems = [
  { name: 'Dashboard', path: '/', icon: 'home' },
]

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

const isServiceRoute = computed(() => route.path.startsWith('/services'))

const handleServiceClick = (service: Service) => {
  router.push(service.path)
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 h-screen z-40 transition-all duration-300"
    :class="[
      collapsed ? 'w-16' : 'w-64',
      settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border',
      'border-r'
    ]"
  >
    <!-- Logo -->
    <div
      class="h-16 flex items-center justify-between px-4 border-b"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <router-link
        to="/"
        class="flex items-center gap-3"
      >
        <img
          src="/logo.svg"
          alt="MyDevStack"
          class="w-8 h-8"
        >
        <span
          v-if="!collapsed"
          class="font-semibold text-lg"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          MyDevStack
        </span>
      </router-link>
      <button
        class="p-1.5 rounded-lg transition-colors"
        :class="settingsStore.darkMode ? 'hover:bg-dark-border text-dark-muted' : 'hover:bg-light-border text-light-muted'"
        @click="emit('toggle')"
      >
        <svg
          class="w-5 h-5 transition-transform"
          :class="{ 'rotate-180': collapsed }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </button>
    </div>

    <!-- Main Navigation -->
    <nav class="p-2 space-y-1">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
        :class="[
          isActive(item.path)
            ? 'bg-primary-600 text-white'
            : settingsStore.darkMode
              ? 'text-dark-muted hover:bg-dark-border hover:text-dark-text'
              : 'text-light-muted hover:bg-light-border hover:text-light-text'
        ]"
      >
        <svg
          class="w-5 h-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <template v-if="item.icon === 'home'">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </template>
          <template v-else-if="item.icon === 'server'">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
            />
          </template>
          <template v-else-if="item.icon === 'cog'">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </template>
          <template v-else-if="item.icon === 'document'">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </template>
        </svg>
        <span
          v-if="!collapsed"
          class="font-medium"
        >{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- Services List -->
    <div class="mt-4 px-2">
      <!-- Title - only when expanded -->
      <div
        v-if="!collapsed"
        class="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
        :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
      >
        AWS Services
      </div>
      
      <!-- Services list -->
      <div
        class="space-y-0.5 overflow-y-auto"
        :class="collapsed ? 'max-h-[calc(100vh-300px)]' : 'max-h-[calc(100vh-300px\)]'"
      >
        <button
          v-for="service in services"
          :key="service.path"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
          :class="[
            route.path === service.path
              ? 'bg-primary-600/10 text-primary-600'
              : settingsStore.darkMode
                ? 'text-dark-muted hover:bg-dark-border hover:text-dark-text'
                : 'text-light-muted hover:bg-light-border hover:text-light-text'
          ]"
          @click="handleServiceClick(service)"
        >
          <!-- Service icon -->
          <svg
            v-if="service.icon === 's3'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'lambda'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'dynamodb'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'sqs'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 6h13M8 12h13m-13 6h13M3 6h.01M3 12h.01M3 18h.01"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'sns'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'iam'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'kms'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'secrets'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'apigateway'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'kinesis'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125m1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M18 5.625v5.25m0-5.25c0 .621.504 1.125 1.125 1.125M18 5.625c0-.621.504-1.125 1.125-1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M6 5.625v5.25m0-5.25c0 .621.504 1.125 1.125 1.125M6 5.625C6 5.004 5.496 4.5 4.875 4.5m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 5.496 4.5 4.875 4.5m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'cloudformation'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.205m-6.75 0l-3 3m0 0l-1.5 1.5m0 0l-.75.75m2.25-3.75l3-3m0 0l1.5-1.5m0 0l.75-.75"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'ssm'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'elasticache'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'rds'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'stepfunctions'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 5C4 3.89543 4.89543 3 6 3C7.10457 3 8 3.89543 8 5C8 6.10457 7.10457 7 6 7C4.89543 7 4 6.10457 4 5Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 19C16 17.8954 16.8954 17 18 17C19.1046 17 20 17.8954 20 19C20 20.1046 19.1046 21 18 21C16.8954 21 16 20.1046 16 19Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12Z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 5L10 12"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14 12L16 19"
            />
          </svg>
          <svg
            v-else-if="service.icon === 'ses'"
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"
            />
          </svg>
          
          <!-- Service name - only when expanded -->
          <span
            v-if="!collapsed"
            class="text-sm font-medium"
          >{{ service.name }}</span>
        </button>
      </div>
    </div>

    <!-- Version Notification -->
    <div
      v-if="showVersionNotification && latestVersion"
      class="mx-2 mb-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
    >
      <div class="flex items-start gap-2">
        <svg
          class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
            A new version has been released
          </p>
          <p class="text-sm text-blue-600 dark:text-blue-300">
            v{{ latestVersion }}
          </p>
          <a
            :href="getReleaseUrl()"
            target="_blank"
            class="inline-flex items-center gap-1 mt-1 text-xs font-medium text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline"
          >
            View Release
            <svg
              class="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>
