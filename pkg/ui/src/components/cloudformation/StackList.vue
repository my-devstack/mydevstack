<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue'
import { CubeIcon, TrashIcon, ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { listStackResources } from '@/api/services/cloudformation'
import type { CloudFormationStack, CloudFormationOutput, CloudFormationStackResource } from '@/api/types/aws'

const props = defineProps<{
  stacks: CloudFormationStack[]
  loading?: boolean
  selectedStackName?: string | null
}>()

const emit = defineEmits<{
  'select-stack': [stack: CloudFormationStack]
  'delete-stack': [stackName: string]
}>()

const settingsStore = useSettingsStore()
const toast = useToast()

const expandedStack = ref<string | null>(null)

// Resources state per stack - use reactive for deep reactivity
const stackResources = reactive<Record<string, CloudFormationStackResource[]>>({})
const loadingResources = reactive<Record<string, boolean>>({})
const resourcesError = reactive<Record<string, string>>({})

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalPages = computed(() => Math.ceil(props.stacks.length / itemsPerPage.value))
const paginatedStacks = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return props.stacks.slice(start, end)
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Reset to page 1 when itemsPerPage changes
watch(itemsPerPage, () => {
  currentPage.value = 1
})

function toggleExpand(stackName: string) {
  if (expandedStack.value === stackName) {
    expandedStack.value = null
  } else {
    expandedStack.value = stackName
    loadResources(stackName)
  }
}

function isExpanded(stackName: string): boolean {
  return expandedStack.value === stackName
}

function handleRowClick(stack: CloudFormationStack) {
  emit('select-stack', stack)
  toggleExpand(stack.StackName)
}

function handleDelete(stackName: string, event: Event) {
  event.stopPropagation()
  emit('delete-stack', stackName)
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleString()
  } catch {
    return dateStr
  }
}

function statusColor(status: string | undefined): string {
  if (!status) return 'gray'
  if (status.includes('COMPLETE')) return 'green'
  if (status.includes('FAILED')) return 'red'
  if (status.includes('IN_PROGRESS')) return 'yellow'
  return 'gray'
}

function getOutputs(stack: CloudFormationStack): CloudFormationOutput[] {
  return stack.Outputs || []
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  toast.success('Copied', 'Stack ID copied to clipboard')
}

async function loadResources(stackName: string) {
  if (stackResources[stackName] || loadingResources[stackName]) {
    return
  }

  // Reactive update triggers reactivity automatically
  loadingResources[stackName] = true
  resourcesError[stackName] = ''

  try {
    const resources = await listStackResources({ StackName: stackName })
    // Reactive update
    stackResources[stackName] = resources
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load resources'
    // Reactive update
    resourcesError[stackName] = msg
    console.error('[StackList] Failed to load stack resources:', err)
  } finally {
    // Reactive update
    loadingResources[stackName] = false
  }
}

function getStackResources(stackName: string): CloudFormationStackResource[] {
  return stackResources[stackName] || []
}

