import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDynamoDB } from './useDynamoDB'
import * as dynamodbApi from '@/api/services/dynamodb'

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('@/api/services/dynamodb')

describe('useDynamoDB', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loadTables success', async () => {
    vi.mocked(dynamodbApi.listTables).mockResolvedValue({
      TableNames: ['users', 'products'],
    } as any)

    const { tables, loading, error, loadTables } = useDynamoDB()
    expect(tables.value).toEqual([])

    await loadTables()

    expect(tables.value).toEqual(['users', 'products'])
    expect(error.value).toBeNull()
  })

  it('loadTables error', async () => {
    vi.mocked(dynamodbApi.listTables).mockRejectedValue(new Error('Network error'))

    const { tables, error, loadTables } = useDynamoDB()

    await loadTables()

    expect(tables.value).toEqual([])
    expect(error.value).toBe('Network error')
  })

  it('loadTableDetails success', async () => {
    const mockTable = {
      TableName: 'users',
      TableStatus: 'ACTIVE',
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
    }
    vi.mocked(dynamodbApi.describeTable).mockResolvedValue({ Table: mockTable })

    const { tableDetailsMap, loadTableDetails } = useDynamoDB()

    const result = await loadTableDetails('users')

    expect(result).toEqual(mockTable)
    expect(tableDetailsMap.value['users']).toEqual(mockTable)
  })

  it('createTable with sort key', async () => {
    vi.mocked(dynamodbApi.createTable).mockResolvedValue({} as any)

    const { createTable } = useDynamoDB()

    await createTable({
      tableName: 'my-table',
      partitionKeyName: 'id',
      partitionKeyType: 'S',
      hasSortKey: true,
      sortKeyName: 'created',
      sortKeyType: 'S',
      billingMode: 'PAY_PER_REQUEST',
      readCapacity: 5,
      writeCapacity: 5,
      enableStreams: false,
      streamViewType: '',
    })

    expect(dynamodbApi.createTable).toHaveBeenCalledWith(
      expect.objectContaining({
        TableName: 'my-table',
        KeySchema: [
          { AttributeName: 'id', KeyType: 'HASH' },
          { AttributeName: 'created', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      })
    )
  })

  it('createTable with provisioned throughput', async () => {
    vi.mocked(dynamodbApi.createTable).mockResolvedValue({} as any)

    const { createTable } = useDynamoDB()

    await createTable({
      tableName: 'my-table',
      partitionKeyName: 'id',
      partitionKeyType: 'S',
      hasSortKey: false,
      sortKeyName: '',
      sortKeyType: 'S',
      billingMode: 'PROVISIONED',
      readCapacity: 10,
      writeCapacity: 10,
      enableStreams: false,
      streamViewType: '',
    })

    expect(dynamodbApi.createTable).toHaveBeenCalledWith(
      expect.objectContaining({
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: {
          ReadCapacityUnits: 10,
          WriteCapacityUnits: 10,
        },
      })
    )
  })

  it('createTable with streams enabled', async () => {
    vi.mocked(dynamodbApi.createTable).mockResolvedValue({} as any)

    const { createTable } = useDynamoDB()

    await createTable({
      tableName: 'my-table',
      partitionKeyName: 'id',
      partitionKeyType: 'S',
      hasSortKey: false,
      sortKeyName: '',
      sortKeyType: 'S',
      billingMode: 'PAY_PER_REQUEST',
      readCapacity: 5,
      writeCapacity: 5,
      enableStreams: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
    })

    expect(dynamodbApi.createTable).toHaveBeenCalledWith(
      expect.objectContaining({
        StreamSpecification: {
          StreamEnabled: true,
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      })
    )
  })

  it('deleteTable calls API', async () => {
    vi.mocked(dynamodbApi.deleteTable).mockResolvedValue(undefined)

    const { deleteTable } = useDynamoDB()

    await deleteTable('my-table')

    expect(dynamodbApi.deleteTable).toHaveBeenCalledWith('my-table')
  })

  it('getKeyTypeLabel returns correct labels', () => {
    const { getKeyTypeLabel } = useDynamoDB()

    expect(getKeyTypeLabel('S')).toBe('String')
    expect(getKeyTypeLabel('N')).toBe('Number')
    expect(getKeyTypeLabel('B')).toBe('Binary')
    expect(getKeyTypeLabel('X')).toBe('X')
  })

  it('getBillingModeLabel returns correct labels', () => {
    const { getBillingModeLabel } = useDynamoDB()

    expect(getBillingModeLabel('PAY_PER_REQUEST')).toBe('On-Demand')
    expect(getBillingModeLabel('PROVISIONED')).toBe('Provisioned')
    expect(getBillingModeLabel('UNKNOWN')).toBe('UNKNOWN')
  })

  it('formatAttributeValue handles all types', () => {
    const { formatAttributeValue } = useDynamoDB()

    expect(formatAttributeValue(null)).toBe('')
    expect(formatAttributeValue({ S: 'hello' })).toBe('hello')
    expect(formatAttributeValue({ N: '42' })).toBe('42')
    expect(formatAttributeValue({ B: 'data' })).toBe('[Binary]')
    expect(formatAttributeValue({ BOOL: true })).toBe('true')
    expect(formatAttributeValue({ NULL: true })).toBe('null')
    expect(formatAttributeValue({ L: [1, 2, 3] })).toBe('[List: 3 items]')
    expect(formatAttributeValue({ M: { a: 1 } })).toBe('[Map: 1 keys]')
  })
})