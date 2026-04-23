<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{
  open: boolean
  tableName: string
  tableDetails: Record<string, any> | null
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'viewStreams': [tableName: string]
}>()

function getKeyTypeLabel(type: string): string {
  const types: Record<string, string> = { 'S': 'String', 'N': 'Number', 'B': 'Binary' }
  return types[type] || type
}

function getBillingModeLabel(mode: string): string {
  const modes: Record<string, string> = { 'PAY_PER_REQUEST': 'On-Demand', 'PROVISIONED': 'Provisioned' }
  return modes[mode] || mode
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="tableName || 'Table Details'"
    size="lg"
    @update:open="emit('update:open', $event)"
  >
    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-8"
    >
      <LoadingSpinner size="lg" />
      <p class="mt-2 text-light-muted dark:text-dark-muted">
        Loading table details...
      </p>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ error }}
    </div>

    <!-- Table Details -->
    <div
      v-else-if="tableDetails"
      class="space-y-4"
    >
      <!-- Status Badge -->
      <div class="flex items-center gap-2">
        <span
          :class="[
            'px-2 py-1 text-xs font-medium rounded-full',
            tableDetails.TableStatus === 'ACTIVE'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          ]"
        >
          {{ tableDetails.TableStatus }}
        </span>
        <span class="text-sm text-light-muted dark:text-dark-muted">
          {{ getBillingModeLabel(tableDetails.BillingModeSummary?.BillingMode || 'PROVISIONED') }}
        </span>
      </div>

      <!-- Key Schema -->
      <div>
        <h4 class="text-sm font-medium mb-2 text-light-text dark:text-dark-text">
          Key Schema
        </h4>
        <div class="space-y-2">
          <div
            v-for="key in tableDetails.KeySchema"
            :key="key.AttributeName"
            class="flex items-center gap-3 p-3 rounded-lg bg-light-bg dark:bg-dark-bg"
          >
            <span
              :class="[
                'px-2 py-0.5 text-xs font-medium rounded',
                key.KeyType === 'HASH'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
              ]"
            >
              {{ key.KeyType }}
            </span>
            <div>
              <span class="font-medium text-light-text dark:text-dark-text">{{ key.AttributeName }}</span>
              <span class="text-sm ml-2 text-light-muted dark:text-dark-muted">
                ({{ getKeyTypeLabel(tableDetails.AttributeDefinitions?.find((a: any) => a.AttributeName === key.AttributeName)?.AttributeType || 'S') }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Attribute Definitions -->
      <div>
        <h4 class="text-sm font-medium mb-2 text-light-text dark:text-dark-text">
          Attribute Definitions
        </h4>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-light-border dark:border-dark-border">
                <th class="px-3 py-2 text-left font-medium text-light-muted dark:text-dark-muted">
                  Attribute
                </th>
                <th class="px-3 py-2 text-left font-medium text-light-muted dark:text-dark-muted">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="attr in tableDetails.AttributeDefinitions"
                :key="attr.AttributeName"
                class="border-b border-light-border dark:border-dark-border"
              >
                <td class="px-3 py-2 text-light-text dark:text-dark-text">
                  {{ attr.AttributeName }}
                </td>
                <td class="px-3 py-2 text-light-muted dark:text-dark-muted">
                  {{ getKeyTypeLabel(attr.AttributeType) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Provisioned Throughput -->
      <div v-if="tableDetails.ProvisionedThroughput">
        <h4 class="text-sm font-medium mb-2 text-light-text dark:text-dark-text">
          Provisioned Throughput
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 rounded-lg bg-light-bg dark:bg-dark-bg">
            <span class="text-xs text-light-muted dark:text-dark-muted">Read Capacity</span>
            <p class="font-medium text-light-text dark:text-dark-text">
              {{ tableDetails.ProvisionedThroughput.ReadCapacityUnits }}
            </p>
          </div>
          <div class="p-3 rounded-lg bg-light-bg dark:bg-dark-bg">
            <span class="text-xs text-light-muted dark:text-dark-muted">Write Capacity</span>
            <p class="font-medium text-light-text dark:text-dark-text">
              {{ tableDetails.ProvisionedThroughput.WriteCapacityUnits }}
            </p>
          </div>
        </div>
      </div>

      <!-- Table Stats -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-light-muted dark:text-dark-muted">Item Count:</span>
          <span class="ml-2 font-medium text-light-text dark:text-dark-text">
            {{ tableDetails.ItemCount || 0 }}
          </span>
        </div>
        <div>
          <span class="text-light-muted dark:text-dark-muted">Table Size:</span>
          <span class="ml-2 font-medium text-light-text dark:text-dark-text">
            {{ tableDetails.TableSizeBytes ? (tableDetails.TableSizeBytes / 1024).toFixed(2) + ' KB' : '0 KB' }}
          </span>
        </div>
      </div>

      <!-- Stream Specification -->
      <div
        v-if="tableDetails.StreamSpecification?.StreamEnabled"
        class="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
      >
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-medium text-blue-800 dark:text-blue-300">
              DynamoDB Streams Enabled
            </h4>
            <p class="text-xs mt-1 text-blue-600 dark:text-blue-400">
              View Type: {{ tableDetails.StreamSpecification.StreamViewType?.replace(/_/g, ' ') }}
            </p>
          </div>
          <Button
            size="sm"
            @click="emit('viewStreams', tableName)"
          >
            View Streams
          </Button>
        </div>
      </div>
      <div
        v-else
        class="p-4 rounded-lg border border-light-border dark:border-dark-border"
      >
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-medium text-light-text dark:text-dark-text">
              DynamoDB Streams
            </h4>
            <p class="text-xs mt-1 text-light-muted dark:text-dark-muted">
              Not enabled for this table
            </p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        variant="secondary"
        @click="emit('update:open', false)"
      >
        Close
      </Button>
    </template>
  </Modal>
</template>