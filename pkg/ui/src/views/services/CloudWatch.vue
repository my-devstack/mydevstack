<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { usePagination } from '@/composables/usePagination'
import { useCloudWatch } from '@/composables/useCloudWatch'
import { ChartBarIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import {
  CloudWatchAlarmsList,
  CloudWatchMetricsList,
  CloudWatchCreateAlarmModal,
  CloudWatchDeleteAlarmModal,
  CloudWatchCodeExamples,
  CloudWatchLogsList,
  CloudWatchCreateLogGroupModal,
  CloudWatchDeleteLogGroupModal,
  CloudWatchCreateLogStreamModal,
} from '@/components/cloudwatch'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()
const cw = useCloudWatch()

const tabs = [
  { id: 'logs' as const, label: 'Logs' },
  { id: 'alarms' as const, label: 'Alarms' },
  { id: 'metrics' as const, label: 'Metrics' },
]

// Pagination - logs
const {
  currentPage: logGroupPage,
  itemsPerPage: logGroupsPerPage,
  totalPages: totalLogGroupPages,
  paginatedItems: paginatedLogGroups,
  goToPage: goToLogGroupPage,
  perPageOptions,
} = usePagination(cw.logGroups, { defaultPerPage: 10 })

// Pagination - alarms
const {
  currentPage: alarmPage,
  itemsPerPage: alarmsPerPage,
  totalPages: totalAlarmPages,
  paginatedItems: paginatedAlarms,
  goToPage: goToAlarmPage,
} = usePagination(cw.alarms, { defaultPerPage: 10 })

// Pagination - metrics
const {
  currentPage: metricPage,
  itemsPerPage: metricsPerPage,
  totalPages: totalMetricPages,
  paginatedItems: paginatedMetrics,
  goToPage: goToMetricPage,
} = usePagination(cw.metrics, { defaultPerPage: 10 })

// Modal states - alarms
const showCreateAlarmModal = ref(false)
const showDeleteAlarmModal = ref(false)
const selectedAlarmName = ref('')
const alarmForm = ref({
  AlarmName: '',
  AlarmDescription: '',
  Namespace: '',
  MetricName: '',
  Statistic: 'Average',
  Period: 300,
  EvaluationPeriods: 1,
  Threshold: 0,
  ComparisonOperator: 'GreaterThanThreshold',
  ActionsEnabled: false,
  Dimensions: [] as { Name: string; Value: string }[],
})

// Modal states - log groups
const showCreateLogGroupModal = ref(false)
const showDeleteLogGroupModal = ref(false)
const selectedLogGroupName = ref('')

onMounted(() => { cw.switchTab('logs') })
watch(reloadTrigger, () => {
  if (cw.selectedTab.value === 'logs') cw.loadLogGroups()
  else if (cw.selectedTab.value === 'alarms') cw.loadAlarms()
  else cw.loadMetrics()
})

// --- Alarm handlers ---
async function handleCreateAlarm(form: any) {
  await cw.createAlarm(form)
  showCreateAlarmModal.value = false
  alarmForm.value = { ...alarmForm.value, AlarmName: '', AlarmDescription: '' }
}

function openDeleteModal(alarmName: string) {
  selectedAlarmName.value = alarmName
  showDeleteAlarmModal.value = true
}

async function handleDeleteAlarm() {
  await cw.deleteAlarm(selectedAlarmName.value)
  showDeleteAlarmModal.value = false
  selectedAlarmName.value = ''
}

async function handleSetAlarmState(alarmName: string, state: string) {
  await cw.setAlarmState(alarmName, state, `State set to ${state} via UI`)
}

// --- Log group handlers ---
async function handleCreateLogGroup(form: { logGroupName: string; retentionInDays: number; tags: { Key: string; Value: string }[] }) {
  await cw.createLogGroup(form.logGroupName, form.retentionInDays || undefined, form.tags)
  showCreateLogGroupModal.value = false
}

function openDeleteLogGroupModal(name: string) {
  selectedLogGroupName.value = name
  showDeleteLogGroupModal.value = true
}

async function handleDeleteLogGroup() {
  await cw.deleteLogGroup(selectedLogGroupName.value)
  showDeleteLogGroupModal.value = false
  selectedLogGroupName.value = ''
}

// --- Log stream handlers ---
const showCreateLogStreamModal = ref(false)
const createStreamLogGroup = ref('')

function openCreateStreamModal(groupName: string) {
  createStreamLogGroup.value = groupName
  showCreateLogStreamModal.value = true
}

async function handleCreateLogStream(form: { logGroupName: string; logStreamName: string }) {
  await cw.createLogStream(form.logGroupName, form.logStreamName)
  showCreateLogStreamModal.value = false
}

function getAlarmStatus(state: string): 'active' | 'pending' | 'inactive' {
  switch (state) {
    case 'ALARM': return 'active'
    case 'INSUFFICIENT_DATA': return 'pending'
    case 'OK': return 'inactive'
    default: return 'inactive'
  }
}

const headerButtonLabel = computed(() => {
  if (cw.selectedTab.value === 'logs') return 'Create Log Group'
  if (cw.selectedTab.value === 'alarms') return 'Create Alarm'
  return ''
})

const headerResourceCount = computed(() => {
  if (cw.selectedTab.value === 'logs') return `${cw.logGroups.value.length} log group${cw.logGroups.value.length !== 1 ? 's' : ''}`
  if (cw.selectedTab.value === 'alarms') return `${cw.alarms.value.length} alarm${cw.alarms.value.length !== 1 ? 's' : ''}`
  return `${cw.metrics.value.length} metric${cw.metrics.value.length !== 1 ? 's' : ''}`
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="flex-shrink-0 border-b px-6 py-4"
      :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <ChartBarIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">CloudWatch</h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ headerResourceCount }}
          </span>
        </div>
        <Button
          v-if="headerButtonLabel"
          variant="primary"
          @click="cw.selectedTab.value === 'logs' ? showCreateLogGroupModal = true : showCreateAlarmModal = true"
        >
          {{ headerButtonLabel }}
        </Button>
      </div>
    </div>

    <!-- Tab Bar -->
    <div
      class="flex-shrink-0 border-b px-6"
      :class="settingsStore.darkMode ? 'border-dark-border bg-dark-surface' : 'border-light-border bg-light-surface'"
    >
      <div class="flex gap-6">
        <button
          v-for="tab in tabs" :key="tab.id"
          class="py-3 text-sm font-medium border-b-2 transition-colors"
          :class="cw.selectedTab.value === tab.id
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:border-light-border dark:hover:border-dark-border'"
          @click="cw.switchTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <LoadingSpinner v-if="cw.loading.value" size="lg" />

      <!-- Logs Tab -->
      <template v-if="cw.selectedTab.value === 'logs' && !cw.loading.value">
        <EmptyState
          v-if="cw.logGroups.value.length === 0"
          icon="chart-bar"
          title="No CloudWatch Log Groups"
          description="Create your first log group to get started."
          action-label="Create Log Group"
          @action="showCreateLogGroupModal = true"
        />

        <div v-else class="space-y-4">
          <CloudWatchLogsList
            :log-groups="paginatedLogGroups"
            :expanded-log-groups="cw.expandedLogGroups.value"
            :log-streams="cw.logStreams"
            :expanded-log-streams="cw.expandedLogStreams.value"
            :log-events="cw.logEvents"
            @toggle-log-group="cw.toggleLogGroup"
            @toggle-log-stream="cw.toggleLogStream"
            @delete-log-group="openDeleteLogGroupModal"
            @create-stream="openCreateStreamModal"
            @create="showCreateLogGroupModal = true"
          />

          <!-- Pagination for log groups -->
          <div v-if="cw.logGroups.value.length > 0" class="flex flex-wrap items-center justify-between gap-4 py-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="logGroupsPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>
            <div v-if="totalLogGroupPages > 1" class="flex items-center gap-2">
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :disabled="logGroupPage === 1"
                @click="goToLogGroupPage(logGroupPage - 1)"
              >Previous</button>
              <span class="text-sm text-light-muted dark:text-dark-muted">Page {{ logGroupPage }} of {{ totalLogGroupPages }}</span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :disabled="logGroupPage === totalLogGroupPages"
                @click="goToLogGroupPage(logGroupPage + 1)"
              >Next</button>
            </div>
          </div>
        </div>
      </template>

      <!-- Alarms Tab -->
      <template v-if="cw.selectedTab.value === 'alarms' && !cw.loading.value">
        <EmptyState
          v-if="cw.alarms.value.length === 0"
          icon="chart-bar"
          title="No CloudWatch Alarms"
          description="Create your first alarm to get started."
          action-label="Create Alarm"
          @action="showCreateAlarmModal = true"
        />

        <CloudWatchAlarmsList
          v-else
          :alarms="cw.alarms.value"
          :loading="cw.loading.value"
          :expanded-alarms="cw.expandedAlarms.value"
          :alarm-history="cw.alarmHistory"
          :paginated-alarms="paginatedAlarms"
          :alarm-page="alarmPage"
          :total-alarm-pages="totalAlarmPages"
          :alarms-per-page="alarmsPerPage"
          :per-page-options="perPageOptions"
          @toggle-alarm="cw.toggleAlarm"
          @set-alarm-state="handleSetAlarmState"
          @delete-alarm="openDeleteModal"
          @go-to-page="goToAlarmPage"
          @update-alarms-per-page="(val: number) => alarmsPerPage = val"
        />
      </template>

      <!-- Metrics Tab -->
      <template v-if="cw.selectedTab.value === 'metrics' && !cw.loading.value">
        <EmptyState
          v-if="cw.metrics.value.length === 0"
          icon="chart-bar"
          title="No CloudWatch Metrics"
          description="Metrics appear when AWS services publish data."
          action-label="Refresh"
          @action="cw.loadMetrics()"
        />

        <CloudWatchMetricsList
          v-else
          :metrics="cw.metrics.value"
          :loading="cw.loading.value"
          :expanded-metrics="cw.expandedMetrics.value"
          :metric-stats="cw.metricStats"
          :paginated-metrics="paginatedMetrics"
          :metric-page="metricPage"
          :total-metric-pages="totalMetricPages"
          :metrics-per-page="metricsPerPage"
          :per-page-options="perPageOptions"
          @toggle-metric="cw.toggleMetric"
          @go-to-page="goToMetricPage"
          @update-metrics-per-page="(val: number) => metricsPerPage = val"
        />
      </template>
    </div>

    <!-- Modals -->
    <CloudWatchCreateLogGroupModal
      v-model:open="showCreateLogGroupModal"
      @create="handleCreateLogGroup"
    />
    <CloudWatchDeleteLogGroupModal
      v-model:open="showDeleteLogGroupModal"
      :log-group-name="selectedLogGroupName"
      @delete="handleDeleteLogGroup"
    />
    <CloudWatchCreateLogStreamModal
      v-model:open="showCreateLogStreamModal"
      :log-group-name="createStreamLogGroup"
      @create="handleCreateLogStream"
    />
    <CloudWatchCreateAlarmModal
      v-model:open="showCreateAlarmModal"
      v-model:form="alarmForm"
      @create="handleCreateAlarm"
    />
    <CloudWatchDeleteAlarmModal
      v-model:open="showDeleteAlarmModal"
      :alarm-name="selectedAlarmName"
      @delete="handleDeleteAlarm"
    />
    <CloudWatchCodeExamples v-if="!cw.loading.value" />
  </div>
</template>
