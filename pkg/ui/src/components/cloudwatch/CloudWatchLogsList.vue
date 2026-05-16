<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import ChartBarIcon from '@heroicons/vue/24/outline/ChartBarIcon'
import type { CloudWatchLogGroup, CloudWatchLogStream, CWLogEvent } from '@/api/types/aws'

const props = defineProps<{
  logGroups: CloudWatchLogGroup[]
  expandedLogGroups: Set<string>
  logStreams: Record<string, CloudWatchLogStream[]>
  expandedLogStreams: Set<string>
  logEvents: Record<string, CWLogEvent[]>
}>()

const emit = defineEmits<{
  toggleLogGroup: [name: string]
  toggleLogStream: [groupName: string, streamName: string]
  deleteLogGroup: [name: string]
  create: []
  createStream: [groupName: string]
}>()

const settingsStore = useSettingsStore()

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const val = bytes / Math.pow(1024, i)
  return `${val.toFixed(1)} ${units[i]}`
}

function formatTimestamp(ts: number): string {
  if (!ts) return '-'
  return new Date(ts).toLocaleString()
}

function retentionLabel(days?: number): string {
  if (!days) return 'Never expire'
  if (days === 1) return '1 day'
  if (days < 365) return `${days} days`
  const years = Math.floor(days / 365)
  return `${years} year${years > 1 ? 's' : ''}`
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="group in logGroups"
      :key="group.logGroupName"
      class="border rounded-lg overflow-hidden"
      :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
    >
      <!-- Log Group Row -->
      <div
        class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
        :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
        @click="emit('toggleLogGroup', group.logGroupName)"
      >
        <div class="col-span-6 flex items-center gap-2">
          <ChartBarIcon class="w-5 h-5 text-amber-500 flex-shrink-0" />
          <span class="text-sm text-light-text dark:text-dark-text truncate font-medium">{{ group.logGroupName }}</span>
        </div>
        <div class="col-span-5 text-sm text-light-muted dark:text-dark-muted">
          {{ retentionLabel(group.retentionInDays) }}
        </div>
        <div class="col-span-1 flex items-center justify-end gap-1">
          <button
            class="text-red-500 hover:text-red-700 text-xs px-1"
            title="Delete log group"
            @click.stop="emit('deleteLogGroup', group.logGroupName)"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <svg
            class="w-5 h-5 text-light-muted dark:text-dark-muted transition-transform"
            :class="expandedLogGroups.has(group.logGroupName) ? 'rotate-90' : ''"
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

      <!-- Expanded: Log Streams -->
      <div
        v-if="expandedLogGroups.has(group.logGroupName)"
        class="border-t"
        :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
      >
        <div class="px-4 py-2 bg-light-bg dark:bg-dark-bg">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-light-muted dark:text-dark-muted">Log Streams</span>
            <button
              class="text-xs text-primary-600 hover:text-primary-700 font-medium"
              @click.stop="emit('createStream', group.logGroupName)"
            >
              + Create Stream
            </button>
          </div>
          <template v-if="!logStreams[group.logGroupName]">
            <p class="text-xs text-light-muted dark:text-dark-muted py-2">
              Loading streams...
            </p>
          </template>
          <template v-else-if="logStreams[group.logGroupName].length === 0">
            <p class="text-xs text-light-muted dark:text-dark-muted py-2">
              No log streams found.
            </p>
          </template>
          <template v-else>
            <div
              v-for="stream in logStreams[group.logGroupName]"
              :key="stream.logStreamName"
              class="mb-1"
            >
              <!-- Log Stream Row -->
              <div
                class="grid grid-cols-12 gap-4 px-4 py-2 items-center cursor-pointer hover:bg-light-surface dark:hover:bg-dark-surface rounded"
                @click="emit('toggleLogStream', group.logGroupName, stream.logStreamName)"
              >
                <div class="col-span-5 flex items-center gap-2">
                  <svg
                    class="w-4 h-4 text-blue-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span class="text-sm text-light-text dark:text-dark-text truncate">{{ stream.logStreamName }}</span>
                </div>
                <div class="col-span-3 text-sm text-light-muted dark:text-dark-muted">
                  {{ formatTimestamp(stream.lastEventTimestamp) }}
                </div>
                <div class="col-span-3 text-sm text-light-muted dark:text-dark-muted">
                  {{ formatBytes(stream.storedBytes) }}
                </div>
                <div class="col-span-1 flex justify-end">
                  <svg
                    class="w-4 h-4 text-light-muted dark:text-dark-muted transition-transform"
                    :class="expandedLogStreams.has(group.logGroupName + ':' + stream.logStreamName) ? 'rotate-90' : ''"
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

              <!-- Expanded: Log Events -->
              <div
                v-if="expandedLogStreams.has(group.logGroupName + ':' + stream.logStreamName)"
                class="ml-8 border-l-2 pl-4"
                :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
              >
                <template v-if="!logEvents[group.logGroupName + ':' + stream.logStreamName]">
                  <p class="text-xs text-light-muted dark:text-dark-muted py-1">
                    Loading events...
                  </p>
                </template>
                <template v-else-if="logEvents[group.logGroupName + ':' + stream.logStreamName].length === 0">
                  <p class="text-xs text-light-muted dark:text-dark-muted py-1">
                    No log events found.
                  </p>
                </template>
                <div
                  v-else
                  class="space-y-1 py-1 max-h-64 overflow-y-auto"
                >
                  <div
                    v-for="(event, i) in logEvents[group.logGroupName + ':' + stream.logStreamName]"
                    :key="event.eventId || i"
                    class="text-xs py-1 px-2 rounded bg-light-surface dark:bg-dark-surface border"
                    :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
                  >
                    <span class="font-mono text-light-muted dark:text-dark-muted">{{ formatTimestamp(event.timestamp) }}</span>
                    <pre class="mt-1 whitespace-pre-wrap font-mono text-light-text dark:text-dark-text">{{ event.message }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="flex justify-center py-4">
      <button
        class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        @click="emit('create')"
      >
        + Create Log Group
      </button>
    </div>
  </div>
</template>
