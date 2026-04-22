<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import Button from '@/components/common/Button.vue'
import Tabs from '@/components/common/Tabs.vue'

// Version loading - reads from VERSION file or defaults to dev
const version = ref('dev')

onMounted(async () => {
  try {
    const response = await fetch('/VERSION')
    if (response.ok) {
      const text = await response.text()
      if (!text.startsWith('<')) {
        version.value = text.trim()
      }
    }
  } catch {
    // Use default 'dev' if VERSION file doesn't exist
  }
})

const settingsStore = useSettingsStore()
const uiStore = useUIStore()

// Notification state
const notificationsEnabled = ref(settingsStore.notificationsEnabled)
const soundEffectsEnabled = ref(settingsStore.soundEffectsEnabled)
const desktopNotificationsEnabled = ref(settingsStore.desktopNotificationsEnabled)

// Advanced state
const requestTimeout = ref(settingsStore.requestTimeout)
const maxRetries = ref(settingsStore.maxRetries)
const debugMode = ref(settingsStore.debugMode)

// Active tab
const activeTab = ref('advanced')

// Regions
const regions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-west-3', label: 'EU (Paris)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
]

// Tab definitions
const tabs = [
  { id: 'advanced', label: 'Advanced' },
  { id: 'about', label: 'About' },
]

// Save advanced settings
const saveAdvanced = () => {
  settingsStore.setRequestTimeout(requestTimeout.value)
  settingsStore.setMaxRetries(maxRetries.value)
  settingsStore.debugMode = debugMode.value
  uiStore.notifySuccess('Advanced settings saved', 'Your advanced settings have been updated.')
}

// Clear local storage
const clearLocalStorage = () => {
  if (confirm('Are you sure you want to clear all settings? This will reset all preferences to defaults.')) {
    settingsStore.clearLocalStorage()
    notificationsEnabled.value = settingsStore.notificationsEnabled
    soundEffectsEnabled.value = settingsStore.soundEffectsEnabled
    desktopNotificationsEnabled.value = settingsStore.desktopNotificationsEnabled
    requestTimeout.value = settingsStore.requestTimeout
    maxRetries.value = settingsStore.maxRetries
    debugMode.value = settingsStore.debugMode
    uiStore.notifySuccess('Local storage cleared', 'All settings have been reset to defaults.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1
        class="text-2xl font-bold"
        :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
      >
        Settings
      </h1>
      <p :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
        Configure AWS credentials and endpoint connection
      </p>
    </div>

    <!-- Tabs -->
    <div
      class="border-b"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <nav class="flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
          :class="activeTab === tab.id
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent hover:text-gray-700 hover:border-gray-300 dark:text-dark-muted dark:hover:text-dark-text'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Advanced Tab -->
    <div
      v-if="activeTab === 'advanced'"
      class="space-y-6"
    >
      <div
        class="rounded-lg border p-6"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h2
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Advanced
        </h2>
        
        <div class="space-y-4 max-w-lg">
          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Request Timeout (seconds)
            </label>
            <input
              v-model.number="requestTimeout"
              type="number"
              min="5"
              max="300"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :class="settingsStore.darkMode 
                ? 'bg-dark-bg border-dark-border text-dark-text' 
                : 'bg-light-bg border-light-border text-light-text'"
            >
          </div>

          <div>
            <label
              class="block text-sm font-medium mb-1"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Max Retries
            </label>
            <input
              v-model.number="maxRetries"
              type="number"
              min="0"
              max="10"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :class="settingsStore.darkMode 
                ? 'bg-dark-bg border-dark-border text-dark-text' 
                : 'bg-light-bg border-light-border text-light-text'"
            >
          </div>

          <div class="flex items-center justify-between">
            <div>
              <label
                class="text-sm font-medium"
                :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
              >
                Debug Mode
              </label>
              <p
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
                class="text-xs"
              >
                Enable detailed logging
              </p>
            </div>
            <button
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="debugMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
              @click="debugMode = !debugMode"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="debugMode ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div class="pt-4">
            <button
              class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
              @click="saveAdvanced"
            >
              Save Advanced
            </button>
          </div>
        </div>
      </div>

      <div
        class="rounded-lg border p-6 border-red-200 dark:border-red-900"
        :class="settingsStore.darkMode ? 'bg-red-900/10' : 'bg-red-50'"
      >
        <h2 class="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <button
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          @click="clearLocalStorage"
        >
          Clear All Settings
        </button>
      </div>
    </div>

    <!-- About Tab -->
    <div
      v-if="activeTab === 'about'"
      class="space-y-6"
    >
      <div
        class="rounded-lg border p-6"
        :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
      >
        <h2
          class="text-lg font-semibold mb-4"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          About MyDevStack
        </h2>
        
        <div class="space-y-4">
          <div>
            <h3
              class="font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              MyDevStack
            </h3>
            <p
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-sm"
            >
              Version {{ version }} - AWS Service Manager
            </p>
          </div>

          <div>
            <h3
              class="font-medium"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
            >
              Supported Services
            </h3>
            <p
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              class="text-sm"
            >
              S3, Lambda, DynamoDB, SQS, SNS, IAM, KMS, Secrets Manager, API Gateway, Kinesis, and more.
            </p>
          </div>

          <div class="pt-4 flex items-center gap-6">
            <!-- Website -->
            <a 
              href="https://alfonsorodriguez.xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex flex-col items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
            >
              <img
                src="/me.png"
                alt="Website"
                class="w-8 h-8 rounded-full object-cover"
              >
              <span class="text-xs">Website</span>
            </a>
            <!-- Buy Me a Coffee -->
            <a 
              href="https://www.buymeacoffee.com/beabys" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex flex-col items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
            >
              <svg
                viewBox="0 0 24 24"
                class="w-8 h-8"
                fill="currentColor"
              >
                <path d="M2.004 21.546h6.377v-1.409H5.59v-7.565h2.791v1.41h-2.79v4.744h2.204v1.41H2.004v-9.379h7.57v-1.41H2.004V21.546zm15.18-7.569c0-1.606-.804-2.534-2.113-2.534-1.318 0-2.122.928-2.122 2.534 0 1.66.804 2.582 2.149 2.582 1.318 0 2.086-.957 2.086-2.582zm-2.086 1.313c-.804 0-1.272-.464-1.272-1.195 0-.73.468-1.194 1.272-1.194.804 0 1.272.464 1.272 1.194 0 .73-.468 1.195-1.272 1.195zm9.938-1.313c0-1.606-.804-2.534-2.113-2.534-1.318 0-2.122.928-2.122 2.534 0 1.66.804 2.582 2.149 2.582 1.318 0 2.086-.957 2.086-2.582zm-2.086 1.313c-.804 0-1.272-.464-1.272-1.195 0-.73.468-1.194 1.272-1.194.804 0 1.272.464 1.272 1.194 0 .73-.468 1.195-1.272 1.195z" />
              </svg>
              <span class="text-xs">Support</span>
            </a>
            <!-- GitHub -->
            <a 
              href="https://github.com/my-devstack/mydevstack" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex flex-col items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
            >
              <svg
                viewBox="0 0 24 24"
                class="w-8 h-8"
                fill="currentColor"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              <span class="text-xs">GitHub</span>
            </a>
          </div>
          
          <!-- Disclaimer -->
          <div
            class="pt-6 mt-4 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <p
              class="text-xs"
              :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
            >
              <strong>Disclaimer:</strong> All brand names, logos, and trademarks mentioned on this page belong to their respective owners. 
              Icons used are for identification purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
