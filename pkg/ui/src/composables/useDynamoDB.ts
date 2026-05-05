import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import {
  listTables,
  createTable as dbCreateTable,
  deleteTable as dbDeleteTable,
  describeTable,
  putItem as dbPutItem,
  deleteItem as dbDeleteItem,
  query,
  scan,
  listStreams,
  describeStream,
  getShardIterator,
  getRecords,
} from '@/api/services/dynamodb'

export interface TableInfo {
  TableName: string
  TableStatus?: string
  KeySchema?: Array<{ AttributeName: string; KeyType: 'HASH' | 'RANGE' }>
  AttributeDefinitions?: Array<{ AttributeName: string; AttributeType: string }>
  BillingModeSummary?: { BillingMode: string }
  ProvisionedThroughput?: {
    ReadCapacityUnits: number
    WriteCapacityUnits: number
  }
  ItemCount?: number
  TableSizeBytes?: number
  StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: string }
}

export interface CreateTableForm {
  tableName: string
  partitionKeyName: string
  partitionKeyType: string
  hasSortKey: boolean
  sortKeyName: string
  sortKeyType: string
  billingMode: 'PAY_PER_REQUEST' | 'PROVISIONED'
  readCapacity: number
  writeCapacity: number
  enableStreams: boolean
  streamViewType: string
}

