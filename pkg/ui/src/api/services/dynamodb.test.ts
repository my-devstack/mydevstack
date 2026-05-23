import { describe, it, expect, vi, beforeEach } from 'vitest'
import { unmarshall, marshall } from './dynamodb'
import { APIError } from '../client'

// Mock fetch
const mockFetch = vi.fn()
globalThis.fetch = mockFetch

function mockJsonResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    headers: new Headers({ 'content-type': 'application/json' }),
  }
}

// Import after mocks
import {
  DynamoDBService,
  dynamodbService,
  createTable,
  deleteTable,
  describeTable,
  listTables,
  updateTable,
  putItem,
  getItem,
  deleteItem,
  updateItem,
  query,
  scan,
  getItems,
  batchWriteItem,
  batchGetItem,
  getTimeToLive,
  updateTimeToLive,
  getStreamSpecification,
  listStreams,
  listAllStreams,
  describeStream,
  getShardIterator,
  getRecords,
} from './dynamodb'

describe('DynamoDB Utils', () => {
  describe('unmarshall', () => {
    it('should import unmarshall function', async () => {
      const { unmarshall } = await import('./dynamodb')
      expect(unmarshall).toBeDefined()
      expect(typeof unmarshall).toBe('function')
    })

    it('should handle null input', () => {
      expect(unmarshall(null as any)).toEqual({})
      expect(unmarshall(undefined as any)).toEqual({})
    })

    it('should unmarshall string value', () => {
      const result = unmarshall({ name: { S: 'John' } })
      expect(result.name).toBe('John')
    })

    it('should unmarshall number value', () => {
      const result = unmarshall({ age: { N: '30' } })
      expect(result.age).toBe(30)
    })

    it('should unmarshall boolean value', () => {
      const result = unmarshall({ active: { BOOL: true } })
      expect(result.active).toBe(true)
    })

    it('should unmarshall null value', () => {
      const result = unmarshall({ value: { NULL: true } })
      expect(result.value).toBe(null)
    })

    it('should unmarshall binary value', () => {
      const result = unmarshall({ data: { B: 'abc123' } })
      expect(result.data).toBe('abc123')
    })

    it('should unmarshall map', () => {
      const result = unmarshall({ data: { M: { name: { S: 'John' } } } })
      expect(result.data).toEqual({ name: 'John' })
    })

    it('should unmarshall list', () => {
      const result = unmarshall({ tags: { L: [{ S: 'a' }, { S: 'b' }] } })
      expect(result.tags).toEqual([{ S: 'a' }, { S: 'b' }])
    })

    it('should unmarshall string set', () => {
      const result = unmarshall({ tags: { SS: ['a', 'b', 'c'] } })
      expect(result.tags).toEqual(['a', 'b', 'c'])
    })

    it('should unmarshall number set', () => {
      const result = unmarshall({ counts: { NS: ['1', '2', '3'] } })
      expect(result.counts).toEqual([1, 2, 3])
    })

    it('should pass through plain values', () => {
      const result = unmarshall({ value: 'plain' })
      expect(result.value).toBe('plain')
    })

    it('should handle complex object', () => {
      const input = {
        id: { S: '123' },
        count: { N: '42' },
        active: { BOOL: true },
        nested: { M: { name: { S: 'Test' } } },
      }
      const result = unmarshall(input)
      expect(result).toEqual({
        id: '123',
        count: 42,
        active: true,
        nested: { name: 'Test' },
      })
    })

    it('should pass through unknown DynamoDB type', () => {
      const result = unmarshall({ key: { UnknownType: 'val' } })
      expect(result.key).toEqual({ UnknownType: 'val' })
    })
  })

  describe('marshall', () => {
    it('should import marshall function', async () => {
      const { marshall } = await import('./dynamodb')
      expect(marshall).toBeDefined()
      expect(typeof marshall).toBe('function')
    })

    it('should handle null input', () => {
      expect(marshall(null as any)).toEqual({})
      expect(marshall(undefined as any)).toEqual({})
    })

    it('should marshall string value', () => {
      const result = marshall({ name: 'John' })
      expect(result.name).toEqual({ S: 'John' })
    })

    it('should marshall number value', () => {
      const result = marshall({ age: 30 })
      expect(result.age).toEqual({ N: '30' })
    })

    it('should marshall boolean true', () => {
      const result = marshall({ active: true })
      expect(result.active).toEqual({ BOOL: true })
    })

    it('should marshall boolean false', () => {
      const result = marshall({ active: false })
      expect(result.active).toEqual({ BOOL: false })
    })

    it('should marshall null value', () => {
      const result = marshall({ value: null })
      expect(result.value).toEqual({ NULL: true })
    })

    it('should marshall array as list', () => {
      const result = marshall({ tags: ['a', 'b', 'c'] })
      expect(result.tags).toEqual({ L: [{ S: 'a' }, { S: 'b' }, { S: 'c' }] })
    })

    it('should marshall object', () => {
      const result = marshall({ data: { name: 'John' } })
      expect(result.data).toEqual({ M: { name: { S: 'John' } } })
    })

    it('should handle complex object', () => {
      const input = {
        id: '123',
        count: 42,
        active: true,
      }
      const result = marshall(input)
      expect(result).toEqual({
        id: { S: '123' },
        count: { N: '42' },
        active: { BOOL: true },
      })
    })

    it('should marshall unknown type as string', () => {
      const result = marshall({ key: Symbol('test') })
      expect(result.key).toEqual({ S: 'Symbol(test)' })
    })
  })
})

