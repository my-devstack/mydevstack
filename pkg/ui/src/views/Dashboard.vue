<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useConnectionStatus } from '@/composables/useConnectionStatus'
import { useServiceRegistry, SERVICE_COLORS } from '@/composables/useServiceRegistry'

const router = useRouter()
const settingsStore = useSettingsStore()
const {
  quickStats,
  allServices,
  isLoading,
  lastChecked,
  fetchStats,
} = useServiceRegistry()
const { status: connectionStatus, checkConnection } = useConnectionStatus()

const icons: Record<string, string> = {
  S3: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></svg>`,
  Lambda: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`,
  DynamoDB: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>`,
  SQS: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>`,
  SNS: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>`,
  IAM: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>`,
  EC2: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" /></svg>`,
  RDS: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>`,
  APIGateway: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75a2.25 2.25 0 012.25-2.25h.75a2.25 2.25 0 012.25 2.25V9.75H6.75V6.75zm0 6.75V6.75a2.25 2.25 0 012.25-2.25h.75a2.25 2.25 0 012.25 2.25V13.5H6.75v-.75zm0 6.75V13.5h7.5v6.75a2.25 2.25 0 01-2.25 2.25h-3.75a2.25 2.25 0 01-2.25-2.25zm7.5-6.75a2.25 2.25 0 00-2.25-2.25h-3.75a2.25 2.25 0 00-2.25 2.25v.75h7.5v-.75zm0 6.75a2.25 2.25 0 00-2.25-2.25h-3.75a2.25 2.25 0 00-2.25 2.25v3.75h7.5v-3.75z" /></svg>`,
  Cognito: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>`,
  KMS: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>`,
  CloudWatch: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`,
  EventBridge: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`,
  SecretsManager: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /></svg>`,
  StepFunctions: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>`,
}

function getIcon(serviceId: string): string {
  return icons[serviceId] || `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>`
}

const isConnected = computed(() => connectionStatus.value.isConnected)
const endpoint = computed(() => connectionStatus.value.endpoint || settingsStore.endpoint)
const region = computed(() => settingsStore.region)

onMounted(async () => {
  await checkConnection()
  if (connectionStatus.value.isConnected) {
    await fetchStats()
  }
})

const formattedLastChecked = computed(() => {
  if (!lastChecked.value) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(lastChecked.value)
})

async function testConnection() {
  await checkConnection()
  if (connectionStatus.value.isConnected) {
    await fetchStats()
  }
}

function navigateToService(route: string) {
  router.push(route)
}

function getColor(serviceId: string): string {
  return SERVICE_COLORS[serviceId]?.text || 'text-gray-500'
}
</script>

<template>
  <div class="space-y-6 animate-fade-in">
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
            class="px-4 py-2 rounded-lg font-medium transition-all duration-200"
            :class="[
              isConnected
                ? 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30'
                : 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30',
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            ]"
            :disabled="isLoading"
            @click="testConnection"
          >
            <span
              v-if="isLoading"
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
              Loading...
            </span>
            <span v-else>{{ isConnected ? 'Test Connection' : 'Retry Connection' }}</span>
          </button>
        </div>
      </div>
    </div>

    <div>
      <h2 
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Quick Stats
      </h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          v-for="stat in quickStats"
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
              :class="stat.color + '/20'"
            >
              <span
                :class="stat.color"
                v-html="getIcon(stat.serviceId)"
              />
            </div>
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
              v-if="stat.loading"
              class="animate-pulse"
            >-</span>
            <span v-else>{{ stat.value }}</span>
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      <div 
        class="p-6 rounded-xl border"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h3 
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          All Services
        </h3>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="service in allServices"
            :key="service.id"
            class="flex items-center justify-between p-2 rounded-lg transition-colors"
            :class="settingsStore.darkMode ? 'hover:bg-dark-bg' : 'hover:bg-light-bg'"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-green-500': service.status === 'healthy',
                  'bg-yellow-500': service.status === 'warning',
                  'bg-red-500': service.status === 'error',
                  'bg-gray-400': service.status === 'unknown',
                }"
              />
              <span
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
                class="text-sm"
              >
                {{ service.name }}
              </span>
            </div>
            <span
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-xs"
            >
              {{ service.count }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div 
      class="rounded-xl border p-6 overflow-hidden relative"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
    >
      <div 
        class="absolute inset-0 opacity-10 dark:opacity-5"
        :class="settingsStore.darkMode ? 'bg-gradient-to-br from-primary-500 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'"
      />
      
      <div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div class="flex items-center gap-4">
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