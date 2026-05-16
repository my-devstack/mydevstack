<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import ChartBarIcon from '@heroicons/vue/24/outline/ChartBarIcon'
import StatusBadge from '@/components/common/StatusBadge.vue'
import Button from '@/components/common/Button.vue'
import type { CWAlarm } from '@/api/types/aws'

const props = defineProps<{
  alarms: CWAlarm[]
  loading: boolean
  expandedAlarms: Set<string>
  alarmHistory: Record<string, any[]>
  paginatedAlarms: CWAlarm[]
  alarmPage: number
  totalAlarmPages: number
  alarmsPerPage: number
  perPageOptions: number[]
}>()

const emit = defineEmits<{
  toggleAlarm: [name: string]
  setAlarmState: [name: string, state: string]
  deleteAlarm: [name: string]
  create: []
  goToPage: [page: number]
  updateAlarmsPerPage: [val: number]
}>()

const settingsStore = useSettingsStore()

function getAlarmStatus(state: string): 'active' | 'pending' | 'inactive' {
  switch (state) {
    case 'ALARM': return 'active'
    case 'INSUFFICIENT_DATA': return 'pending'
    case 'OK': return 'inactive'
    default: return 'inactive'
  }
}
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="alarm in paginatedAlarms"
      :key="alarm.AlarmName"
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <div
        class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
        :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
        @click="emit('toggleAlarm', alarm.AlarmName)"
      >
        <div class="col-span-5 flex items-center gap-2">
          <ChartBarIcon class="w-5 h-5 text-orange-500 flex-shrink-0" />
          <span class="text-sm text-light-text dark:text-dark-text truncate font-medium">{{ alarm.AlarmName }}</span>
        </div>
        <div class="col-span-2">
          <StatusBadge
            :status="getAlarmStatus(alarm.StateValue)"
            :label="alarm.StateValue"
          />
        </div>
        <div class="col-span-2 text-sm text-light-muted dark:text-dark-muted">
          {{ alarm.MetricName || '-' }}
        </div>
        <div class="col-span-2 text-sm text-light-muted dark:text-dark-muted truncate">
          {{ alarm.Namespace || '-' }}
        </div>
        <div class="col-span-1 flex items-center justify-end gap-1">
          <svg
            class="w-5 h-5 text-light-muted dark:text-dark-muted transition-transform"
            :class="expandedAlarms.has(alarm.AlarmName) ? 'rotate-90' : ''"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>

      <div
        v-if="expandedAlarms.has(alarm.AlarmName)"
        class="px-4 pb-4 border-t"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <div class="mt-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Threshold</label>
              <span class="text-sm">{{ alarm.Threshold ?? '-' }}</span>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Period</label>
              <span class="text-sm">{{ alarm.Period ? `${alarm.Period}s` : '-' }}</span>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Comparison</label>
              <span class="text-sm">{{ alarm.ComparisonOperator || '-' }}</span>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">State Reason</label>
              <span class="text-sm">{{ alarm.StateReason || '-' }}</span>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Evaluation Periods</label>
              <span class="text-sm">{{ alarm.EvaluationPeriods ?? '-' }}</span>
            </div>
            <div>
              <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Statistic</label>
              <span class="text-sm">{{ alarm.Statistic || '-' }}</span>
            </div>
          </div>

          <div v-if="alarm.Dimensions?.length">
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Dimensions</label>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(d, i) in alarm.Dimensions"
                :key="i"
                class="text-xs bg-light-border dark:bg-dark-border px-2 py-0.5 rounded"
              >
                {{ d.Name }}={{ d.Value }}
              </span>
            </div>
          </div>

          <div class="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              @click.stop="emit('setAlarmState', alarm.AlarmName, 'ALARM')"
            >
              Set ALARM
            </Button>
            <Button
              variant="secondary"
              size="sm"
              @click.stop="emit('setAlarmState', alarm.AlarmName, 'OK')"
            >
              Set OK
            </Button>
            <Button
              variant="secondary"
              size="sm"
              @click.stop="emit('setAlarmState', alarm.AlarmName, 'INSUFFICIENT_DATA')"
            >
              Set INSUFFICIENT
            </Button>
            <Button
              variant="danger"
              size="sm"
              @click.stop="emit('deleteAlarm', alarm.AlarmName)"
            >
              Delete
            </Button>
          </div>

          <div v-if="alarmHistory[alarm.AlarmName]?.length">
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">History</label>
            <div
              v-for="(h, i) in alarmHistory[alarm.AlarmName]"
              :key="i"
              class="text-xs py-1"
            >
              {{ h.Timestamp ? new Date(h.Timestamp).toLocaleString() : '' }} — {{ h.HistorySummary }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="alarms.length > 0"
      class="flex flex-wrap items-center justify-between gap-4 py-4"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
        <select
          :value="alarmsPerPage"
          class="text-sm border rounded px-2 py-1"
          :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
          @change="emit('updateAlarmsPerPage', Number(($event.target as HTMLSelectElement).value))"
        >
          <option
            v-for="opt in perPageOptions"
            :key="opt"
            :value="opt"
          >
            {{ opt }}
          </option>
        </select>
        <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
      </div>
      <div
        v-if="totalAlarmPages > 1"
        class="flex items-center gap-2"
      >
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :disabled="alarmPage === 1"
          @click="emit('goToPage', alarmPage - 1)"
        >
          Previous
        </button>
        <span class="text-sm text-light-muted dark:text-dark-muted">Page {{ alarmPage }} of {{ totalAlarmPages }}</span>
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :disabled="alarmPage === totalAlarmPages"
          @click="emit('goToPage', alarmPage + 1)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
