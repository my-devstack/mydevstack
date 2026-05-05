<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useDynamoDB } from '@/composables/useDynamoDB'
import { useContentReload } from '@/composables/useContentReload'
import { TableCellsIcon, ChevronDownIcon, ChevronRightIcon, MagnifyingGlassCircleIcon, RssIcon } from '@heroicons/vue/24/outline'
import {
  DynamoDBDeleteTableModal,
  DynamoDBDeleteItemModal,
  DynamoDBCreateTableModal,
  DynamoDBViewTableModal,
  DynamoDBPutItemModal,
  DynamoDBExploreModal,
  DynamoDBTableStats,
  DynamoDBStreamModal,
  DynamoDBCodeExamples,
} from '@/components/dynamodb'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

const {
  tables,
  loading,
  error,
  tableDetailsMap,
  loadTables,
  loadTableDetails,
  createTable,
  deleteTable,
  putItem,
  deleteItem,
  getKeyTypeLabel,
  getBillingModeLabel,
  formatAttributeValue,
  streams,
  streamLoading,
  streamError,
  loadStreams,
  getStreamShards,
  getRecordsFromShard,
  query,
  scan,
  getShardIterator,
  getRecords,
} = useDynamoDB()

// Create table modal state
const showCreateModal = ref(false)
const newTableName = ref('')
const partitionKeyName = ref('')
const partitionKeyType = ref('S')
const hasSortKey = ref(false)
const sortKeyName = ref('')
const sortKeyType = ref('S')
const billingMode = ref('PAY_PER_REQUEST')
const readCapacity = ref(5)
const writeCapacity = ref(5)
const enableStreams = ref(false)
const streamViewType = ref('NEW_AND_OLD_IMAGES')
const creating = ref(false)

// View table modal state
const showViewModal = ref(false)
const selectedTable = ref<{ TableName: string } | null>(null)
const tableDetails = ref<unknown>(null)
const tableLoading = ref(false)
const tableError = ref<string | null>(null)

// Delete confirmation
const showDeleteModal = ref(false)
const tableToDelete = ref<string | null>(null)
const deleting = ref(false)

// Accordion state for tables
const expandedTables = ref<Set<string>>(new Set())

function toggleTableExpansion(tableName: string) {
  if (expandedTables.value.has(tableName)) {
    expandedTables.value.delete(tableName)
  } else {
    expandedTables.value = new Set([tableName])
    if (!tableDetailsMap.value[tableName]) {
      loadTableDetailsForAccordion(tableName)
    }
    return
  }
  expandedTables.value = new Set(expandedTables.value)
}

async function loadTableDetailsForAccordion(tableName: string) {
  await loadTableDetails(tableName)
}

// Explore data modal state
const showExploreModal = ref(false)
const exploreTableName = ref('')
const exploreTableDetails = ref<unknown>(null)
const exploreLoading = ref(false)
const exploreError = ref<string | null>(null)
const items = ref<unknown[]>([])
const lastEvaluatedKey = ref<unknown>(null)
const scanMode = ref<'scan' | 'query'>('scan')

// Query specific
const partitionKeyValue = ref('')
const sortKeyCondition = ref('eq')
const sortKeyValue = ref('')

// Put item modal
const showPutItemModal = ref(false)
const newItemJson = ref('')
const putItemLoading = ref(false)
const putItemError = ref<string | null>(null)

// Delete item confirmation
const showDeleteItemModal = ref(false)
const itemToDelete = ref<unknown>(null)
const deleteItemLoading = ref(false)

// Stream viewer modal state
const showStreamModal = ref(false)
const loadingRecords = ref(false)
const selectedStream = ref<unknown>(null)
const streamRecords = ref<unknown[]>([])
const shardIterator = ref<string | null>(null)
const streamShards = ref<any[]>([])

// Example code tabs
const exampleType = ref<'table' | 'stream'>('table')

// Open create modal
function openCreateModal() {
  newTableName.value = ''
  partitionKeyName.value = ''
  partitionKeyType.value = 'S'
  hasSortKey.value = false
  sortKeyName.value = ''
  sortKeyType.value = 'S'
  billingMode.value = 'PAY_PER_REQUEST'
  readCapacity.value = 5
  writeCapacity.value = 5
  showCreateModal.value = true
}

