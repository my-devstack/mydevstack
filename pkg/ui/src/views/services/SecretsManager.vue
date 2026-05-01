<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'
import { ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { useSecretsManager } from '@/composables/useSecretsManager'
import {
  SecretsList,
  CreateSecretModal,
  EditSecretModal,
  DeleteSecretModal,
} from '@/components/secretsmanager'

const settingsStore = useSettingsStore()

const {
  // State
  secrets,
  loading,
  error,
  showCreateModal,
  newSecretName,
  newSecretValue,
  newSecretDescription,
  creating,
  showViewModal,
  selectedSecret,
  secretValue,
  secretLoading,
  secretError,
  isEditing,
  editSecretValue,
  showDeleteModal,
  secretToDelete,
  expandedSecret,
  secretDetailsMap,

  // Computed
  codeExamples,
  selectedExample,

  // Functions
  openCreateModal,
  createSecret,
  viewSecret,
  toggleEdit,
  saveSecretValue,
  openDeleteModal,
  confirmDeleteSecret,
  closeViewModal,
  openEditModal,
  toggleSecretExpansion,
  formatDate,
  formatSecretPreview,
  isJson,
} = useSecretsManager()
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4 -mx-6 -mt-6 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <ShieldCheckIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            Secrets Manager
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ secrets.length }} secret{{ secrets.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="openCreateModal"
          >
            + Create Secret
          </button>
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadSecrets"
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
      v-if="error"
      class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ error }}
    </div>

    <!-- Secret List (Accordion) -->
    <SecretsList
      :secrets="secrets"
      :loading="loading"
      :secret-details-map="secretDetailsMap"
      :expanded-secret="expandedSecret"
      @view-secret="viewSecret"
      @open-delete="openDeleteModal"
      @toggle-expansion="toggleSecretExpansion"
      @open-edit="openEditModal"
    />

    <!-- Example Code Section -->
    <div
      v-if="!loading && secrets.length > 0"
      class="mt-8"
    >
      <h2
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Usage Examples
      </h2>
      <div
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          class="flex border-b"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <button
            v-for="(example, index) in codeExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              selectedExample === index
                ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="selectedExample = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >{{ codeExamples[selectedExample].code }}</pre>
        </div>
      </div>
    </div>

    <!-- Create Secret Modal -->
    <CreateSecretModal
      :open="showCreateModal"
      :creating="creating"
      :new-secret-name="newSecretName"
      :new-secret-value="newSecretValue"
      :new-secret-description="newSecretDescription"
      @update:open="showCreateModal = $event"
      @update:new-secret-name="newSecretName = $event"
      @update:new-secret-value="newSecretValue = $event"
      @update:new-secret-description="newSecretDescription = $event"
      @create="createSecret"
    />

    <!-- Edit/View Secret Modal -->
    <EditSecretModal
      :open="showViewModal"
      :loading="secretLoading"
      :secret-name="selectedSecret?.Name || ''"
      :secret-value="secretValue"
      :is-editing="isEditing"
      :edit-secret-value="editSecretValue"
      @update:open="showViewModal = $event"
      @update:edit-secret-value="editSecretValue = $event"
      @save="saveSecretValue"
      @toggle-edit="toggleEdit"
      @close="closeViewModal"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteSecretModal
      :open="showDeleteModal"
      :loading="loading"
      :secret-to-delete="secretToDelete"
      @update:open="showDeleteModal = $event"
      @confirm="confirmDeleteSecret"
    />
  </div>
</template>
