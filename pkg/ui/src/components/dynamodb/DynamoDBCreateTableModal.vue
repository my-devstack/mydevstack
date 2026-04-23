<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'

const props = defineProps<{
  open: boolean
  tableName: string
  partitionKeyName: string
  partitionKeyType: string
  hasSortKey: boolean
  sortKeyName: string
  sortKeyType: string
  billingMode: string
  readCapacity: number
  writeCapacity: number
  enableStreams: boolean
  streamViewType: string
  creating: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:tableName': [value: string]
  'update:partitionKeyName': [value: string]
  'update:partitionKeyType': [value: string]
  'update:hasSortKey': [value: boolean]
  'update:sortKeyName': [value: string]
  'update:sortKeyType': [value: string]
  'update:billingMode': [value: string]
  'update:readCapacity': [value: number]
  'update:writeCapacity': [value: number]
  'update:enableStreams': [value: boolean]
  'update:streamViewType': [value: string]
  'create': []
}>()

function handleClose() {
  emit('update:open', false)
}

function handleCreate() {
  emit('create')
}

const canCreate = () => props.tableName.trim() && props.partitionKeyName.trim() && !props.creating
</script>

<template>
  <Modal
    :open="props.open"
    title="Create DynamoDB Table"
    size="lg"
    @update:open="handleClose"
  >
    <div class="space-y-6">
      <!-- Table Name -->
      <div>
        <label class="block text-sm font-medium mb-1 text-light-text dark:text-dark-text">
          Table Name *
        </label>
        <input
          :value="tableName"
          type="text"
          placeholder="my-table"
          class="w-full px-3 py-2 rounded-lg border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
          @input="emit('update:tableName', ($event.target as HTMLInputElement).value)"
        >
      </div>

      <!-- Partition Key -->
      <div class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg">
        <h4 class="text-sm font-medium mb-3 text-light-text dark:text-dark-text">
          Partition Key (Required)
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs mb-1 text-light-muted dark:text-dark-muted">
              Attribute Name
            </label>
            <input
              :value="partitionKeyName"
              type="text"
              placeholder="pk"
              class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
              @input="emit('update:partitionKeyName', ($event.target as HTMLInputElement).value)"
            >
          </div>
          <div>
            <label class="block text-xs mb-1 text-light-muted dark:text-dark-muted">
              Type
            </label>
            <select
              :value="partitionKeyType"
              class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
              @change="emit('update:partitionKeyType', ($event.target as HTMLSelectElement).value)"
            >
              <option value="S">
                String
              </option>
              <option value="N">
                Number
              </option>
              <option value="B">
                Binary
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Sort Key -->
      <div class="p-4 rounded-lg bg-light-bg dark:bg-dark-bg">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-sm font-medium text-light-text dark:text-dark-text">
            Sort Key (Optional)
          </h4>
          <label class="flex items-center gap-2 text-sm">
            <input
              :checked="hasSortKey"
              type="checkbox"
              class="rounded border-light-border dark:border-dark-border"
              @change="emit('update:hasSortKey', ($event.target as HTMLInputElement).checked)"
            >
            <span class="text-light-muted dark:text-dark-muted">Enable</span>
          </label>
        </div>
        <div
          v-if="hasSortKey"
          class="grid grid-cols-2 gap-4"
        >
          <div>
            <label class="block text-xs mb-1 text-light-muted dark:text-dark-muted">
              Attribute Name
            </label>
            <input
              :value="sortKeyName"
              type="text"
              placeholder="sk"
              class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
              @input="emit('update:sortKeyName', ($event.target as HTMLInputElement).value)"
            >
          </div>
          <div>
            <label class="block text-xs mb-1 text-light-muted dark:text-dark-muted">
              Type
            </label>
            <select
              :value="sortKeyType"
              class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
              @change="emit('update:sortKeyType', ($event.target as HTMLSelectElement).value)"
            >
              <option value="S">
                String
              </option>
              <option value="N">
                Number
              </option>
              <option value="B">
                Binary
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Billing Mode -->
      <div>
        <label class="block text-sm font-medium mb-2 text-light-text dark:text-dark-text">
          Billing Mode
        </label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2">
            <input
              :checked="billingMode === 'PAY_PER_REQUEST'"
              type="radio"
              value="PAY_PER_REQUEST"
              class="border-light-border dark:border-dark-border"
              @change="emit('update:billingMode', 'PAY_PER_REQUEST')"
            >
            <span class="text-sm text-light-text dark:text-dark-text">On-Demand</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              :checked="billingMode === 'PROVISIONED'"
              type="radio"
              value="PROVISIONED"
              class="border-light-border dark:border-dark-border"
              @change="emit('update:billingMode', 'PROVISIONED')"
            >
            <span class="text-sm text-light-text dark:text-dark-text">Provisioned</span>
          </label>
        </div>
      </div>

      <!-- Provisioned Throughput (if PROVISIONED) -->
      <div
        v-if="billingMode === 'PROVISIONED'"
        class="grid grid-cols-2 gap-4"
      >
        <div>
          <label class="block text-xs mb-1 text-light-muted dark:text-dark-muted">
            Read Capacity Units
          </label>
          <input
            :value="readCapacity"
            type="number"
            min="1"
            class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
            @input="emit('update:readCapacity', Number(($event.target as HTMLInputElement).value))"
          >
        </div>
        <div>
          <label class="block text-xs mb-1 text-light-muted dark:text-dark-muted">
            Write Capacity Units
          </label>
          <input
            :value="writeCapacity"
            type="number"
            min="1"
            class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
            @input="emit('update:writeCapacity', Number(($event.target as HTMLInputElement).value))"
          >
        </div>
      </div>

      <!-- Stream Settings -->
      <div class="p-4 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h4 class="text-sm font-medium text-light-text dark:text-dark-text">
              DynamoDB Streams
            </h4>
            <p class="text-xs mt-1 text-light-muted dark:text-dark-muted">
              Capture item-level changes in your table
            </p>
          </div>
          <label class="flex items-center gap-2">
            <input
              :checked="enableStreams"
              type="checkbox"
              class="rounded border-light-border dark:border-dark-border"
              @change="emit('update:enableStreams', ($event.target as HTMLInputElement).checked)"
            >
            <span class="text-sm text-light-text dark:text-dark-text">Enable</span>
          </label>
        </div>
        
        <div
          v-if="enableStreams"
          class="mt-3"
        >
          <label class="block text-xs mb-1 text-light-muted dark:text-dark-muted">
            Stream View Type
          </label>
          <select
            :value="streamViewType"
            class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
            @change="emit('update:streamViewType', ($event.target as HTMLSelectElement).value)"
          >
            <option value="KEYS_ONLY">
              Keys Only
            </option>
            <option value="NEW_IMAGE">
              New Image
            </option>
            <option value="OLD_IMAGE">
              Old Image
            </option>
            <option value="NEW_AND_OLD_IMAGES">
              New and Old Images
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button
        :disabled="!canCreate()"
        @click="handleCreate"
      >
        {{ creating ? 'Creating...' : 'Create Table' }}
      </Button>
    </template>
  </Modal>
</template>