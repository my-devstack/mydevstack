<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { CubeIcon } from '@heroicons/vue/24/outline'
import { useCloudFormation } from '@/composables/useCloudFormation'
import {
  StackList,
  CreateStackForm,
} from '@/components/cloudformation'
import CodeSnippet from '@/components/common/CodeSnippet.vue'
import type { CloudFormationStack } from '@/api/types/aws'

interface CreateStackFormRef {
  resetForm: () => void
}

const { reloadTrigger } = useContentReload()
const settingsStore = useSettingsStore()

const {
  stacks,
  loading,
  error,
  codeExamples,
  fetchStacks,
  createStack,
  deleteStack,
  selectStack,
  clearError,
  selectedStackName,
} = useCloudFormation()

const createStackFormRef = ref<CreateStackFormRef | null>(null)

// Modal state
const showCreateModal = ref(false)

// Error handling
const localError = ref<string | null>(null)

// Delete confirmation
const stackToDelete = ref<string | null>(null)
const showDeleteConfirm = ref(false)

// Load stacks on mount
onMounted(() => {
  fetchStacks()
})

// Reload on reload trigger
watch(reloadTrigger, () => {
  fetchStacks()
})

// Create stack
async function handleCreateStack(params: { stackName: string; templateBody: string }) {
  localError.value = null
  try {
    await createStack({
      StackName: params.stackName,
      TemplateBody: params.templateBody,
    })
    createStackFormRef.value?.resetForm()
    showCreateModal.value = false
    // fetchStacks() already called inside createStack() — no reload needed
  } catch (e: any) {
    localError.value = 'Failed to create stack: ' + e.message
  }
}

// Delete stack
function confirmDelete(stackName: string) {
  stackToDelete.value = stackName
  showDeleteConfirm.value = true
}

async function handleDeleteStack() {
  if (!stackToDelete.value) return

  localError.value = null
  try {
    await deleteStack(stackToDelete.value)
    showDeleteConfirm.value = false
    stackToDelete.value = null
  } catch (e: any) {
    localError.value = 'Failed to delete stack: ' + e.message
  }
}

// Select stack (toggle)
function handleSelectStack(stack: CloudFormationStack) {
  selectStack(stack)
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <CubeIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            CloudFormation Stacks
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ stacks.length }} stack(s)
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="showCreateModal = true"
          >
            + Create Stack
          </button>
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="fetchStacks"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div
      v-if="localError || error"
      class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ localError || error }}
      <button
        class="float-right font-bold"
        @click="localError = null; clearError()"
      >
        ×
      </button>
    </div>

    <!-- Stack List (Accordion) -->
    <div class="flex-1 overflow-auto p-6">
      <StackList
        :stacks="stacks"
        :loading="loading"
        :selected-stack-name="selectedStackName"
        @select-stack="handleSelectStack"
        @delete-stack="confirmDelete"
      />
    </div>

    <!-- Create Stack Modal -->
    <CreateStackForm
      ref="createStackFormRef"
      :open="showCreateModal"
      :loading="loading"
      @update:open="showCreateModal = $event"
      @create="handleCreateStack"
    />

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 overflow-y-auto"
    >
      <div
        class="fixed inset-0 bg-black/50"
        @click="showDeleteConfirm = false"
      />
      <div class="flex min-h-screen items-center justify-center p-4">
        <div
          class="relative w-full max-w-md rounded-lg shadow-xl"
          :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-white'"
        >
          <div class="p-6">
            <h3 class="text-lg font-semibold text-red-600">
              Delete Stack
            </h3>
            <p
              class="mt-2"
              :class="settingsStore.darkMode ? 'text-dark-text' : 'text-gray-700'"
            >
              Are you sure you want to delete stack "{{ stackToDelete }}"? This action cannot be undone.
            </p>
          </div>
          <div
            class="flex items-center justify-end gap-3 p-6 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-gray-200'"
          >
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg border"
              :class="settingsStore.darkMode ? 'border-dark-border text-dark-text hover:bg-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-50'"
              @click="showDeleteConfirm = false"
            >
              Cancel
            </button>
            <button
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              :disabled="loading"
              @click="handleDeleteStack"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Examples Section -->
    <div class="mt-8">
      <CodeSnippet
        title="Usage Examples"
        :snippets="codeExamples"
        default-tab="aws-cli"
        :disable-highlight="true"
      />
    </div>
  </div>
</template>