// Create table
async function handleCreateTable() {
  if (!newTableName.value.trim() || !partitionKeyName.value.trim()) return
  
  creating.value = true
  try {
    await createTable({
      tableName: newTableName.value.trim(),
      partitionKeyName: partitionKeyName.value.trim(),
      partitionKeyType: partitionKeyType.value,
      hasSortKey: hasSortKey.value,
      sortKeyName: sortKeyName.value.trim(),
      sortKeyType: sortKeyType.value,
      billingMode: billingMode.value,
      readCapacity: readCapacity.value,
      writeCapacity: writeCapacity.value,
      enableStreams: enableStreams.value,
      streamViewType: streamViewType.value,
    })
    showCreateModal.value = false
  } catch (e: unknown) {
    const err = e as Error
    toast.error('Failed to create table: ' + err.message)
  } finally {
    creating.value = false
  }
}

// View table details
async function viewTable(tableName: string) {
  selectedTable.value = { TableName: tableName }
  tableDetails.value = null
  tableError.value = null
  showViewModal.value = true
  tableLoading.value = true
  
  try {
    const data = await describeTable(tableName)
    tableDetails.value = data?.Table
  } catch (e: unknown) {
    const err = e as Error
    tableError.value = 'Failed to get table details: ' + err.message
  } finally {
    tableLoading.value = false
  }
}

// View table streams
async function viewStreams(tableName: string) {
  selectedTable.value = { TableName: tableName }
  streamRecords.value = []
  selectedStream.value = null
  showStreamModal.value = true
  await loadStreams(tableName)
}

// Get stream records
async function selectStream(stream: unknown) {
  selectedStream.value = stream
  streamRecords.value = []
  shardIterator.value = null
  streamShards.value = []

  const s = stream as { StreamArn?: string } | null
  if (!s?.StreamArn) {
    streamError.value = 'No streams available'
    return
  }

  loadingRecords.value = true
  streamError.value = null

  try {
    const streamArn = s.StreamArn
    const shards = await getStreamShards(streamArn)
    streamShards.value = shards

    if (shards.length === 0) {
      streamError.value = 'No shards found for stream. Stream may still be initializing.'
      return
    }

    const shard = shards[0]
    const iterator = await getShardIterator(streamArn, shard.ShardId, 'TRIM_HORIZON')

    if (!iterator?.ShardIterator) {
      streamError.value = 'Failed to get shard iterator'
      return
    }

    shardIterator.value = iterator.ShardIterator

    const response = await getRecords(shardIterator.value)
    streamRecords.value = response.Records || []
    shardIterator.value = response.NextShardIterator || null
  } catch (e: unknown) {
    const err = e as Error
    streamError.value = 'Failed to load stream records: ' + err.message
  } finally {
    loadingRecords.value = false
  }
}

// Get more stream records
async function loadMoreRecords() {
  if (!shardIterator.value) {
    streamError.value = 'No more records available'
    return
  }
  
  loadingRecords.value = true
  
  try {
    const records = await getRecords(shardIterator.value)
    streamRecords.value = [...streamRecords.value, ...((records as { Records?: unknown[] }).Records || [])]
    shardIterator.value = (records as { NextShardIterator?: string }).NextShardIterator
    
    if (!shardIterator.value) {
      streamError.value = 'No more records available'
    }
  } catch (e: unknown) {
    const err = e as Error
    streamError.value = 'Failed to load more records: ' + err.message
  } finally {
    loadingRecords.value = false
  }
}

// Explore table data
async function exploreTable(tableName: string) {
  exploreTableName.value = tableName
  exploreTableDetails.value = null
  exploreError.value = null
  items.value = []
  lastEvaluatedKey.value = null
  scanMode.value = 'scan'
  partitionKeyValue.value = ''
  sortKeyValue.value = ''
  showExploreModal.value = true
  exploreLoading.value = true
  
  try {
    const detailsData = await describeTable(tableName)
    exploreTableDetails.value = detailsData?.Table
    
    await scanOrQueryTable(tableName, 'scan')
  } catch (e: unknown) {
    const err = e as Error
    exploreError.value = 'Failed to load table: ' + err.message
  } finally {
    exploreLoading.value = false
  }
}

// Import API functions
import { describeTable } from '@/api/services/dynamodb'

