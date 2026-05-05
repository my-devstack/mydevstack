<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps<{
  open: boolean
  tableName: string
  scanMode: 'scan' | 'query'
  error: string | null
  loading: boolean
  items: Record<string, any>[]
  lastEvaluatedKey: Record<string, any> | null
  tableDetails: Record<string, any> | null
  pkName: string
  skName: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:scanMode': [value: 'scan' | 'query']
  'update:partitionKeyValue': [value: string]
  'update:sortKeyCondition': [value: string]
  'update:sortKeyValue': [value: string]
  'scan': []
  'query': []
  'loadMore': []
  'deleteItem': [item: Record<string, any>]
  'addItem': []
}>()

const allAttributes = computed(() => {
  const attrs = new Set<string>()
  props.items?.forEach((item: Record<string, any>) => {
    Object.keys(item).forEach(k => attrs.add(k))
  })
  return Array.from(attrs)
})

function getAttributeType(attr: any): string {
  if (!attr) return ''
  if (attr.S !== undefined) return 'S'
  if (attr.N !== undefined) return 'N'
  if (attr.B !== undefined) return 'B'
  if (attr.BOOL !== undefined) return 'BOOL'
  if (attr.NULL !== undefined) return 'NULL'
  if (attr.L !== undefined) return 'L'
  if (attr.M !== undefined) return 'M'
  if (attr.SS !== undefined) return 'SS'
  if (attr.NS !== undefined) return 'NS'
  if (attr.BS !== undefined) return 'BS'
  return 'S'
}

