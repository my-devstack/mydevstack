<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { PlusIcon, ArrowPathIcon, KeyIcon, BeakerIcon } from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { usePagination } from '@/composables/usePagination'
import { useSSM } from '@/composables/useSSM'
import {
  SSMParametersList,
  SSMCreateModal,
  SSMValueModal,
  SSMHistoryModal,
  SSMDeleteModal,
} from '@/components/ssm'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const settingsStore = useSettingsStore()

const {
  // State
  loading,
  parameters,
  selectedParameter,
  parameterHistory,
  historyLoading,
  showCreateModal,
  showValueModal,
  showHistoryModal,
  showDeleteModal,
  newParamName,
  newParamValue,
  newParamType,
  newParamDescription,
  parameterToDelete,

  // Computed
  paramColumns,
  historyColumns,
  codeExamples,

  // Functions
  loadParameters,
  selectParameter,
  getParameterValue,
  loadParameterHistory,
  createParameter,
  updateParameter,
  deleteParameter,
  openDeleteModal,
  formatDate,
} = useSSM()

// Pagination via composable
const {
  currentPage: paramPage,
  itemsPerPage: paramsPerPage,
  totalPages: totalParamPages,
  paginatedItems: paginatedParameters,
  goToPage,
  perPageOptions,
} = usePagination(parameters, { defaultPerPage: 10 })
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div
      class="p-4 border-b flex items-center justify-between"
      :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'"
    >
      <div class="flex items-center gap-3">
        <KeyIcon
          class="h-6 w-6"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        />
        <h1
          class="text-xl font-semibold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          Parameter Store
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          :loading="loading"
          @click="loadParameters"
        >
          <ArrowPathIcon class="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          aria-label="Create Parameter"
          @click="showCreateModal = true"
        >
          <PlusIcon class="h-4 w-4 mr-1" />Create Parameter
        </Button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <!-- Parameter List: show when loading OR have parameters -->
      <SSMParametersList
        v-if="loading || parameters.length > 0"
        :parameters="paginatedParameters"
        :loading="loading"
        @select="selectParameter"
        @view-value="getParameterValue"
        @view-history="(param) => { selectParameter(param); loadParameterHistory(); }"
        @delete="openDeleteModal"
      />

      <!-- Pagination -->
      <div
        v-if="parameters.length > 0"
        class="flex flex-wrap items-center justify-between gap-4 py-4"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
          <select
            v-model="paramsPerPage"
            class="text-sm border rounded px-2 py-1"
            :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
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
          v-if="totalParamPages > 1"
          class="flex items-center gap-2"
        >
          <button
            class="px-3 py-1 rounded border disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            :disabled="paramPage === 1"
            @click="goToPage(paramPage - 1)"
          >
            Previous
          </button>
          <span
            class="text-sm"
            :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
          >
            Page {{ paramPage }} of {{ totalParamPages }}
          </span>
          <button
            class="px-3 py-1 rounded border disabled:opacity-50"
            :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
            :disabled="paramPage === totalParamPages"
            @click="goToPage(paramPage + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <!-- Empty State: only when not loading AND no parameters -->
      <EmptyState
        v-if="!loading && parameters.length === 0"
        icon="folder"
        title="No Parameters"
        description="Create your first parameter to store and manage configuration data."
        @action="showCreateModal = true"
      />
    </div>

    <!-- Create Parameter Modal -->
    <SSMCreateModal
      :open="showCreateModal"
      :loading="loading"
      :new-param-name="newParamName"
      :new-param-value="newParamValue"
      :new-param-type="newParamType"
      :new-param-description="newParamDescription"
      @update:open="showCreateModal = $event"
      @update:new-param-name="newParamName = $event"
      @update:new-param-value="newParamValue = $event"
      @update:new-param-type="newParamType = $event"
      @update:new-param-description="newParamDescription = $event"
      @create="createParameter"
    />

    <!-- View Value Modal -->
    <SSMValueModal
      :open="showValueModal"
      :loading="loading"
      :parameter="selectedParameter"
      @update:open="showValueModal = $event"
      @update:new-param-value="newParamValue = $event"
      @update="updateParameter"
    />

    <!-- Parameter History Modal -->
    <SSMHistoryModal
      :open="showHistoryModal"
      :loading="historyLoading"
      :history="parameterHistory"
      :columns="historyColumns"
      @update:open="showHistoryModal = $event"
    />

    <!-- Delete Confirmation Modal -->
    <SSMDeleteModal
      :open="showDeleteModal"
      :loading="loading"
      :parameter-to-delete="parameterToDelete"
      @update:open="showDeleteModal = $event"
      @confirm="deleteParameter"
    />

    <!-- Usage Examples -->
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
