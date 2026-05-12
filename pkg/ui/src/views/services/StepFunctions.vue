<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePagination } from '@/composables/usePagination'
import { useStepFunctions } from '@/composables/useStepFunctions'
import { useSettingsStore } from '@/stores/settings'
import StepFunctionsList from '@/components/stepfunctions/StepFunctionsList.vue'
import StepFunctionsCreateModal from '@/components/stepfunctions/StepFunctionsCreateModal.vue'
import StepFunctionsDeleteModal from '@/components/stepfunctions/StepFunctionsDeleteModal.vue'
import StepFunctionsDetail from '@/components/stepfunctions/StepFunctionsDetail.vue'
import StepFunctionsExecutionList from '@/components/stepfunctions/StepFunctionsExecutionList.vue'
import StepFunctionsExecutionDetail from '@/components/stepfunctions/StepFunctionsExecutionDetail.vue'
import StepFunctionsStartExecutionModal from '@/components/stepfunctions/StepFunctionsStartExecutionModal.vue'
import StepFunctionsHistoryModal from '@/components/stepfunctions/StepFunctionsHistoryModal.vue'
import StepFunctionsCodeExamples from '@/components/stepfunctions/StepFunctionsCodeExamples.vue'

const settingsStore = useSettingsStore()

const {
  loading, stateMachines, executions, selectedStateMachine,
  executionLoading, selectedExecution, executionHistory, historyLoading,
  showCreateModal, showDeleteModal, showStartExecutionModal,
  showExecutionDetailModal, showExecutionHistoryModal,
  newMachineName, newMachineDefinition, newMachineRoleArn, newMachineType,
  newExecutionInput, stateMachineToDelete,
  stateMachineColumns, executionColumns, executionHistoryColumns,
  loadStateMachines, selectStateMachine, loadStateMachineDetails, createStateMachine,
  deleteStateMachine, startExecution, stopExecution,
  loadExecutions, describeExecution, getExecutionHistory,
  openDeleteModal, resetForm, formatDate, getStatusType,
} = useStepFunctions()

// Pagination via composable
const {
  currentPage: stepfunctionsPage,
  itemsPerPage: stepfunctionsPerPage,
  totalPages: totalStepFunctionsPages,
  paginatedItems: paginatedStepFunctions,
  goToPage,
  perPageOptions,
} = usePagination(stateMachines, { defaultPerPage: 10 })

// Navigation
function goBack() {
  selectedStateMachine.value = null
  executions.value = []
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1
          class="text-2xl font-bold"
          :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
        >
          {{ selectedStateMachine ? selectedStateMachine.name : 'Step Functions' }}
        </h1>
        <span
          v-if="!selectedStateMachine"
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          {{ stateMachines.length }} state machine(s)
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="selectedStateMachine"
          class="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
          @click="goBack"
        >
          ← Back to State Machines
        </button>
        <button
          v-if="!selectedStateMachine"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          @click="showCreateModal = true"
        >
          Create State Machine
        </button>
      </div>
    </div>

    <!-- State Machines List (when no selection) -->
    <StepFunctionsList
      v-if="!selectedStateMachine"
      :state-machines="paginatedStepFunctions"
      :loading="loading"
      :get-details="loadStateMachineDetails"
      @select="(m) => {}"
      @delete="openDeleteModal"
      @view-detail="selectStateMachine"
    />

    <!-- Pagination -->
    <div
      v-if="!loading && !selectedStateMachine && stateMachines.length > 0"
      class="flex flex-wrap items-center justify-between gap-4 py-4"
    >
      <div class="flex items-center gap-2">
        <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
        <select
          v-model="stepfunctionsPerPage"
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
        v-if="totalStepFunctionsPages > 1"
        class="flex items-center gap-2"
      >
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
          :disabled="stepfunctionsPage === 1"
          @click="goToPage(stepfunctionsPage - 1)"
        >
          Previous
        </button>
        <span
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
        >
          Page {{ stepfunctionsPage }} of {{ totalStepFunctionsPages }}
        </span>
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
          :disabled="stepfunctionsPage === totalStepFunctionsPages"
          @click="goToPage(stepfunctionsPage + 1)"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Detail Section (when machine selected) -->
    <div
      v-if="selectedStateMachine"
      class="space-y-6"
    >
      <StepFunctionsDetail
        :state-machine="selectedStateMachine"
        @back="goBack"
      />

      <!-- Executions Sub-section -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2
            class="text-lg font-medium"
            :class="settingsStore.darkMode ? 'text-dark-text' : 'text-light-text'"
          >
            Executions
          </h2>
          <button
            class="px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
            @click="showStartExecutionModal = true"
          >
            Start Execution
          </button>
        </div>

        <StepFunctionsExecutionList
          :executions="executions"
          :loading="executionLoading"
          @view-detail="(exec) => describeExecution(exec.executionArn)"
          @view-history="(exec) => getExecutionHistory(exec.executionArn)"
          @stop="(exec) => stopExecution(exec.executionArn)"
        />
      </div>
    </div>

    <!-- Modals -->
    <StepFunctionsCreateModal
      :open="showCreateModal"
      :loading="loading"
      :new-machine-name="newMachineName"
      :new-machine-definition="newMachineDefinition"
      :new-machine-role-arn="newMachineRoleArn"
      :new-machine-type="newMachineType"
      @update:open="showCreateModal = $event"
      @update:new-machine-name="newMachineName = $event"
      @update:new-machine-definition="newMachineDefinition = $event"
      @update:new-machine-role-arn="newMachineRoleArn = $event"
      @update:new-machine-type="newMachineType = $event"
      @create="createStateMachine"
    />

    <StepFunctionsDeleteModal
      :open="showDeleteModal"
      :loading="loading"
      :state-machine-to-delete="stateMachineToDelete"
      @update:open="showDeleteModal = $event"
      @confirm="deleteStateMachine"
    />

    <StepFunctionsStartExecutionModal
      :open="showStartExecutionModal"
      :loading="executionLoading"
      :new-execution-input="newExecutionInput"
      :state-machine-name="selectedStateMachine?.name || ''"
      @update:open="showStartExecutionModal = $event"
      @update:new-execution-input="newExecutionInput = $event"
      @start="startExecution"
    />

    <StepFunctionsExecutionDetail
      v-if="showExecutionDetailModal"
      :execution="selectedExecution"
      :loading="false"
      @back="showExecutionDetailModal = false"
    />

    <StepFunctionsHistoryModal
      :open="showExecutionHistoryModal"
      :loading="historyLoading"
      :events="executionHistory"
      :columns="executionHistoryColumns"
      :format-date="formatDate"
      @update:open="showExecutionHistoryModal = $event"
    />

    <!-- Usage Examples -->
    <StepFunctionsCodeExamples
      v-if="!selectedStateMachine"
    />
  </div>
</template>