// Scan or Query table
async function scanOrQueryTable(tableName: string, mode?: 'scan' | 'query') {
  if (mode) scanMode.value = mode
  exploreLoading.value = true
  exploreError.value = null
  
  try {
    const body: Record<string, unknown> = { TableName: tableName }
    
    if (scanMode.value === 'query') {
      if (!partitionKeyValue.value.trim()) {
        exploreError.value = 'Partition key value is required for query'
        exploreLoading.value = false
        return
      }
      
      const pkAttr = (exploreTableDetails.value as { KeySchema?: Array<{ AttributeName: string; KeyType: string }> })?.KeySchema?.find((k) => k.KeyType === 'HASH')
      const skAttr = (exploreTableDetails.value as { KeySchema?: Array<{ AttributeName: string; KeyType: string }> })?.KeySchema?.find((k) => k.KeyType === 'RANGE')
      
      const keyCondition = [pkAttr.AttributeName + ' = :pk']
      body.ExpressionAttributeValues = {
        ':pk': convertValueToAttr(partitionKeyValue.value, pkAttr.AttributeName)
      }
      
      if (skAttr && sortKeyValue.value.trim()) {
        const skCondition = getSortKeyCondition(sortKeyCondition.value)
        keyCondition.push(skAttr.AttributeName + ' ' + skCondition.expression + ' :sk')
        body.ExpressionAttributeValues[':sk'] = convertValueToAttr(sortKeyValue.value, skAttr.AttributeName)
      }
      
      body.KeyConditionExpression = keyCondition.join(' AND ')
    }
    
    if (lastEvaluatedKey.value && !mode) {
      body.ExclusiveStartKey = lastEvaluatedKey.value
    }
    
    let data
    if (scanMode.value === 'query') {
      data = await query(body)
    } else {
      data = await scan(body)
    }
    
    if (data?.errorMessage) {
      exploreError.value = data.errorMessage
      return
    }
    
    if (mode) {
      items.value = data.Items || []
    } else {
      items.value = [...items.value, ...(data.Items || [])]
    }
    
    lastEvaluatedKey.value = data.LastEvaluatedKey || null
  } catch (e: unknown) {
    const err = e as Error
    exploreError.value = 'Failed to fetch items: ' + err.message
  } finally {
    exploreLoading.value = false
  }
}

// Load more items
async function loadMoreItems() {
  if (lastEvaluatedKey.value) {
    await scanOrQueryTable(exploreTableName.value)
  }
}

// Open Put Item modal
function openPutItemModal() {
  newItemJson.value = '{\n  \n}'
  putItemError.value = null
  showPutItemModal.value = true
}

// Parse JSON and put item
async function handlePutItem() {
  putItemLoading.value = true
  putItemError.value = null
  
  try {
    const item = JSON.parse(newItemJson.value)
    await putItem(exploreTableName.value, item)
    showPutItemModal.value = false
    lastEvaluatedKey.value = null
    await scanOrQueryTable(exploreTableName.value, 'scan')
    await loadTableDetails(exploreTableName.value)
  } catch (e: unknown) {
    const err = e as Error
    putItemError.value = err.message.includes('JSON') 
      ? 'Invalid JSON format. Use DynamoDB format like: {"key": {"S": "value"}}'
      : err.message
  } finally {
    putItemLoading.value = false
  }
}

// Confirm delete item
function confirmDeleteItem(item: unknown) {
  itemToDelete.value = item
  showDeleteItemModal.value = true
}

// Delete item
async function handleDeleteItem() {
  if (!itemToDelete.value) return
  
  deleteItemLoading.value = true
  try {
    const key: Record<string, unknown> = {}
    const keySchema = (exploreTableDetails.value as { KeySchema?: Array<{ AttributeName: string }> })?.KeySchema || []
    for (const attr of keySchema) {
      const itemAttr = (itemToDelete.value as Record<string, unknown>)[attr.AttributeName]
      if (itemAttr) {
        key[attr.AttributeName] = itemAttr
      }
    }
    await deleteItem(exploreTableName.value, key)
    showDeleteItemModal.value = false
    itemToDelete.value = null
    lastEvaluatedKey.value = null
    await scanOrQueryTable(exploreTableName.value, 'scan')
    await loadTableDetails(exploreTableName.value)
  } catch (e: unknown) {
    const err = e as Error
    exploreError.value = 'Failed to delete item: ' + err.message
  } finally {
    deleteItemLoading.value = false
  }
}

