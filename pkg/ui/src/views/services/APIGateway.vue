<script setup lang="ts">
import { ref } from 'vue'
import { CodeBracketSquareIcon } from '@heroicons/vue/24/outline'
import { useSettingsStore } from '@/stores/settings'
import { useApiGateway } from '@/composables/useApiGateway'
import Tabs from '@/components/common/Tabs.vue'

import APIGatewayRestApis from './APIGatewayRestApis.vue'
import APIGatewayHttpApis from './APIGatewayHttpApis.vue'
import APIGatewayCreateModal from '@/components/apiGateway/APIGatewayCreateModal.vue'
import APIGatewayInvokeUrlModal from '@/components/apiGateway/APIGatewayInvokeUrlModal.vue'
import APIGatewayCodeExamples from '@/components/apiGateway/APIGatewayCodeExamples.vue'

const settingsStore = useSettingsStore()

const { loadRestStages, loadHttpStages, getRestInvokeUrl, getHttpInvokeUrl, createRestApi: callCreateRestApi, createHttpApi: callCreateHttpApi } = useApiGateway()

const activeTab = ref<'rest' | 'http'>('rest')
const restApisKey = ref(0)
const httpApisKey = ref(0)
const selectedApi = ref<any>(null)
const invokeUrl = ref('')
const stagesList = ref<any[]>([])
const showCreateModal = ref(false)
const showInvokeUrlModal = ref(false)

const tabs = [
  { id: 'rest', label: 'REST APIs' },
  { id: 'http', label: 'HTTP APIs' },
]

function handleTabChange(tabId: string) {
  activeTab.value = tabId as 'rest' | 'http'
}

function handleCreateApi() {
  selectedApi.value = null
  showCreateModal.value = true
}

async function handleGetInvokeUrl(api: any) {
  selectedApi.value = api
  showInvokeUrlModal.value = true
  invokeUrl.value = ''
  const apiId = api.id || api.apiId
  const stagesPromise = activeTab.value === 'rest'
    ? loadRestStages(apiId)
    : loadHttpStages(apiId)
  stagesPromise.then(result => {
    stagesList.value = result?.items || result?.Items || []
    if (stagesList.value.length > 0) {
      fetchInvokeUrl(apiId, stagesList.value[0].stageName)
    }
  })
}

async function fetchInvokeUrl(apiId: string, stageName: string) {
  if (!stageName) return
  const apiIdVal = apiId
  try {
    const result = activeTab.value === 'rest'
      ? await getRestInvokeUrl(apiIdVal, stageName)
      : await getHttpInvokeUrl(apiIdVal, stageName)
    invokeUrl.value = result || `https://${apiIdVal}.execute-api.${settingsStore.region || 'us-east-1'}.amazonaws.com/${stageName}`
  } catch {
    invokeUrl.value = `https://${apiIdVal}.execute-api.${settingsStore.region || 'us-east-1'}.amazonaws.com/${stageName}`
  }
}

async function createRestApi(name: string, desc?: string) {
  await callCreateRestApi(name, desc)
  showCreateModal.value = false
  restApisKey.value++
}

async function createHttpApi(name: string, desc?: string) {
  await callCreateHttpApi(name, desc)
  showCreateModal.value = false
  httpApisKey.value++
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <CodeBracketSquareIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            API Gateway
          </h1>
        </div>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          @click="handleCreateApi"
        >
          + Create {{ activeTab === 'rest' ? 'REST API' : 'HTTP API' }}
        </button>
      </div>
    </div>

    <Tabs
      :tabs="tabs"
      :active-tab="activeTab"
      @update:active-tab="handleTabChange"
    />

    <div class="flex-1 overflow-auto">
      <APIGatewayRestApis
        v-if="activeTab === 'rest'"
        :key="restApisKey"
        @edit-api="selectedApi = $event; showCreateModal = true"
        @get-invoke-url="handleGetInvokeUrl"
      />
      <APIGatewayHttpApis
        v-if="activeTab === 'http'"
        :key="httpApisKey"
        @get-invoke-url="handleGetInvokeUrl"
        @edit-api="selectedApi = $event; showCreateModal = true"
      />
    </div>

    <APIGatewayInvokeUrlModal
      v-if="showInvokeUrlModal"
      :open="showInvokeUrlModal"
      :api="selectedApi"
      :api-type="activeTab"
      :invoke-url="invokeUrl"
      :stages="stagesList"
      @close="showInvokeUrlModal = false"
      @update:open="showInvokeUrlModal = $event"
    />

    <APIGatewayCodeExamples
      :region="settingsStore.region"
      :access-key="settingsStore.accessKey"
      :secret-key="settingsStore.secretKey"
      :active-tab="activeTab"
    />

    <APIGatewayCreateModal
      v-if="showCreateModal"
      :open="showCreateModal"
      :type="activeTab"
      :api="selectedApi"
      @create-rest="async (name, desc) => { await createRestApi(name, desc) }"
      @create-http="async (name, desc) => { await createHttpApi(name, desc) }"
      @close="showCreateModal = false"
      @update:open="showCreateModal = $event"
    />
  </div>
</template>