describe('DynamoDBService', () => {
  let service: DynamoDBService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new DynamoDBService()
  })

  describe('listTables', () => {
    it('should list tables successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ TableNames: ['table1', 'table2'] }))
      const result = await service.listTables()
      expect(result.TableNames).toEqual(['table1', 'table2'])
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables'),
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should return empty list when no tables', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      const result = await service.listTables()
      expect(result.TableNames).toEqual([])
    })

    it('should handle pagination options', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        TableNames: ['table3'],
        LastEvaluatedTableName: 'table3',
      }))
      const result = await service.listTables({ Limit: 1, ExclusiveStartTableName: 'table2' })
      expect(result.LastEvaluatedTableName).toBe('table3')
      // Verify query params
      const url = mockFetch.mock.calls[0][0]
      expect(url).toContain('ExclusiveStartTableName=table2')
      expect(url).toContain('Limit=1')
    })

    it('should throw APIError on failure', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ error: 'fail' }, 400))
      await expect(service.listTables()).rejects.toThrow(APIError)
    })

    it('should throw APIError on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))
      await expect(service.listTables()).rejects.toThrow(APIError)
    })
  })

  describe('createTable', () => {
    const tableRequest = {
      TableName: 'test-table',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' as const }],
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' as const }],
      BillingMode: 'PAY_PER_REQUEST' as const,
    }

    it('should create table successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ TableDescription: { TableName: 'test-table', TableStatus: 'CREATING' } }))
      const result = await service.createTable(tableRequest)
      expect(result.TableDescription.TableName).toBe('test-table')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.not.objectContaining({ 'X-Amz-Target': expect.anything() }),
        })
      )
    })

    it('should throw APIError on failure', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ error: 'Table already exists' }, 400))
      await expect(service.createTable(tableRequest)).rejects.toThrow(APIError)
    })
  })

  describe('describeTable', () => {
    it('should describe table successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Table: { TableName: 'test-table', TableStatus: 'ACTIVE', ItemCount: 100 },
      }))
      const result = await service.describeTable('test-table')
      expect(result.Table.TableName).toBe('test-table')
      expect(result.Table.ItemCount).toBe(100)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table'),
        expect.objectContaining({
          method: 'GET',
        })
      )
    })

    it('should throw APIError on non-existent table', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ error: 'Table not found' }, 400))
      await expect(service.describeTable('nonexistent')).rejects.toThrow(APIError)
    })
  })

  describe('deleteTable', () => {
    it('should delete table successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await service.deleteTable('test-table')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table'),
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })

    it('should throw APIError on failure', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ error: 'Table not found' }, 400))
      await expect(service.deleteTable('nonexistent')).rejects.toThrow(APIError)
    })
  })

  describe('updateTable', () => {
    it('should update table successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ TableDescription: { TableName: 'test-table' } }))
      const result = await service.updateTable('test-table', {
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      })
      expect(result.TableDescription.TableName).toBe('test-table')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table'),
        expect.objectContaining({
          method: 'PUT',
        })
      )
    })

    it('should update table with stream specification', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await service.updateTable('test-table', {
        StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' },
      })
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.StreamSpecification.StreamEnabled).toBe(true)
    })
  })

  describe('putItem', () => {
    it('should put item with string args', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await service.putItem('test-table', { id: '123', name: 'test' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/items'),
        expect.objectContaining({
          method: 'POST',
        })
      )
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.Item.id.S).toBe('123')
      expect(callBody.Item.name.S).toBe('test')
    })

    it('should put item with object body (Vue component style)', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await service.putItem({
        TableName: 'test-table',
        Item: { id: '456', name: 'vue-item' },
      })
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.Item.id.S).toBe('456')
    })

    it('should preserve already-marshalled items', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      const alreadyMarshalled = {
        id: { S: '789' },
        data: { M: { value: { S: 'pre' } } },
      }
      await service.putItem('test-table', alreadyMarshalled)
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.Item.id.S).toBe('789')
    })

    it('should throw APIError on failure', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ error: 'ConditionalCheckFailed' }, 400))
      await expect(service.putItem('test-table', { id: '123' })).rejects.toThrow(APIError)
    })
  })

  describe('getItem', () => {
    it('should get item successfully with string args', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Item: { id: { S: '123' }, name: { S: 'test' } },
      }))
      const result = await service.getItem('test-table', { id: '123' })
      expect(result.Item).toBeDefined()
      expect(result.Item!.id).toBe('123')
      expect(result.Item!.name).toBe('test')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/items/get'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should get item with object body (Vue component style)', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Item: { id: { S: '456' } } }))
      const result = await service.getItem({
        TableName: 'test-table',
        Key: { id: '456' },
      })
      expect(result.Item).toBeDefined()
      expect(result.Item!.id).toBe('456')
    })

    it('should return Item as undefined when no item found', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      const result = await service.getItem('test-table', { id: 'notfound' })
      expect(result.Item).toBeUndefined()
    })
  })

  describe('deleteItem', () => {
    it('should delete item with string args', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await service.deleteItem('test-table', { id: '123' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/items/delete'),
        expect.objectContaining({ method: 'POST' })
      )
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.Key.id.S).toBe('123')
    })

    it('should delete item with object body (Vue component style)', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await service.deleteItem({
        TableName: 'test-table',
        Key: { id: '456' },
      })
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.Key.id.S).toBe('456')
    })

    it('should preserve already-marshalled key for delete', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      const alreadyMarshalledKey = { id: { S: '789' } }
      await service.deleteItem('test-table', alreadyMarshalledKey)
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.Key.id.S).toBe('789')
    })

    it('should handle M wrapper format key', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      const wrapperKey = { id: { M: { Value: { S: '123' } } } }
      await service.deleteItem('test-table', wrapperKey)
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.Key.id.M.Value.S).toBe('123')
    })
  })

  describe('updateItem', () => {
    it('should update item successfully', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Attributes: { updated: { BOOL: true } } }))
      const result = await service.updateItem(
        'test-table',
        { id: '123' },
        { UpdateExpression: 'SET #n = :val', ExpressionAttributeNames: { '#n': 'name' }, ExpressionAttributeValues: { ':val': { S: 'new' } } },
        { ReturnValues: 'ALL_NEW' }
      )
      expect(result.Attributes.updated).toEqual({ BOOL: true })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/items'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  describe('query', () => {
    it('should query with string table name', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Items: [{ id: { S: '123' }, name: { S: 'test' } }],
        Count: 1,
        ScannedCount: 10,
      }))
      const result = await service.query('test-table', {
        KeyConditionExpression: 'id = :pk',
        ExpressionAttributeValues: { ':pk': { S: '123' } },
      })
      expect(result.Items).toHaveLength(1)
      expect(result.Items[0].id).toBe('123')
      expect(result.Count).toBe(1)
      expect(result.ScannedCount).toBe(10)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/query'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should query with object body (Vue component style)', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Items: [{ id: { S: '456' } }],
        Count: 1,
        ScannedCount: 1,
      }))
      const result = await service.query({
        TableName: 'test-table',
        KeyConditionExpression: 'id = :pk',
      })
      expect(result.Items).toHaveLength(1)
    })

    it('should handle empty results', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Items: [], Count: 0, ScannedCount: 0 }))
      const result = await service.query('test-table', { KeyConditionExpression: 'id = :pk' })
      expect(result.Items).toEqual([])
      expect(result.Count).toBe(0)
    })

    it('should handle LastEvaluatedKey', async () => {
      const lek = { id: { S: 'last' } }
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Items: [], Count: 0, ScannedCount: 0, LastEvaluatedKey: lek }))
      const result = await service.query('test-table', { KeyConditionExpression: 'id = :pk' })
      expect(result.LastEvaluatedKey).toBeDefined()
      expect(result.LastEvaluatedKey!.id).toBe('last')
    })
  })

  describe('scan', () => {
    it('should scan with string table name', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Items: [{ id: { S: '1' } }, { id: { S: '2' } }],
        Count: 2,
        ScannedCount: 100,
      }))
      const result = await service.scan('test-table', { FilterExpression: 'attribute_exists(id)' })
      expect(result.Items).toHaveLength(2)
      expect(result.Count).toBe(2)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/scan'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should scan with object body (Vue component style)', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Items: [], Count: 0, ScannedCount: 0 }))
      const result = await service.scan({
        TableName: 'test-table',
        FilterExpression: 'attribute_exists(id)',
      })
      expect(result.Items).toEqual([])
    })

    it('should scan without params', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Items: [], Count: 0, ScannedCount: 0 }))
      const result = await service.scan('test-table')
      expect(result.Items).toEqual([])
    })
  })

  describe('getItems', () => {
    it('should get items with defaults', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Items: [{ id: { S: '1' } }, { id: { S: '2' } }],
      }))
      const result = await service.getItems('test-table')
      expect(result.items).toHaveLength(2)
      expect(result.items[0].id).toBe('1')
      expect(result.lastKey).toBeNull()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/scan'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should pass limit and startKey', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Items: [{ id: { S: '1' } }] }))
      await service.getItems('test-table', { limit: 1, startKey: { id: 'prev' } })
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.Limit).toBe(1)
      expect(callBody.ExclusiveStartKey).toBeDefined()
    })

    it('should return lastKey when LastEvaluatedKey present', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Items: [{ id: { S: '1' } }],
        LastEvaluatedKey: { id: { S: 'last' } },
      }))
      const result = await service.getItems('test-table')
      expect(result.lastKey).toBeDefined()
      expect(result.lastKey!.id).toBe('last')
    })
  })

  describe('batchWriteItem', () => {
    it('should batch write items', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ UnprocessedItems: {} }))
      const result = await service.batchWriteItem('test-table', [
        { PutRequest: { Item: { id: '1', name: 'test' } } },
        { DeleteRequest: { Key: { id: '2' } } },
      ])
      expect(result.UnprocessedItems).toEqual({})
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/batch-write-item'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('batchGetItem', () => {
    it('should batch get items', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Responses: {
          'test-table': [{ id: { S: '1' } }, { id: { S: '2' } }],
        },
      }))
      const result = await service.batchGetItem('test-table', [{ id: '1' }, { id: '2' }])
      expect(result.Responses).toHaveLength(2)
      expect(result.Responses![0].id).toBe('1')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/batch-get-item'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      const result = await service.batchGetItem('test-table', [{ id: '1' }])
      expect(result.Responses).toBeUndefined()
    })
  })

  describe('getTimeToLive', () => {
    it('should get TTL description', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        TimeToLiveDescription: {
          TimeToLiveStatus: 'ENABLED',
          AttributeName: 'ttl',
        },
      }))
      const result = await service.getTimeToLive('test-table')
      expect(result.TimeToLiveDescription.TimeToLiveStatus).toBe('ENABLED')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/ttl'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('updateTimeToLive', () => {
    it('should enable TTL', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await service.updateTimeToLive('test-table', true, 'ttl')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/ttl'),
        expect.objectContaining({ method: 'PUT' })
      )
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.TimeToLiveSpecification.Enabled).toBe(true)
      expect(callBody.TimeToLiveSpecification.AttributeName).toBe('ttl')
    })

    it('should disable TTL', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await service.updateTimeToLive('test-table', false, 'ttl')
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.TimeToLiveSpecification.Enabled).toBe(false)
    })
  })

  describe('getStreamSpecification', () => {
    it('should return stream spec when enabled', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Table: { StreamSpecification: { StreamEnabled: true, StreamViewType: 'NEW_AND_OLD_IMAGES' } },
      }))
      const result = await service.getStreamSpecification('test-table')
      expect(result.StreamEnabled).toBe(true)
      expect(result.StreamViewType).toBe('NEW_AND_OLD_IMAGES')
    })

    it('should return default when no stream spec', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Table: {} }))
      const result = await service.getStreamSpecification('test-table')
      expect(result.StreamEnabled).toBe(false)
    })
  })
})