// Confirm delete
function confirmDelete(tableName: string) {
  tableToDelete.value = tableName
  showDeleteModal.value = true
}

// Delete table
async function handleDeleteTable() {
  if (!tableToDelete.value) return
  
  deleting.value = true
  try {
    await deleteTable(tableToDelete.value)
    showDeleteModal.value = false
    tableToDelete.value = null
  } catch (e: unknown) {
    const err = e as Error
    error.value = 'Failed to delete table: ' + err.message
  } finally {
    deleting.value = false
  }
}

// Helper functions from useDynamoDB
function getPartitionKeyName(details: unknown) {
  return (details as { KeySchema?: Array<{ AttributeName: string; KeyType: string }> })?.KeySchema?.find((k) => k.KeyType === 'HASH')?.AttributeName || ''
}

function getSortKeyName(details: unknown) {
  return (details as { KeySchema?: Array<{ AttributeName: string; KeyType: string }> })?.KeySchema?.find((k) => k.KeyType === 'RANGE')?.AttributeName || ''
}

function getAllUniqueAttributes(items: unknown[]) {
  const attrs = new Set<string>()
  for (const item of items) {
    if (item && typeof item === 'object') {
      for (const key of Object.keys(item as object)) {
        attrs.add(key)
      }
    }
  }
  return Array.from(attrs)
}

function convertValueToAttr(value: string, attrName: string) {
  const num = Number(value)
  if (!isNaN(num)) {
    return { N: String(num) }
  }
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return { BOOL: value.toLowerCase() === 'true' }
  }
  return { S: value }
}

function getSortKeyCondition(condition: string) {
  const conditions: Record<string, { expression: string }> = {
    eq: { expression: '=' },
    gt: { expression: '>' },
    ge: { expression: '>=' },
    lt: { expression: '<' },
    le: { expression: '<=' },
    begins: { expression: 'begins_with' },
  }
  return conditions[condition] || conditions.eq
}

// Get partition key name for explore query
const explorePKName = computed(() => getPartitionKeyName(exploreTableDetails.value))

// Get sort key name for explore query
const exploreSKName = computed(() => getSortKeyName(exploreTableDetails.value))

// Get all unique attribute names from items
const allAttributes = computed(() => getAllUniqueAttributes(items.value))

onMounted(() => {
  loadTables()
})

watch(reloadTrigger, () => {
  loadTables()
})
</script>