function formatAttributeValue(attr: any): string {
  if (!attr) return ''
  if (attr.S !== undefined) return attr.S
  if (attr.N !== undefined) return attr.N
  if (attr.B !== undefined) return '[Binary]'
  if (attr.BOOL !== undefined) return attr.BOOL ? 'true' : 'false'
  if (attr.NULL !== undefined) return 'null'
  if (attr.L !== undefined) return `[List: ${attr.L.length} items]`
  if (attr.M !== undefined) return `[Map: ${Object.keys(attr.M).length} keys]`
  if (attr.SS !== undefined) return attr.SS.join(', ')
  if (attr.NS !== undefined) return attr.NS.join(', ')
  if (attr.BS !== undefined) return `[BinarySet: ${attr.BS.length} items]`
  return JSON.stringify(attr)
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="'Explore: ' + tableName"
    size="3xl"
    @update:open="emit('update:open', $event)"
  >
    <!-- Error -->
    <div
      v-if="error"
      class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ error }}
    </div>

    <!-- Scan/Query Toggle -->
    <div class="flex items-center gap-4 mb-4">
      <div class="flex rounded-lg overflow-hidden border border-light-border dark:border-dark-border">
        <button
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="scanMode === 'scan' 
            ? 'bg-blue-600 text-white' 
            : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg'"
          @click="emit('update:scanMode', 'scan'); emit('scan')"
        >
          Scan All
        </button>
        <button
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="scanMode === 'query' 
            ? 'bg-blue-600 text-white' 
            : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg'"
          @click="emit('update:scanMode', 'query')"
        >
          Query
        </button>
      </div>
      
      <Button
        size="sm"
        @click="emit('addItem')"
      >
        + Add Item
      </Button>
    </div>

    <!-- Query Filters -->
    <div
      v-if="scanMode === 'query'"
      class="mb-4 p-4 rounded-lg bg-light-bg dark:bg-dark-bg"
    >
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label
            :for="pkName + '-pk'"
            class="block text-xs mb-1 text-light-muted dark:text-dark-muted"
          >
            {{ pkName }} (Partition Key) *
          </label>
          <input
            :id="pkName + '-pk'"
            type="text"
            :placeholder="'Enter ' + pkName"
            class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
          >
        </div>
        <div v-if="skName">
          <label
            :for="skName + '-sk-cond'"
            class="block text-xs mb-1 text-light-muted dark:text-dark-muted"
          >
            Condition
          </label>
          <select
            :id="skName + '-sk-cond'"
            class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
          >
            <option value="eq">
              = (equals)
            </option>
            <option value="begins_with">
              begins_with
            </option>
            <option value="lt">
              &lt; (less than)
            </option>
            <option value="lte">
              &lt;= (less or equal)
            </option>
            <option value="gt">
              &gt; (greater than)
            </option>
            <option value="gte">
              &gt;= (greater or equal)
            </option>
          </select>
        </div>
        <div v-if="skName">
          <label
            :for="skName + '-sk'"
            class="block text-xs mb-1 text-light-muted dark:text-dark-muted"
          >
            {{ skName }} (Sort Key)
          </label>
          <input
            :id="skName + '-sk'"
            type="text"
            :placeholder="'Enter ' + skName"
            class="w-full px-3 py-2 rounded-lg border text-sm bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-border dark:border-dark-border"
          >
        </div>
      </div>
      <Button
        size="sm"
        class="mt-3"
        @click="emit('query')"
      >
        Run Query
      </Button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="text-center py-8"
    >
      <LoadingSpinner size="lg" />
      <p class="mt-2 text-light-muted dark:text-dark-muted">
        Loading items...
      </p>
    </div>

    <!-- Items Table -->
    <div
      v-else
      class="space-y-4"
    >
      <div class="text-sm text-light-muted dark:text-dark-muted">
        {{ items?.length || 0 }} item(s) found
      </div>

      <div
        v-if="!items?.length"
        class="text-center py-8"
      >
        <p class="text-light-muted dark:text-dark-muted">
          No items found in this table.
        </p>
      </div>

      <div
        v-else
        class="overflow-x-auto rounded-lg border border-light-border dark:border-dark-border"
      >
        <table class="w-full text-sm">
          <thead class="bg-light-bg dark:bg-dark-bg">
            <tr>
              <th
                v-for="attr in allAttributes"
                :key="attr"
                class="px-3 py-2 text-left font-medium text-light-text dark:text-dark-text"
              >
                <div class="flex items-center gap-1">
                  {{ attr }}
                  <span
                    v-if="tableDetails?.KeySchema?.some((k: any) => k.AttributeName === attr)"
                    :class="[
                      'px-1.5 py-0.5 text-[10px] rounded',
                      tableDetails?.KeySchema?.find((k: any) => k.AttributeName === attr)?.KeyType === 'HASH'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    ]"
                  >
                    {{ tableDetails?.KeySchema?.find((k: any) => k.AttributeName === attr)?.KeyType }}
                  </span>
                </div>
              </th>
              <th class="px-3 py-2 text-right font-medium text-light-text dark:text-dark-text">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in items"
              :key="index"
              class="border-t border-light-border dark:border-dark-border hover:bg-light-bg dark:hover:bg-dark-bg"
            >
              <td
                v-for="attr in allAttributes"
                :key="attr"
                class="px-3 py-2 text-light-text dark:text-dark-text"
              >
                <span
                  :class="[
                    'px-1.5 py-0.5 text-[10px] rounded mr-1',
                    getAttributeType(item[attr]) === 'S' ? 'bg-gray-200 dark:bg-gray-600' : '',
                    getAttributeType(item[attr]) === 'N' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : '',
                    ['L', 'M', 'SS', 'NS', 'BS'].includes(getAttributeType(item[attr])) ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : '',
                  ]"
                >
                  {{ getAttributeType(item[attr]) }}
                </span>
                {{ formatAttributeValue(item[attr]) }}
              </td>
              <td class="px-3 py-2 text-right">
                <button
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                  @click="emit('deleteItem', item)"
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Load More -->
      <div
        v-if="lastEvaluatedKey"
        class="text-center"
      >
        <Button
          :disabled="loading"
          @click="emit('loadMore')"
        >
          Load More
        </Button>
        <p class="text-xs mt-2 text-light-muted dark:text-dark-muted">
          There are more items to load
        </p>
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