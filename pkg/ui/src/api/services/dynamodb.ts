/**
 * DynamoDB Service API Client
 * REST-style HTTP client for DynamoDB via Go proxy
 * @module api/services/dynamodb
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function restFetch<T = any>(
  method: string,
  path: string,
  body?: Record<string, any>,
  errorLabel = 'DynamoDB'
): Promise<T> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const url = `${endpoint}${path}`

  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }

  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`${errorLabel} request failed: ${errorText}`, response.status, 'dynamodb')
    }
    const text = await response.text()
    return text ? JSON.parse(text) : (null as T)
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`${errorLabel} request error:`, error)
    throw new APIError(`${errorLabel} request failed`, 500, 'dynamodb')
  }
}

// Helper to convert DynamoDB attribute format to plain JS object
export function unmarshall(item: Record<string, any>): Record<string, any> {
  if (!item) return {}
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(item)) {
    if (value && typeof value === 'object') {
      const val = value as Record<string, any>
      if (val.S !== undefined) {
        result[key] = val.S
      } else if (val.N !== undefined) {
        result[key] = Number(val.N)
      } else if (val.B !== undefined) {
        result[key] = val.B
      } else if (val.BOOL !== undefined) {
        result[key] = val.BOOL
      } else if (val.NULL !== undefined) {
        result[key] = null
      } else if (val.L !== undefined) {
        result[key] = (val.L as any[]).map((l: any) => unmarshall(l))
      } else if (val.M !== undefined) {
        result[key] = unmarshall(val.M)
      } else if (val.SS !== undefined) {
        result[key] = val.SS
      } else if (val.NS !== undefined) {
        result[key] = (val.NS as string[]).map((n) => Number(n))
      } else {
        result[key] = value
      }
    } else {
      result[key] = value
    }
  }
  return result
}

// Helper to convert plain JS object to DynamoDB attribute format
export function marshall(item: Record<string, any>): Record<string, any> {
  if (!item) return {}
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(item)) {
    if (value === null) {
      result[key] = { NULL: true }
    } else if (typeof value === 'string') {
      result[key] = { S: value }
    } else if (typeof value === 'number') {
      result[key] = { N: String(value) }
    } else if (typeof value === 'boolean') {
      result[key] = { BOOL: value }
    } else if (Array.isArray(value)) {
      result[key] = { L: value.map((v) => marshall({ _: v })._) }
    } else if (typeof value === 'object') {
      result[key] = { M: marshall(value) }
    } else {
      result[key] = { S: String(value) }
    }
  }
  return result
}

export class DynamoDBService {
  async createTable(request: {
    TableName: string
    KeySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[]
    AttributeDefinitions: { AttributeName: string; AttributeType: 'S' | 'N' | 'B' }[]
    ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number }
    BillingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST'
    GlobalSecondaryIndexes?: any[]
    StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: any }
  }): Promise<any> {
    return await restFetch('POST', '/dynamodb/tables', request)
  }

  async deleteTable(tableName: string): Promise<void> {
    return await restFetch('DELETE', `/dynamodb/tables/${encodeURIComponent(tableName)}`)
  }

  async describeTable(tableName: string): Promise<any> {
    return await restFetch('GET', `/dynamodb/tables/${encodeURIComponent(tableName)}`)
  }

  async listTables(options?: {
    ExclusiveStartTableName?: string
    Limit?: number
  }): Promise<{ TableNames: string[]; LastEvaluatedTableName?: string }> {
    let path = '/dynamodb/tables'
    if (options) {
      const params = new URLSearchParams()
      if (options.ExclusiveStartTableName) params.set('ExclusiveStartTableName', options.ExclusiveStartTableName)
      if (options.Limit !== undefined) params.set('Limit', String(options.Limit))
      const qs = params.toString()
      if (qs) path += `?${qs}`
    }
    const response = await restFetch<{ TableNames?: string[]; LastEvaluatedTableName?: string }>('GET', path)
    return {
      TableNames: response.TableNames || [],
      LastEvaluatedTableName: response.LastEvaluatedTableName,
    }
  }

  async updateTable(
    tableName: string,
    updates: {
      AttributeDefinitions?: any[]
      BillingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST'
      ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number }
      GlobalSecondaryIndexUpdates?: any[]
      StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: any }
    }
  ): Promise<any> {
    return await restFetch('PUT', `/dynamodb/tables/${encodeURIComponent(tableName)}`, updates)
  }

  async putItem(
    tableNameOrBody: string | Record<string, any>,
    item?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<any> {
    // Handle case where first argument is an object (from Vue component)
    let tableName: string
    let itemToStore: Record<string, any>
    let putOptions: Record<string, any>

    if (typeof tableNameOrBody === 'object') {
      const body = tableNameOrBody as Record<string, any>
      tableName = body.TableName
      itemToStore = body.Item
      putOptions = { ...body }
      delete putOptions.TableName
      delete putOptions.Item
    } else {
      tableName = tableNameOrBody
      itemToStore = item || {}
      putOptions = options || {}
    }

    // Check if item is already in DynamoDB attribute format (e.g., {"id": {"S": "value"}})
    // If it is, don't marshall it again
    const isDynamoDBFormat = (obj: Record<string, any>): boolean => {
      if (!obj) return false
      const firstValue = Object.values(obj)[0]
      return firstValue && typeof firstValue === 'object' &&
        ('S' in firstValue || 'N' in firstValue || 'B' in firstValue ||
         'BOOL' in firstValue || 'NULL' in firstValue || 'L' in firstValue ||
         'M' in firstValue || 'SS' in firstValue || 'NS' in firstValue)
    }

    const itemToSend = isDynamoDBFormat(itemToStore) ? itemToStore : marshall(itemToStore)

    return await restFetch('POST', `/dynamodb/tables/${encodeURIComponent(tableName)}/items`, {
      Item: itemToSend,
      ...putOptions,
    })
  }

  async getItem(
    tableNameOrBody: string | Record<string, any>,
    key?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<{ Item?: Record<string, any> }> {
    // Handle case where first argument is an object (from Vue component)
    let tableName: string
    let keyToFetch: Record<string, any>
    let getOptions: Record<string, any>

    if (typeof tableNameOrBody === 'object') {
      const body = tableNameOrBody as Record<string, any>
      tableName = body.TableName
      keyToFetch = body.Key
      getOptions = { ...body }
      delete getOptions.TableName
      delete getOptions.Key
    } else {
      tableName = tableNameOrBody
      keyToFetch = key || {}
      getOptions = options || {}
    }

    const response = await restFetch<{ Item?: Record<string, any> }>(
      'POST',
      `/dynamodb/tables/${encodeURIComponent(tableName)}/items/get`,
      {
        Key: marshall(keyToFetch),
        ...getOptions,
      }
    )
    return {
      Item: response.Item ? unmarshall(response.Item) : undefined,
    }
  }

  async deleteItem(
    tableNameOrBody: string | Record<string, any>,
    key?: Record<string, any>,
    options?: Record<string, any>
  ): Promise<any> {
    // Handle case where first argument is an object (from Vue component)
    let tableName: string
    let keyToDelete: Record<string, any>
    let deleteOptions: Record<string, any>

    if (typeof tableNameOrBody === 'object') {
      const body = tableNameOrBody as Record<string, any>
      tableName = body.TableName
      keyToDelete = body.Key
      deleteOptions = { ...body }
      delete deleteOptions.TableName
      delete deleteOptions.Key
    } else {
      tableName = tableNameOrBody
      keyToDelete = key || {}
      deleteOptions = options || {}
    }

    // Check if key is already in DynamoDB attribute format (e.g., {"id": {"S": "value"}} or {"id": {"M": {"Value": ...}}})
    // If it is, don't marshall it again
    const isDynamoDBFormat = (obj: Record<string, any>): boolean => {
      if (!obj) return false
      const firstValue = Object.values(obj)[0]
      // Check for direct DynamoDB types (S, N, B) OR nested wrapper types (M with Value)
      if (firstValue && typeof firstValue === 'object') {
        if ('S' in firstValue || 'N' in firstValue || 'B' in firstValue) {
          return true
        }
        // Check for wrapper format like {"M": {"Value": {"S": "value"}}}
        if ('M' in firstValue && firstValue.M && typeof firstValue.M === 'object' && 'Value' in firstValue.M) {
          return true
        }
      }
      return false
    }

    const keyToSend = isDynamoDBFormat(keyToDelete) ? keyToDelete : marshall(keyToDelete)

    return await restFetch('POST', `/dynamodb/tables/${encodeURIComponent(tableName)}/items/delete`, {
      Key: keyToSend,
      ...deleteOptions,
    })
  }

  async updateItem(
    tableName: string,
    key: Record<string, any>,
    updates: {
      UpdateExpression: string
      ExpressionAttributeNames?: Record<string, string>
      ExpressionAttributeValues?: Record<string, any>
    },
    options?: {
      ConditionExpression?: string
      ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
    }
  ): Promise<any> {
    return await restFetch('PUT', `/dynamodb/tables/${encodeURIComponent(tableName)}/items`, {
      Key: marshall(key),
      ...updates,
      ...options,
    })
  }

  async query(
    tableNameOrBody: string | Record<string, any>,
    params?: Record<string, any>
  ): Promise<{ Items: Record<string, any>[]; Count: number; ScannedCount: number; LastEvaluatedKey?: Record<string, any> }> {
    // Handle case where first argument is an object (from Vue component)
    let tableName: string
    let queryParams: Record<string, any>

    if (typeof tableNameOrBody === 'object') {
      const body = tableNameOrBody as Record<string, any>
      tableName = body.TableName
      queryParams = { ...body }
      delete queryParams.TableName
    } else {
      tableName = tableNameOrBody
      queryParams = params || {}
    }

    const response = await restFetch<{ Items?: Record<string, any>[]; Count?: number; ScannedCount?: number; LastEvaluatedKey?: Record<string, any> }>(
      'POST',
      `/dynamodb/tables/${encodeURIComponent(tableName)}/query`,
      queryParams
    )
    return {
      Items: (response.Items || []).map((item: any) => unmarshall(item)),
      Count: response.Count || 0,
      ScannedCount: response.ScannedCount || 0,
      LastEvaluatedKey: response.LastEvaluatedKey ? unmarshall(response.LastEvaluatedKey) : undefined,
    }
  }

  async scan(
    tableNameOrBody: string | Record<string, any>,
    params?: Record<string, any>
  ): Promise<{ Items: Record<string, any>[]; Count: number; ScannedCount: number; LastEvaluatedKey?: Record<string, any> }> {
    // Handle case where first argument is an object (from Vue component)
    let tableName: string
    let scanParams: Record<string, any>

    if (typeof tableNameOrBody === 'object') {
      const body = tableNameOrBody as Record<string, any>
      tableName = body.TableName
      scanParams = { ...body }
      delete scanParams.TableName
    } else {
      tableName = tableNameOrBody
      scanParams = params || {}
    }

    const response = await restFetch<{ Items?: Record<string, any>[]; Count?: number; ScannedCount?: number; LastEvaluatedKey?: Record<string, any> }>(
      'POST',
      `/dynamodb/tables/${encodeURIComponent(tableName)}/scan`,
      scanParams
    )
    return {
      Items: (response.Items || []).map((item: any) => unmarshall(item)),
      Count: response.Count || 0,
      ScannedCount: response.ScannedCount || 0,
      LastEvaluatedKey: response.LastEvaluatedKey ? unmarshall(response.LastEvaluatedKey) : undefined,
    }
  }

  async getItems(
    tableName: string,
    options?: {
      limit?: number
      startKey?: Record<string, any>
    }
  ): Promise<{ items: Record<string, any>[]; lastKey: Record<string, any> | null }> {
    const response = await restFetch<{ Items?: Record<string, any>[]; LastEvaluatedKey?: Record<string, any> }>(
      'POST',
      `/dynamodb/tables/${encodeURIComponent(tableName)}/scan`,
      {
        Limit: options?.limit,
        ExclusiveStartKey: options?.startKey ? marshall(options.startKey) : undefined,
      }
    )
    return {
      items: (response.Items || []).map((item: any) => unmarshall(item)),
      lastKey: response.LastEvaluatedKey ? unmarshall(response.LastEvaluatedKey) : null,
    }
  }

  async batchWriteItem(
    tableName: string,
    items: Array<{
      DeleteRequest?: { Key: Record<string, any> }
      PutRequest?: { Item: Record<string, any> }
    }>
  ): Promise<any> {
    return await restFetch('POST', '/dynamodb/batch-write-item', {
      RequestItems: {
        [tableName]: items.map((item) => ({
          DeleteRequest: item.DeleteRequest ? { Key: marshall(item.DeleteRequest.Key) } : undefined,
          PutRequest: item.PutRequest ? { Item: marshall(item.PutRequest.Item) } : undefined,
        })),
      },
    })
  }

  async batchGetItem(
    tableName: string,
    keys: Record<string, any>[],
    options?: {
      ProjectionExpression?: string
      ExpressionAttributeNames?: Record<string, string>
    }
  ): Promise<{ Responses?: Record<string, any>[] }> {
    const response = await restFetch<{ Responses?: Record<string, { Items: Record<string, any>[] }> }>(
      'POST',
      '/dynamodb/batch-get-item',
      {
        RequestItems: {
          [tableName]: {
            Keys: keys.map((key) => marshall(key)),
            ...options,
          },
        },
      }
    )
    return {
      Responses: response.Responses?.[tableName]?.map((item: any) => unmarshall(item)),
    }
  }

  async getTimeToLive(tableName: string): Promise<any> {
    return await restFetch('GET', `/dynamodb/tables/${encodeURIComponent(tableName)}/ttl`)
  }

  async updateTimeToLive(tableName: string, enabled: boolean, attributeName: string): Promise<any> {
    return await restFetch('PUT', `/dynamodb/tables/${encodeURIComponent(tableName)}/ttl`, {
      TimeToLiveSpecification: {
        Enabled: enabled,
        AttributeName: attributeName,
      },
    })
  }

  async getStreamSpecification(tableName: string): Promise<{ StreamEnabled: boolean; StreamViewType?: string }> {
    const tableDesc = await this.describeTable(tableName)
    return tableDesc.Table?.StreamSpecification || { StreamEnabled: false }
  }
}

export const dynamodbService = new DynamoDBService()

export const createTable = (request: Parameters<DynamoDBService['createTable']>[0]) =>
  dynamodbService.createTable(request)
export const deleteTable = (tableName: string) => dynamodbService.deleteTable(tableName)
export const describeTable = (tableName: string) => dynamodbService.describeTable(tableName)
export const listTables = (options?: { ExclusiveStartTableName?: string; Limit?: number }) =>
  dynamodbService.listTables(options)
export const updateTable = (
  tableName: string,
  updates: {
    AttributeDefinitions?: any[]
    BillingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST'
    ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number }
    GlobalSecondaryIndexUpdates?: any[]
    StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: any }
  }
) => dynamodbService.updateTable(tableName, updates)
export const putItem = (
  tableName: string,
  item: Record<string, any>,
  options?: {
    ConditionExpression?: string
    ExpressionAttributeNames?: Record<string, string>
    ExpressionAttributeValues?: Record<string, any>
    ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
  }
) => dynamodbService.putItem(tableName, item, options)
export const getItem = (
  tableName: string,
  key: Record<string, any>,
  options?: {
    ProjectionExpression?: string
    ExpressionAttributeNames?: Record<string, string>
    ConsistentRead?: boolean
  }
) => dynamodbService.getItem(tableName, key, options)
export const deleteItem = (
  tableName: string,
  key: Record<string, any>,
  options?: {
    ConditionExpression?: string
    ExpressionAttributeNames?: Record<string, string>
    ExpressionAttributeValues?: Record<string, any>
    ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
  }
) => dynamodbService.deleteItem(tableName, key, options)
export const updateItem = (
  tableName: string,
  key: Record<string, any>,
  updates: {
    UpdateExpression: string
    ExpressionAttributeNames?: Record<string, string>
    ExpressionAttributeValues?: Record<string, any>
  },
  options?: {
    ConditionExpression?: string
    ReturnValues?: 'NONE' | 'ALL_OLD' | 'ALL_NEW' | 'UPDATED_OLD' | 'UPDATED_NEW'
  }
) => dynamodbService.updateItem(tableName, key, updates, options)
export const query = (
  tableName: string,
  params: {
    KeyConditionExpression: string
    ExpressionAttributeValues?: Record<string, any>
    ExpressionAttributeNames?: Record<string, string>
    FilterExpression?: string
    ProjectionExpression?: string
    ScanIndexForward?: boolean
    Limit?: number
    ExclusiveStartKey?: Record<string, any>
  }
) => dynamodbService.query(tableName, params)
export const scan = (
  tableName: string,
  params?: {
    FilterExpression?: string
    ExpressionAttributeValues?: Record<string, any>
    ExpressionAttributeNames?: Record<string, string>
    ProjectionExpression?: string
    Limit?: number
    ExclusiveStartKey?: Record<string, any>
  }
) => dynamodbService.scan(tableName, params)
export const getItems = (
  tableName: string,
  options?: {
    limit?: number
    startKey?: Record<string, any>
  }
) => dynamodbService.getItems(tableName, options)
export const batchWriteItem = (
  tableName: string,
  items: Array<{
    DeleteRequest?: { Key: Record<string, any> }
    PutRequest?: { Item: Record<string, any> }
  }>
) => dynamodbService.batchWriteItem(tableName, items)
export const batchGetItem = (
  tableName: string,
  keys: Record<string, any>[],
  options?: {
    ProjectionExpression?: string
    ExpressionAttributeNames?: Record<string, string>
  }
) => dynamodbService.batchGetItem(tableName, keys, options)
export const getTimeToLive = (tableName: string) => dynamodbService.getTimeToLive(tableName)
export const updateTimeToLive = (tableName: string, enabled: boolean, attributeName: string) =>
  dynamodbService.updateTimeToLive(tableName, enabled, attributeName)
export const getStreamSpecification = (tableName: string) =>
  dynamodbService.getStreamSpecification(tableName)

// DynamoDB Streams exports
export const listStreams = async (tableName: string): Promise<{ Streams: any[] }> => {
  if (!tableName) {
    return { Streams: [] }
  }
  return restFetch('GET', `/dynamodb/streams?tableName=${encodeURIComponent(tableName)}`, undefined, 'DynamoDBStreams')
}

// List all streams without table filter - returns orphaned streams when tables deleted
export const listAllStreams = async (): Promise<{ Streams: any[] }> => {
  return restFetch('GET', '/dynamodb/streams', undefined, 'DynamoDBStreams')
}

export const describeStream = async (streamArn: string): Promise<any> => {
  return restFetch('GET', `/dynamodb/streams/${encodeURIComponent(streamArn)}`, undefined, 'DynamoDBStreams')
}

export const getShardIterator = async (streamArn: string, shardId: string, iteratorType?: string): Promise<any> => {
  return restFetch('POST', `/dynamodb/streams/${encodeURIComponent(streamArn)}/shard-iterator`, {
    ShardId: shardId,
    ShardIteratorType: iteratorType || 'TRIM_HORIZON',
  }, 'DynamoDBStreams')
}

export const getRecords = async (shardIterator: string, limit?: number): Promise<any> => {
  const response = await restFetch('POST', '/dynamodb/streams/records', {
    ShardIterator: shardIterator,
    Limit: limit || 100,
  }, 'DynamoDBStreams')

  // Normalize response: convert DynamoDBStreams format to expected format
  // API returns: { Records: [{ Dynamodb: {...} }] }
  // Code expects: { Records: [{ dynamodb: {...} ] }
  if (response.Records) {
    response.Records = response.Records.map((record: any) => {
      if (record.Dynamodb) {
        // Convert ISO date to Unix timestamp
        const isoDate = record.Dynamodb.ApproximateCreationDateTime
        if (isoDate && typeof isoDate === 'string') {
          record.Dynamodb.ApproximateCreationDateTime = new Date(isoDate).getTime() / 1000
        }
        // Normalize case: Dynamoodb -> dynamodb
        record.dynamodb = record.Dynamodb
        delete record.Dynamodb
      }
      return record
    })
  }
  return response
}

export default dynamodbService