<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4 -mx-6 -mt-6 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <TableCellsIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            DynamoDB Tables
          </h1>
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ tables.length }} table{{ tables.length !== 1 ? 's' : '' }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="openCreateModal"
          >
            + Create Table
          </button>
          <button
            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
            title="Refresh"
            @click="loadTables"
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

    <div
      v-if="error"
      class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ error }}
    </div>

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

    <div v-if="!loading">
      <div
        v-if="tables.length === 0"
        class="text-center py-12"
      >
        <p
          class="text-lg"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
        >
          No DynamoDB tables found. Create one to get started!
        </p>
      </div>
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="table in tables"
          :key="table"
          class="border rounded-lg overflow-hidden"
          :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
        >
          <!-- Accordion Header -->
          <div 
            class="grid grid-cols-12 gap-4 px-4 py-4 items-center cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg"
            :class="settingsStore.darkMode ? 'bg-dark-surface' : 'bg-light-surface'"
            @click="toggleTableExpansion(table)"
          >
            <div class="col-span-8 flex items-center gap-2">
              <TableCellsIcon class="h-5 w-5 text-primary-500" />
              <span class="font-medium text-light-text dark:text-dark-text">{{ table }}</span>
            </div>
            <div
              class="col-span-4 text-right"
              @click.stop
            >
              <div class="flex items-center justify-end gap-2">
                <button
                  class="p-2 text-blue-500 hover:text-blue-700 hover:bg-light-border dark:hover:bg-dark-border rounded"
                  title="Explore Data"
                  @click="exploreTable(table)"
                >
                  <MagnifyingGlassCircleIcon class="w-4 h-4" />
                </button>
                <button
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                  @click="confirmDelete(table)"
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
                <component
                  :is="expandedTables.has(table) ? ChevronDownIcon : ChevronRightIcon"
                  class="h-5 w-5 transition-transform"
                  :class="expandedTables.has(table) ? 'rotate-90' : ''"
                />
              </div>
            </div>
          </div>
          
          <!-- Accordion Content -->
          <div
            v-if="expandedTables.has(table)"
            class="px-4 pb-4 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <DynamoDBTableStats
              :table-name="table"
              :details="tableDetailsMap[table]"
              :loading="!tableDetailsMap[table]"
              @view-streams="viewStreams"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Example Code Section -->
    <div class="mt-8">
      <h2
        class="text-lg font-semibold mb-4"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Usage Examples
      </h2>
      
      <!-- Example Type Tabs -->
      <div class="flex gap-4 mb-4">
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="exampleType === 'table'
            ? 'bg-blue-600 text-white'
            : settingsStore.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="exampleType = 'table'"
        >
          Table Operations
        </button>
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="exampleType === 'stream'
            ? 'bg-blue-600 text-white'
            : settingsStore.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="exampleType = 'stream'"
        >
          DynamoDB Streams
        </button>
      </div>
      
      <DynamoDBCodeExamples :type="exampleType" />
    </div>
  </div>

  <!-- Create Table Modal -->
  <DynamoDBCreateTableModal
    v-model:open="showCreateModal"
    v-model:table-name="newTableName"
    v-model:partition-key-name="partitionKeyName"
    v-model:partition-key-type="partitionKeyType"
    v-model:has-sort-key="hasSortKey"
    v-model:sort-key-name="sortKeyName"
    v-model:sort-key-type="sortKeyType"
    v-model:billing-mode="billingMode"
    v-model:read-capacity="readCapacity"
    v-model:write-capacity="writeCapacity"
    v-model:enable-streams="enableStreams"
    v-model:stream-view-type="streamViewType"
    :creating="creating"
    @create="handleCreateTable"
  />

  <!-- View Table Details Modal -->
  <DynamoDBViewTableModal
    v-model:open="showViewModal"
    :table-name="selectedTable?.TableName || ''"
    :table-details="tableDetails"
    :loading="tableLoading"
    :error="tableError"
    @view-streams="viewStreams"
  />

  <!-- Explore Data Modal -->
  <DynamoDBExploreModal
    v-model:open="showExploreModal"
    v-model:scan-mode="scanMode"
    :table-name="exploreTableName"
    :error="exploreError"
    :loading="exploreLoading"
    :items="items"
    :last-evaluated-key="lastEvaluatedKey"
    :table-details="exploreTableDetails"
    :pk-name="explorePKName"
    :sk-name="exploreSKName"
    @scan="lastEvaluatedKey = null; scanOrQueryTable(exploreTableName, 'scan')"
    @query="lastEvaluatedKey = null; scanOrQueryTable(exploreTableName, 'query')"
    @load-more="loadMoreItems"
    @delete-item="confirmDeleteItem"
    @add-item="openPutItemModal"
  />

  <!-- Put Item Modal -->
  <DynamoDBPutItemModal
    v-model="newItemJson"
    v-model:open="showPutItemModal"
    :key-schema="(exploreTableDetails as { KeySchema?: Array<{ AttributeName: string }> })?.KeySchema || []"
    :loading="putItemLoading"
    :error="putItemError"
    @submit="handlePutItem"
  />

  <!-- Delete Item Confirmation Modal -->
  <DynamoDBDeleteItemModal
    v-model:open="showDeleteItemModal"
    @delete="handleDeleteItem"
  />

  <!-- Delete Table Confirmation Modal -->
  <DynamoDBDeleteTableModal
    v-model:open="showDeleteModal"
    @delete="handleDeleteTable"
  />

  <!-- Stream Viewer Modal -->
  <DynamoDBStreamModal
    v-model:open="showStreamModal"
    :table-name="selectedTable?.TableName || ''"
    :streams="streams"
    :shards="streamShards"
    :loading="streamLoading"
    :error="streamError"
    :records="streamRecords"
    :selected-stream="(selectedStream as { StreamArn?: string; StreamStatus?: string; StreamViewType?: string; StreamLabel?: string }) || null"
    :loading-records="loadingRecords"
    :stream-error="streamError"
    :has-more="!!shardIterator"
    @load-records="loadMoreRecords"
    @select-stream="selectStream"
  />
</template>