function isLoadingResources(stackName: string): boolean {
  return loadingResources[stackName] || false
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-12"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading...
      </p>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Empty State -->
      <div
        v-if="stacks.length === 0"
        class="text-center py-12"
      >
        <p
          class="text-lg"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          No stacks found. Create one to get started!
        </p>
      </div>

      <!-- Stack List with Pagination -->
      <div v-else>
        <!-- Pagination Controls (Top) -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
            <select
              v-model="itemsPerPage"
              class="text-sm border rounded px-2 py-1"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
            >
              <option :value="5">
                5
              </option>
              <option :value="10">
                10
              </option>
              <option :value="20">
                20
              </option>
              <option :value="50">
                50
              </option>
            </select>
            <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
          </div>
          <div class="text-sm text-light-muted dark:text-dark-muted">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
        </div>

        <div class="space-y-4">
          <!-- Headers -->
          <div
            class="flex px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b"
            :class="settingsStore.darkMode ? 'text-dark-muted border-dark-border' : 'text-light-muted border-light-border'"
          >
            <div class="w-8 flex-shrink-0" />
            <div class="flex-1 min-w-[150px]">
              Stack Name
            </div>
            <div class="w-48 flex-shrink-0">
              Status
            </div>
            <div class="w-48 flex-shrink-0">
              Created
            </div>
            <div class="w-20 flex-shrink-0 text-right">
              Actions
            </div>
          </div>

          <!-- Rows -->
          <div
            v-for="stack in paginatedStacks"
            :key="stack.StackName"
            class="border rounded-lg overflow-hidden"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <!-- Main Row -->
            <div
              class="flex px-4 py-3 items-center cursor-pointer hover:bg-light-border/30 dark:hover:bg-dark-border/30"
              :class="{
                'border-b': isExpanded(stack.StackName),
                'border-dark-border': settingsStore.darkMode,
                'border-light-border': !settingsStore.darkMode
              }"
              @click="handleRowClick(stack)"
            >
              <div class="w-8 flex-shrink-0" />
              <div class="flex-1 min-w-[150px] font-medium text-light-text dark:text-dark-text truncate flex items-center gap-2">
                <CubeIcon class="h-5 w-5 text-primary-500" />
                {{ stack.StackName }}
              </div>
              <div class="w-48 flex-shrink-0">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800': statusColor(stack.StackStatus) === 'green',
                    'bg-red-100 text-red-800': statusColor(stack.StackStatus) === 'red',
                    'bg-yellow-100 text-yellow-800': statusColor(stack.StackStatus) === 'yellow',
                    'bg-gray-100 text-gray-800': statusColor(stack.StackStatus) === 'gray',
                  }"
                >
                  {{ stack.StackStatus }}
                </span>
              </div>
              <div class="w-48 flex-shrink-0 text-sm text-light-muted dark:text-dark-muted">
                {{ formatDate(stack.CreationTime) }}
              </div>
              <div class="w-20 flex-shrink-0 flex justify-end gap-1">
                <button
                  type="button"
                  aria-label="Delete"
                  class="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                  @click.stop="handleDelete(stack.StackName, $event)"
                >
                  <TrashIcon class="h-4 w-4" />
                </button>
                <svg
                  class="w-5 h-5 transition-transform"
                  :class="{ 'rotate-90': isExpanded(stack.StackName) }"
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

            <!-- Accordion Content (Inline Details) -->
            <div
              v-if="isExpanded(stack.StackName)"
              class="border-t p-4"
              :class="settingsStore.darkMode ? 'border-dark-border bg-dark-bg' : 'border-light-border bg-light-bg'"
            >
              <!-- Stack Info Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg">
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Description
                  </h3>
                  <p class="text-light-text dark:text-dark-text">
                    {{ stack.Description || 'No description' }}
                  </p>
                </div>
                <div class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg">
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Stack ID
                  </h3>
                  <div class="flex items-center gap-2">
                    <p class="text-light-text dark:text-dark-text text-sm truncate flex-1">
                      {{ stack.StackId }}
                    </p>
                    <button
                      type="button"
                      aria-label="Copy Stack ID"
                      class="p-1.5 rounded hover:bg-light-border dark:hover:bg-dark-border text-light-muted dark:text-dark-muted"
                      @click.stop="copyToClipboard(stack.StackId)"
                    >
                      <ClipboardDocumentIcon class="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg">
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Creation Time
                  </h3>
                  <p class="text-light-text dark:text-dark-text">
                    {{ formatDate(stack.CreationTime) }}
                  </p>
                </div>
                <div class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg">
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Last Updated
                  </h3>
                  <p class="text-light-text dark:text-dark-text">
                    {{ formatDate(stack.LastUpdatedTime || stack.CreationTime) }}
                  </p>
                </div>
                <div class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg">
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Capabilities
                  </h3>
                  <p class="text-light-text dark:text-dark-text">
                    {{ (stack.Capabilities || []).join(', ') || 'None' }}
                  </p>
                </div>
                <div class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg">
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Status
                  </h3>
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800': statusColor(stack.StackStatus) === 'green',
                      'bg-red-100 text-red-800': statusColor(stack.StackStatus) === 'red',
                      'bg-yellow-100 text-yellow-800': statusColor(stack.StackStatus) === 'yellow',
                      'bg-gray-100 text-gray-800': statusColor(stack.StackStatus) === 'gray',
                    }"
                  >
                    {{ stack.StackStatus }}
                  </span>
                </div>

                <!-- New Fields -->
                <div
                  v-if="stack.RoleARN"
                  class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg"
                >
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Role ARN
                  </h3>
                  <p class="text-light-text dark:text-dark-text text-sm truncate">
                    {{ stack.RoleARN }}
                  </p>
                </div>
                <div
                  v-if="stack.EnableTerminationProtection !== undefined"
                  class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg"
                >
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Termination Protection
                  </h3>
                  <p class="text-light-text dark:text-dark-text">
                    {{ stack.EnableTerminationProtection ? 'Enabled' : 'Disabled' }}
                  </p>
                </div>
                <div
                  v-if="stack.DriftInformation?.StackDriftStatus"
                  class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg"
                >
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Drift Status
                  </h3>
                  <p class="text-light-text dark:text-dark-text">
                    {{ stack.DriftInformation.StackDriftStatus }}
                  </p>
                </div>
                <div
                  v-if="stack.ParentId || stack.RootId"
                  class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg"
                >
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Parent/Root Stack
                  </h3>
                  <p class="text-light-text dark:text-dark-text text-sm">
                    <span v-if="stack.ParentId">Parent: {{ stack.ParentId }}</span>
                    <span v-if="stack.RootId">Root: {{ stack.RootId }}</span>
                  </p>
                </div>
                <div
                  v-if="stack.Tags?.length"
                  class="p-4 bg-light-surface dark:bg-dark-surface rounded-lg"
                >
                  <h3 class="text-sm font-medium text-light-muted dark:text-dark-muted mb-2">
                    Tags
                  </h3>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in stack.Tags"
                      :key="tag.Key"
                      class="inline-flex items-center px-2 py-1 rounded text-xs bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text"
                    >
                      {{ tag.Key }}={{ tag.Value }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Outputs -->
              <div v-if="getOutputs(stack).length > 0">
                <h3 class="text-lg font-medium text-light-text dark:text-dark-text mb-3">
                  Outputs
                </h3>
                <div class="bg-light-surface dark:bg-dark-surface rounded-lg overflow-hidden">
                  <table class="min-w-full divide-y divide-light-border dark:divide-dark-border">
                    <thead>
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                          Key
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                          Value
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-light-border dark:divide-dark-border">
                      <tr
                        v-for="output in getOutputs(stack)"
                        :key="output.OutputKey"
                      >
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-light-text dark:text-dark-text">
                          {{ output.OutputKey }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-light-muted dark:text-dark-muted">
                          {{ output.OutputValue }}
                        </td>
                        <td class="px-6 py-4 text-sm text-light-muted dark:text-dark-muted">
                          {{ output.Description || 'N/A' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Resources -->
              <div class="mt-4">
                <h3 class="text-lg font-medium text-light-text dark:text-dark-text mb-3">
                  Resources
                </h3>
                <div
                  v-if="isLoadingResources(stack.StackName)"
                  class="text-center py-4"
                >
                  <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
                  <p class="mt-2 text-sm text-light-muted dark:text-dark-muted">
                    Loading resources...
                  </p>
                </div>
                <div
                  v-else-if="resourcesError[stack.StackName]"
                  class="text-center py-4 text-red-600 dark:text-red-400"
                >
                  {{ resourcesError[stack.StackName] }}
                </div>
                <div
                  v-else-if="getStackResources(stack.StackName).length > 0"
                  class="bg-light-surface dark:bg-dark-surface rounded-lg overflow-hidden"
                >
                  <table class="min-w-full divide-y divide-light-border dark:divide-dark-border">
                    <thead>
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                          Logical ID
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                          Type
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                          Physical ID
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                          Status
                        </th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
                          Last Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-light-border dark:divide-dark-border">
                      <tr
                        v-for="resource in getStackResources(stack.StackName)"
                        :key="resource.LogicalResourceId"
                      >
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-light-text dark:text-dark-text">
                          {{ resource.LogicalResourceId }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-light-muted dark:text-dark-muted">
                          {{ resource.ResourceType }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-light-muted dark:text-dark-muted truncate max-w-xs">
                          {{ resource.PhysicalResourceId || 'N/A' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            :class="{
                              'bg-green-100 text-green-800': resource.ResourceStatus === 'CREATE_COMPLETE' || resource.ResourceStatus === 'UPDATE_COMPLETE',
                              'bg-red-100 text-red-800': resource.ResourceStatus?.includes('FAILED'),
                              'bg-yellow-100 text-yellow-800': resource.ResourceStatus?.includes('IN_PROGRESS'),
                              'bg-gray-100 text-gray-800': true,
                            }"
                          >
                            {{ resource.ResourceStatus }}
                          </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-light-muted dark:text-dark-muted">
                          {{ formatDate(resource.LastUpdatedTimestamp) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div
                  v-else
                  class="text-center py-4 text-light-muted dark:text-dark-muted"
                >
                  No resources found
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination Controls (Bottom) -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-center gap-2 mt-4"
        >
          <button
            class="px-3 py-1 text-sm border rounded disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text hover:bg-dark-border' : 'border-light-border text-light-text hover:bg-light-border'"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </button>

          <button
            v-for="page in totalPages"
            :key="page"
            class="px-3 py-1 text-sm border rounded"
            :class="[
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : settingsStore.darkMode
                  ? 'border-dark-border text-dark-text hover:bg-dark-border'
                  : 'border-light-border text-light-text hover:bg-light-border'
            ]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>

          <button
            class="px-3 py-1 text-sm border rounded disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text hover:bg-dark-border' : 'border-light-border text-light-text hover:bg-light-border'"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
