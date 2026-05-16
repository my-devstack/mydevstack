<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import ChartBarIcon from '@heroicons/vue/24/outline/ChartBarIcon'
import type { CWMetric } from '@/api/types/aws'

const props = defineProps<{
  metrics: CWMetric[]
  loading: boolean
  expandedMetrics: Set<string>
  metricStats: Record<string, any[]>
  paginatedMetrics: CWMetric[]
  metricPage: number
  totalMetricPages: number
  metricsPerPage: number
  perPageOptions: number[]
}>()

const emit = defineEmits<{
  toggleMetric: [key: string]
  goToPage: [page: number]
  updateMetricsPerPage: [val: number]
}>()

const settingsStore = useSettingsStore()
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="metric in paginatedMetrics"
      :key="metric.MetricName + metric.Namespace"
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <div
        class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
        :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
        @click="emit('toggleMetric', metric.MetricName + metric.Namespace)"
      >
        <div class="col-span-6 flex items-center gap-2">
          <ChartBarIcon class="w-5 h-5 text-blue-500 flex-shrink-0" />
          <span class="text-sm font-medium">{{ metric.MetricName }}</span>
        </div>
        <div class="col-span-4 text-sm text-light-muted dark:text-dark-muted">{{ metric.Namespace }}</div>
        <div class="col-span-2 flex justify-end">
          <svg
            class="w-5 h-5 text-light-muted transition-transform"
            :class="expandedMetrics.has(metric.MetricName + metric.Namespace) ? 'rotate-90' : ''"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      <div
        v-if="expandedMetrics.has(metric.MetricName + metric.Namespace)"
        class="px-4 pb-4 border-t"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <div class="mt-4">
          <p class="text-sm text-light-muted dark:text-dark-muted">
            Dimensions: {{ metric.Dimensions?.map((d: any) => `${d.Name}=${d.Value}`).join(', ') || 'None' }}
          </p>
          <div v-if="metricStats[metric.MetricName + metric.Namespace]" class="mt-2">
            <table class="w-full text-xs">
              <thead>
                <tr>
                  <th class="text-left py-1">Timestamp</th>
                  <th class="text-right py-1">Average</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(stat, i) in metricStats[metric.MetricName + metric.Namespace]" :key="i">
                  <td class="py-1">{{ stat.Timestamp ? new Date(stat.Timestamp).toLocaleString() : '-' }}</td>
                  <td class="text-right py-1">{{ stat.Average ?? stat.Value ?? '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-xs text-light-muted dark:text-dark-muted mt-1">Loading statistics...</p>
        </div>
      </div>
    </div>

    <div v-if="metrics.length > 0" class="flex flex-wrap items-center justify-between gap-4 py-4">
      <div class="flex items-center gap-2">
        <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
        <select
          :value="metricsPerPage"
          class="text-sm border rounded px-2 py-1"
          :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
          @change="emit('updateMetricsPerPage', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
      </div>
      <div v-if="totalMetricPages > 1" class="flex items-center gap-2">
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :disabled="metricPage === 1"
          @click="emit('goToPage', metricPage - 1)"
        >Previous</button>
        <span class="text-sm">Page {{ metricPage }} of {{ totalMetricPages }}</span>
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :disabled="metricPage === totalMetricPages"
          @click="emit('goToPage', metricPage + 1)"
        >Next</button>
      </div>
    </div>
  </div>
</template>