describe('DynamoDB Singleton Export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('dynamodbService is a DynamoDBService instance', () => {
    expect(dynamodbService).toBeInstanceOf(DynamoDBService)
  })
})

describe('DynamoDB Standalone Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTable', () => {
    it('should create table', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ TableDescription: { TableName: 'test' } }))
      const result = await createTable({
        TableName: 'test',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      })
      expect(result.TableDescription.TableName).toBe('test')
    })
  })

  describe('deleteTable', () => {
    it('should delete table', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await deleteTable('test-table')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('describeTable', () => {
    it('should describe table', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Table: { TableName: 'test' } }))
      const result = await describeTable('test-table')
      expect(result.Table.TableName).toBe('test')
    })
  })

  describe('listTables', () => {
    it('should list tables', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ TableNames: ['t1', 't2'] }))
      const result = await listTables()
      expect(result.TableNames).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('updateTable', () => {
    it('should update table', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await updateTable('test-table', { BillingMode: 'PROVISIONED' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  describe('putItem', () => {
    it('should put item', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await putItem('test-table', { id: '123' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/items'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('getItem', () => {
    it('should get item', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Item: { id: { S: '123' } } }))
      const result = await getItem('test-table', { id: '123' })
      expect(result.Item?.id).toBe('123')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/items/get'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('deleteItem', () => {
    it('should delete item', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await deleteItem('test-table', { id: '123' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/items/delete'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('updateItem', () => {
    it('should update item', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await updateItem('test-table', { id: '123' }, { UpdateExpression: 'SET #n = :v' })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/items'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  describe('query', () => {
    it('should query table', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Items: [], Count: 0, ScannedCount: 0 }))
      const result = await query('test-table', { KeyConditionExpression: 'id = :pk' })
      expect(result.Items).toEqual([])
    })
  })

  describe('scan', () => {
    it('should scan table', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Items: [], Count: 0, ScannedCount: 0 }))
      const result = await scan('test-table')
      expect(result.Items).toEqual([])
    })
  })

  describe('getItems', () => {
    it('should get items', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Items: [] }))
      const result = await getItems('test-table')
      expect(result.items).toEqual([])
    })
  })

  describe('batchWriteItem', () => {
    it('should batch write', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await batchWriteItem('test-table', [{ PutRequest: { Item: { id: '1' } } }])
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/batch-write-item'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('batchGetItem', () => {
    it('should batch get', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await batchGetItem('test-table', [{ id: '1' }])
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/batch-get-item'),
        expect.objectContaining({ method: 'POST' })
      )
    })
  })

  describe('getTimeToLive', () => {
    it('should get TTL', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await getTimeToLive('test-table')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/ttl'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('updateTimeToLive', () => {
    it('should update TTL', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({}))
      await updateTimeToLive('test-table', true, 'ttl')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb/tables/test-table/ttl'),
        expect.objectContaining({ method: 'PUT' })
      )
    })
  })

  describe('getStreamSpecification', () => {
    it('should get stream spec', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Table: { StreamSpecification: { StreamEnabled: false } } }))
      const result = await getStreamSpecification('test-table')
      expect(result.StreamEnabled).toBe(false)
    })
  })

  describe('listStreams', () => {
    it('should list streams for table', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Streams: [{ StreamArn: 'arn:aws:dynamodb:us-east-1:123:table/test-table/stream/2024-01-01' }] }))
      const result = await listStreams('test-table')
      expect(result.Streams).toHaveLength(1)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb-streams/streams?tableName=test-table'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should return empty array for empty table name', async () => {
      const result = await listStreams('')
      expect(result.Streams).toEqual([])
    })
  })

  describe('listAllStreams', () => {
    it('should list all streams', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Streams: [] }))
      const result = await listAllStreams()
      expect(result.Streams).toEqual([])
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb-streams/streams'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('describeStream', () => {
    it('should describe stream', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        StreamDescription: {
          StreamArn: 'arn:aws:dynamodb:us-east-1:123:table/test-table/stream/2024-01-01',
        },
      }))
      const result = await describeStream('arn:aws:dynamodb:...')
      expect(result.StreamDescription.StreamArn).toBeDefined()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb-streams/streams/'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('getShardIterator', () => {
    it('should get shard iterator', async () => {
      const mockShardIterator = { ShardIterator: 'AAAAA' }
      mockFetch.mockResolvedValueOnce(mockJsonResponse(mockShardIterator))
      const result = await getShardIterator('stream-arn', 'shard-123')
      expect(result.ShardIterator).toBe('AAAAA')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb-streams/streams/stream-arn/shards/shard-123/iterator'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should use provided iterator type', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ ShardIterator: 'AAAAA' }))
      await getShardIterator('stream-arn', 'shard-123', 'LATEST')
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.ShardIteratorType).toBe('LATEST')
    })
  })

  describe('getRecords', () => {
    it('should get records from shard iterator', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Records: [
          {
            Dynamodb: {
              ApproximateCreationDateTime: '2024-01-01T00:00:00Z',
              Keys: { id: { S: '123' } },
            },
          },
        ],
      }))
      const result = await getRecords('stream-arn', 'shard-1', 'shard-iterator-aaaa')
      expect(result.Records).toHaveLength(1)
      expect(result.Records[0].dynamodb).toBeDefined()
      expect(result.Records[0].Dynamodb).toBeUndefined()
      expect(typeof result.Records[0].dynamodb.ApproximateCreationDateTime).toBe('number')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/dynamodb-streams/streams/stream-arn/shards/shard-1/records'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should handle records without Dynamodb field', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Records: [{ eventID: '1' }],
      }))
      const result = await getRecords('stream-arn', 'shard-1', 'shard-iterator-bbbb')
      expect(result.Records).toHaveLength(1)
      expect(result.Records[0].eventID).toBe('1')
    })

    it('should handle empty records', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Records: [] }))
      const result = await getRecords('stream-arn', 'shard-1', 'shard-iterator-cccc')
      expect(result.Records).toEqual([])
    })

    it('should use default limit', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ Records: [] }))
      await getRecords('stream-arn', 'shard-1', 'shard-iterator')
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.Limit).toBe(100)
    })

    it('should handle ApproximateCreationDateTime as number', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        Records: [
          {
            Dynamodb: {
              ApproximateCreationDateTime: 1704067200,
              Keys: { id: { S: '123' } },
            },
          },
        ],
      }))
      const result = await getRecords('stream-arn', 'shard-1', 'shard-iterator-num')
      expect(result.Records).toHaveLength(1)
      expect(result.Records[0].dynamodb.ApproximateCreationDateTime).toBe(1704067200)
    })

    it('should throw APIError on DynamoDBStreams network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Streams network error'))
      await expect(getRecords('stream-arn', 'shard-1', 'bad-iterator')).rejects.toThrow(APIError)
    })
  })
})