export function useDynamoDB() {
  const toast = useToast()

  const tables = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const tableDetailsMap = ref<Record<string, TableInfo | null>>({})

  async function loadTables() {
    loading.value = true
    error.value = null
    try {
      const data = await listTables({})
      tables.value = data.TableNames || []
    } catch (e: any) {
      error.value = e.message
      tables.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadTableDetails(tableName: string) {
    try {
      const data = await describeTable(tableName)
      tableDetailsMap.value[tableName] = data.Table
      return data.Table as TableInfo
    } catch (e: any) {
      toast.error('Failed to load table details')
      tableDetailsMap.value[tableName] = null
      return null
    }
  }

  async function createTable(form: CreateTableForm) {
    const attributeDefinitions = [
      { AttributeName: form.partitionKeyName, AttributeType: form.partitionKeyType },
    ]

    const keySchema = [
      { AttributeName: form.partitionKeyName, KeyType: 'HASH' as const },
    ]

    if (form.hasSortKey && form.sortKeyName.trim()) {
      attributeDefinitions.push({
        AttributeName: form.sortKeyName,
        AttributeType: form.sortKeyType,
      })
      keySchema.push({ AttributeName: form.sortKeyName, KeyType: 'RANGE' as const })
    }

    const tableInput: any = {
      TableName: form.tableName,
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions,
    }

    if (form.billingMode === 'PAY_PER_REQUEST') {
      tableInput.BillingMode = 'PAY_PER_REQUEST'
    } else {
      tableInput.BillingMode = 'PROVISIONED'
      tableInput.ProvisionedThroughput = {
        ReadCapacityUnits: form.readCapacity,
        WriteCapacityUnits: form.writeCapacity,
      }
    }

    if (form.enableStreams) {
      tableInput.StreamSpecification = {
        StreamEnabled: true,
        StreamViewType: form.streamViewType,
      }
    }

    await dbCreateTable(tableInput)
    toast.success('Table created successfully')
    await loadTables()
  }

  async function deleteTable(tableName: string) {
    await dbDeleteTable(tableName)
    toast.success('Table deleted')
    await loadTables()
  }

  async function putItem(tableName: string, item: Record<string, any>) {
    await dbPutItem({ TableName: tableName, Item: item })
    toast.success('Item added')
  }

  async function deleteItem(tableName: string, key: Record<string, any>) {
    await dbDeleteItem({ TableName: tableName, Key: key })
    toast.success('Item deleted')
  }

  async function queryTable(
    tableName: string,
    params: {
      KeyConditionExpression: string
      ExpressionAttributeValues?: Record<string, any>
      ExpressionAttributeNames?: Record<string, string>
    }
  ) {
    return await query({ TableName: tableName, ...params })
  }

  async function scanTable(
    tableName: string,
    params?: {
      FilterExpression?: string
      ExpressionAttributeValues?: Record<string, any>
      ExpressionAttributeNames?: Record<string, string>
      ProjectionExpression?: string
      Limit?: number
      ExclusiveStartKey?: Record<string, any>
    }
  ) {
    return await scan({ TableName: tableName, ...params })
  }

  function getKeyTypeLabel(type: string): string {
    const types: Record<string, string> = {
      S: 'String',
      N: 'Number',
      B: 'Binary',
    }
    return types[type] || type
  }

  function getBillingModeLabel(mode: string): string {
    const modes: Record<string, string> = {
      PAY_PER_REQUEST: 'On-Demand',
      PROVISIONED: 'Provisioned',
    }
    return modes[mode] || mode
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
    if (attr.SS !== undefined) return `[StringSet: ${attr.SS.length} items]`
    if (attr.NS !== undefined) return `[NumberSet: ${attr.NS.length} items]`
    if (attr.BS !== undefined) return `[BinarySet: ${attr.BS.length} items]`
    return JSON.stringify(attr)
  }

  const streams = ref<any[]>([])
  const streamLoading = ref(false)
  const streamError = ref<string | null>(null)

  async function loadStreams(tableName: string) {
    streamLoading.value = true
    streamError.value = null
    try {
      const response = await listStreams(tableName)
      streams.value = response.Streams || []
    } catch (e: any) {
      streamError.value = e.message
      streams.value = []
    } finally {
      streamLoading.value = false
    }
  }

  async function getStreamShards(streamArn: string) {
    try {
      const shards = await describeStream(streamArn)
      return shards.StreamDescription?.Shards || []
    } catch (e: any) {
      toast.error('Failed to get stream shards')
      return []
    }
  }

  async function getRecordsFromShard(shardIterator: string) {
    try {
      const records = await getRecords(shardIterator)
      return records.Records || []
    } catch (e: any) {
      toast.error('Failed to get records')
      return []
    }
  }

  const scanLoading = ref(false)
  const scanError = ref<string | null>(null)
  const scanItems = ref<any[]>([])
  const scanLastKey = ref<any>(null)

  async function scanTableData(
    tableName: string,
    options?: {
      filter?: string
      values?: Record<string, any>
      names?: Record<string, string>
      limit?: number
      startKey?: Record<string, any>
    }
  ) {
    scanLoading.value = true
    scanError.value = null
    try {
      const result = await scan({
        TableName: tableName,
        FilterExpression: options?.filter,
        ExpressionAttributeValues: options?.values,
        ExpressionAttributeNames: options?.names,
        Limit: options?.limit,
        ExclusiveStartKey: options?.startKey,
      })
      scanItems.value = options?.startKey
        ? [...scanItems.value, ...(result.Items || [])]
        : result.Items || []
      scanLastKey.value = result.LastEvaluatedKey || null
      return result
    } catch (e: any) {
      scanError.value = e.message
      return { Items: [], errorMessage: e.message }
    } finally {
      scanLoading.value = false
    }
  }

  async function queryTableData(
    tableName: string,
    options: {
      keyCondition: string
      values: Record<string, any>
      names?: Record<string, string>
      limit?: number
      startKey?: Record<string, any>
    }
  ) {
    scanLoading.value = true
    scanError.value = null
    try {
      const result = await query({
        TableName: tableName,
        KeyConditionExpression: options.keyCondition,
        ExpressionAttributeValues: options.values,
        ExpressionAttributeNames: options.names,
        Limit: options.limit,
        ExclusiveStartKey: options.startKey,
      })
      scanItems.value = options.startKey
        ? [...scanItems.value, ...(result.Items || [])]
        : result.Items || []
      scanLastKey.value = result.LastEvaluatedKey || null
      return result
    } catch (e: any) {
      scanError.value = e.message
      return { Items: [], errorMessage: e.message }
    } finally {
      scanLoading.value = false
    }
  }

  function getAttributeType(attr: any): string {
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
    return 'Unknown'
  }

  function convertValueToAttr(value: string, type: string): any {
    switch (type) {
      case 'N': return { N: value }
      case 'B': return { B: value }
      default: return { S: value }
    }
  }

  function getSortKeyCondition(condition: string): { expression: string, dynamodb: string } {
    const conditions: Record<string, { expression: string, dynamodb: string }> = {
      eq: { expression: '=', dynamodb: '=' },
      begins_with: { expression: 'begins_with(#sk, :sk)', dynamodb: 'begins_with' },
      lt: { expression: '<', dynamodb: '<' },
      lte: { expression: '<=', dynamodb: '<=' },
      gt: { expression: '>', dynamodb: '>' },
      gte: { expression: '>=', dynamodb: '>=' },
      between: { expression: 'BETWEEN :sk1 AND :sk2', dynamodb: 'between' },
    }
    return conditions[condition] || conditions.eq
  }

  function formatEventName(eventName: string): string {
    const colors: Record<string, string> = {
      INSERT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      MODIFY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      REMOVE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    }
    return colors[eventName] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
  }

  function formatRecordData(record: any): string {
    if (!record.dynamodb) return '{}'
    const data = record.dynamodb
    let result = ''
    
    if (data.NewImage) {
      result += `NEW_IMAGE:\n${JSON.stringify(data.NewImage, null, 2)}`
    }
    if (data.OldImage) {
      result += `\n\nOLD_IMAGE:\n${JSON.stringify(data.OldImage, null, 2)}`
    }
    if (data.Keys) {
      result += `\n\nKEYS:\n${JSON.stringify(data.Keys, null, 2)}`
    }
    
    return result || '{}'
  }

  function getPartitionKeyName(tableDetails: any): string {
    const pk = tableDetails?.KeySchema?.find((k: any) => k.KeyType === 'HASH')
    return pk?.AttributeName || ''
  }

  function getSortKeyName(tableDetails: any): string {
    const sk = tableDetails?.KeySchema?.find((k: any) => k.KeyType === 'RANGE')
    return sk?.AttributeName || ''
  }

  function getAllUniqueAttributes(items: Record<string, any>[]): string[] {
    const attrs = new Set<string>()
    items.forEach(item => {
      Object.keys(item).forEach(key => attrs.add(key))
    })
    return Array.from(attrs)
  }

  return {
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
    queryTable,
    scanTable,
    getKeyTypeLabel,
    getBillingModeLabel,
    formatAttributeValue,
    streams,
    streamLoading,
    streamError,
    loadStreams,
    getStreamShards,
    getRecordsFromShard,
    getShardIterator,
    getRecords,
    scanLoading,
    scanError,
    scanItems,
    scanLastKey,
    scanTableData,
    queryTableData,
    getAttributeType,
    convertValueToAttr,
    getSortKeyCondition,
    formatEventName,
    formatRecordData,
    getPartitionKeyName,
    getSortKeyName,
    getAllUniqueAttributes,
    scan,
    query,
  }
}