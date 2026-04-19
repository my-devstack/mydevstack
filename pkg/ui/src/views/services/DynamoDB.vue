<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useToast } from '@/composables/useToast'
import { useContentReload } from '@/composables/useContentReload'
import { TableCellsIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { listTables, createTable as dbCreateTable, deleteTable as dbDeleteTable, describeTable, putItem as dbPutItem, getItem, deleteItem as dbDeleteItem, updateItem, query, scan, listStreams, describeStream, getShardIterator, getRecords } from '@/api/services/dynamodb'

const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

const tables = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

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
const selectedTable = ref<any>(null)
const tableDetails = ref<any>(null)
const tableLoading = ref(false)
const tableError = ref<string | null>(null)

// Delete confirmation
const showDeleteModal = ref(false)
const tableToDelete = ref<string | null>(null)
const deleting = ref(false)

// Accordion state for tables
const expandedTables = ref<Set<string>>(new Set())
const tableDetailsMap = ref<Record<string, any>>({})

function toggleTableExpansion(tableName: string) {
  if (expandedTables.value.has(tableName)) {
    expandedTables.value.delete(tableName)
  } else {
    expandedTables.value.add(tableName)
    // Load details if not already loaded
    if (!tableDetailsMap.value[tableName]) {
      loadTableDetailsForAccordion(tableName)
    }
  }
  expandedTables.value = new Set(expandedTables.value)
}

async function loadTableDetailsForAccordion(tableName: string) {
  try {
    const data = await describeTable(tableName)
    tableDetailsMap.value[tableName] = data.Table
  } catch (e: any) {
    console.error('Failed to load table details:', e)
    tableDetailsMap.value[tableName] = null
  }
}

// Explore data modal state
const showExploreModal = ref(false)
const exploreTableName = ref('')
const exploreTableDetails = ref<any>(null)
const exploreLoading = ref(false)
const exploreError = ref<string | null>(null)
const items = ref<any[]>([])
const lastEvaluatedKey = ref<any>(null)
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
const itemToDelete = ref<any>(null)
const deleteItemLoading = ref(false)

// Stream viewer modal state
const showStreamModal = ref(false)
const streamLoading = ref(false)
const streamError = ref<string | null>(null)
const streams = ref<any[]>([])
const selectedStream = ref<any>(null)
const streamRecords = ref<any[]>([])
const shardIterator = ref<string | null>(null)
const loadingRecords = ref(false)

// Code examples
const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List tables
aws dynamodb list-tables --endpoint-url http://127.0.0.1:4566

# Scan table (get all items)
aws dynamodb scan --table-name my-table --endpoint-url http://127.0.0.1:4566

# Query by partition key
aws dynamodb query \\
  --table-name my-table \\
  --key-condition-expression "pk = :pk" \\
  --expression-attribute-values '{":pk":{"S":"user123"}}' \\
  --endpoint-url http://127.0.0.1:4566

# Put item
aws dynamodb put-item \\
  --table-name my-table \\
  --item '{"pk":{"S":"user1"},"name":{"S":"John"}}' \\
  --endpoint-url http://127.0.0.1:4566

# Delete item
aws dynamodb delete-item \\
  --table-name my-table \\
  --key '{"pk":{"S":"user1"}}' \\
  --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { DynamoDBClient, ScanCommand, QueryCommand, PutItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// Scan table
const scanResponse = await client.send(new ScanCommand({
  TableName: 'my-table',
}));
console.log(scanResponse.Items);

// Query by partition key
const queryResponse = await client.send(new QueryCommand({
  TableName: 'my-table',
  KeyConditionExpression: 'pk = :pk',
  ExpressionAttributeValues: {
    ':pk': { S: 'user123' }
  }
}));

// Put item
await client.send(new PutItemCommand({
  TableName: 'my-table',
  Item: {
    pk: { S: 'user1' },
    name: { S: 'John' },
    age: { N: '30' }
  }
}));

// Delete item
await client.send(new DeleteItemCommand({
  TableName: 'my-table',
  Key: { pk: { S: 'user1' } }
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'dynamodb',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# Scan table
response = client.scan(TableName='my-table')
for item in response['Items']:
    print(item)

# Query by partition key
response = client.query(
    TableName='my-table',
    KeyConditionExpression='pk = :pk',
    ExpressionAttributeValues={':pk': {'S': 'user123'}}
)

# Put item
client.put_item(
    TableName='my-table',
    Item={
        'pk': {'S': 'user1'},
        'name': {'S': 'John'},
        'age': {'N': '30'}
    }
)

# Delete item
client.delete_item(
    TableName='my-table',
    Key={'pk': {'S': 'user1'}}
)`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
    config.WithEndpointResolverWithOptions(
        aws.EndpointResolverWithOptionsFunc(
            func(service, region string, options ...interface{}) (aws.Endpoint, error) {
                return aws.Endpoint{URL: "http://127.0.0.1:4566"}, nil
            },
        ),
    ),
)

client := dynamodb.NewFromConfig(cfg)
ctx := context.Background()

// Scan table
scanOutput, _ := client.Scan(ctx, &dynamodb.ScanInput{TableName: aws.String("my-table")})

// Query by partition key
queryOutput, _ := client.Query(ctx, &dynamodb.QueryInput{
    TableName:              aws.String("my-table"),
    KeyConditionExpression: aws.String("pk = :pk"),
    ExpressionAttributeValues: map[string]types.AttributeValue{
        ":pk": &types.AttributeValueMemberS{Value: "user123"},
    },
})

// Put item
item := map[string]types.AttributeValue{
    "pk":   &types.AttributeValueMemberS{Value: "user1"},
    "name": &types.AttributeValueMemberS{Value: "John"},
}
client.PutItem(ctx, &dynamodb.PutItemInput{TableName: aws.String("my-table"), Item: item})

// Delete item
client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
    TableName: aws.String("my-table"),
    Key:       map[string]types.AttributeValue{"pk": &types.AttributeValueMemberS{Value: "user1"}},
})`
  },
])

// DynamoDB Streams Examples
const streamExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List streams for a table
aws dynamodbstreams list-streams --endpoint-url http://127.0.0.1:4566

# Get stream details
aws dynamodbstreams describe-stream --stream-arn <stream-arn> --endpoint-url http://127.0.0.1:4566

# Get shard iterator
aws dynamodbstreams get-shard-iterator \\
  --stream-arn <stream-arn> \\
  --shard-id <shard-id> \\
  --shard-iterator-type TRIM_HORIZON \\
  --endpoint-url http://127.0.0.1:4566

# Get stream records
aws dynamodbstreams get-records \\
  --shard-iterator <iterator> \\
  --limit 100 \\
  --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3 - DynamoDB Streams
import { DynamoDBStreamsClient, ListStreamsCommand, DescribeStreamCommand, GetShardIteratorCommand, GetRecordsCommand } from "@aws-sdk/client-dynamodb-streams";

const streamsClient = new DynamoDBStreamsClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List streams
const streamsResponse = await streamsClient.send(new ListStreamsCommand({
  TableName: 'my-table',
}));
console.log('Streams:', streamsResponse.Streams);

// Describe stream
const describeResponse = await streamsClient.send(new DescribeStreamCommand({
  StreamArn: '<stream-arn>',
}));

// Get shard iterator
const iteratorResponse = await streamsClient.send(new GetShardIteratorCommand({
  StreamArn: '<stream-arn>',
  ShardId: '<shard-id>',
  ShardIteratorType: 'TRIM_HORIZON',
}));

// Get records
const recordsResponse = await streamsClient.send(new GetRecordsCommand({
  ShardIterator: iteratorResponse.ShardIterator,
  Limit: 100,
}));
console.log('Records:', recordsResponse.Records);`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3 - dynamodbstreams
import boto3

streams_client = boto3.client(
    'dynamodbstreams',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List streams
response = streams_client.list_streams(TableName='my-table')
for stream in response['Streams']:
    print(f"  Stream: {stream['StreamArn']}")

# Describe stream
response = streams_client.describe_stream(StreamArn='<stream-arn>')
print(f"Stream: {response['StreamDescription']}")

# Get shard iterator
response = streams_client.get_shard_iterator(
    StreamArn='<stream-arn>',
    ShardId='<shard-id>',
    ShardIteratorType='TRIM_HORIZON'
)
iterator = response['ShardIterator']

# Get records
response = streams_client.get_records(ShardIterator=iterator, Limit=100)
for record in response['Records']:
    print(f"Event: {record['eventName']}")`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2 - DynamoDB Streams
import (
    "context"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

streamsClient := dynamodbstreams.NewFromConfig(cfg, func(o *dynamodbstreams.Options) {
    o.BaseURL = aws.String("http://127.0.0.1:4566")
})

// List streams
streamsOutput, err := streamsClient.ListStreams(context.Background(), &dynamodbstreams.ListStreamsInput{
    TableName: aws.String("my-table"),
})
if err != nil {
    panic(err)
}
for _, stream := range streamsOutput.Streams {
    fmt.Printf("Stream: %s\\n", aws.StringValue(stream.StreamArn))
}

// Get records
iteratorOutput, err := streamsClient.GetShardIterator(context.Background(), &dynamodbstreams.GetShardIteratorInput{
    StreamArn:         aws.String("<stream-arn>"),
    ShardId:           aws.String("<shard-id>"),
    ShardIteratorType:  dynamodbstreams.ShardIteratorTypeTrimHorizon,
})
if err != nil {
    panic(err)
}

recordsOutput, err := streamsClient.GetRecords(context.Background(), &dynamodbstreams.GetRecordsInput{
    ShardIterator: iteratorOutput.ShardIterator,
    Limit: aws.Int64(100),
})
if err != nil {
    panic(err)
}
fmt.Printf("Records: %d\\n", len(recordsOutput.Records))`
  },
])

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
async function createTable() {
  if (!newTableName.value.trim() || !partitionKeyName.value.trim()) return
  
  creating.value = true
  try {
    const attributeDefinitions = [
      { AttributeName: partitionKeyName.value.trim(), AttributeType: partitionKeyType.value }
    ]
    
    const keySchema = [
      { AttributeName: partitionKeyName.value.trim(), KeyType: 'HASH' }
    ]
    
    if (hasSortKey.value && sortKeyName.value.trim()) {
      attributeDefinitions.push({ AttributeName: sortKeyName.value.trim(), AttributeType: sortKeyType.value })
      keySchema.push({ AttributeName: sortKeyName.value.trim(), KeyType: 'RANGE' })
    }
    
    const tableInput: any = {
      TableName: newTableName.value.trim(),
      KeySchema: keySchema,
      AttributeDefinitions: attributeDefinitions
    }
    
    if (billingMode.value === 'PAY_PER_REQUEST') {
      tableInput.BillingMode = 'PAY_PER_REQUEST'
    } else {
      tableInput.BillingMode = 'PROVISIONED'
      tableInput.ProvisionedThroughput = {
        ReadCapacityUnits: readCapacity.value,
        WriteCapacityUnits: writeCapacity.value
      }
    }
    
    // Add stream specification if enabled
    if (enableStreams.value) {
      tableInput.StreamSpecification = {
        StreamEnabled: true,
        StreamViewType: streamViewType.value
      }
    }
    
    await dbCreateTable(tableInput)
    
    toast.success('Table created successfully')
    showCreateModal.value = false
    await loadTables()
  } catch (e: any) {
    toast.error('Failed to create table: ' + e.message)
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
    tableDetails.value = data.Table
  } catch (e: any) {
    tableError.value = 'Failed to get table details: ' + e.message
  } finally {
    tableLoading.value = false
  }
}

// View table streams
async function viewStreams(tableName: string) {
  selectedTable.value = { TableName: tableName }
  streams.value = []
  streamRecords.value = []
  selectedStream.value = null
  streamError.value = null
  showStreamModal.value = true
  streamLoading.value = true
  
  try {
    const response = await listStreams(tableName)
    streams.value = response.Streams || []
  } catch (e: any) {
    streamError.value = 'Failed to load streams: ' + e.message
  } finally {
    streamLoading.value = false
  }
}

// Get stream records
async function selectStream(stream: any) {
  selectedStream.value = stream
  streamRecords.value = []
  shardIterator.value = null
  
  if (!stream || !stream.StreamArn) {
    streamError.value = 'No streams available'
    return
  }
  
  loadingRecords.value = true
  streamError.value = null
  
  try {
    const streamArn = stream.StreamArn
    
    // Get shard iterator
    const shards = await describeStream(streamArn)
    
    if (shards.StreamDescription && shards.StreamDescription.Shards && shards.StreamDescription.Shards.length > 0) {
      const shard = shards.StreamDescription.Shards[0]
      
      // Get shard iterator
      const iterator = await getShardIterator(
        streamArn,
        shard.ShardId,
        'TRIM_HORIZON'
      )
      
      shardIterator.value = iterator.ShardIterator
      
      // Get records
      if (shardIterator.value) {
        const records = await getRecords(shardIterator.value)
        streamRecords.value = records.Records || []
        shardIterator.value = records.NextShardIterator
      }
    }
  } catch (e: any) {
    streamError.value = 'Failed to load stream records: ' + e.message
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
    streamRecords.value = [...streamRecords.value, ...(records.Records || [])]
    shardIterator.value = records.NextShardIterator
    
    if (!shardIterator.value) {
      streamError.value = 'No more records available'
    }
  } catch (e: any) {
    streamError.value = 'Failed to load more records: ' + e.message
  } finally {
    loadingRecords.value = false
  }
}

// Format stream event name
function formatEventName(eventName: string): string {
  const colors: Record<string, string> = {
    INSERT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    MODIFY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    REMOVE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  }
  return colors[eventName] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
}

// Format DynamoDB record data
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
    exploreTableDetails.value = detailsData.Table
    
    await scanOrQueryTable(tableName, 'scan')
  } catch (e: any) {
    exploreError.value = 'Failed to load table: ' + e.message
  } finally {
    exploreLoading.value = false
  }
}

// Scan or Query table
async function scanOrQueryTable(tableName: string, mode?: 'scan' | 'query') {
  if (mode) scanMode.value = mode
  exploreLoading.value = true
  exploreError.value = null
  
  try {
    const body: any = { TableName: tableName }
    
    if (scanMode.value === 'query') {
      // Query by partition key
      if (!partitionKeyValue.value.trim()) {
        exploreError.value = 'Partition key value is required for query'
        exploreLoading.value = false
        return
      }
      
      const pkAttr = exploreTableDetails.value.KeySchema.find((k: any) => k.KeyType === 'HASH')
      const skAttr = exploreTableDetails.value.KeySchema.find((k: any) => k.KeyType === 'RANGE')
      
      const keyCondition = [pkAttr.AttributeName + ' = :pk']
      body.ExpressionAttributeValues = {
        ':pk': convertToAttributeValue(partitionKeyValue.value, pkAttr.AttributeName)
      }
      
      if (skAttr && sortKeyValue.value.trim()) {
        const skCondition = getSortKeyCondition(sortKeyCondition.value)
        keyCondition.push(skAttr.AttributeName + ' ' + skCondition.expression + ' :sk')
        body.ExpressionAttributeValues[':sk'] = convertToAttributeValue(sortKeyValue.value, skAttr.AttributeName)
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
    
    if (data.errorMessage) {
      exploreError.value = data.errorMessage
      return
    }
    
    if (mode) {
      items.value = data.Items || []
    } else {
      items.value = [...items.value, ...(data.Items || [])]
    }
    
    lastEvaluatedKey.value = data.LastEvaluatedKey || null
  } catch (e: any) {
    exploreError.value = 'Failed to fetch items: ' + e.message
  } finally {
    exploreLoading.value = false
  }
}

// Get sort key condition expression
function getSortKeyCondition(condition: string): { expression: string, dynamodb: string } {
  const conditions: Record<string, { expression: string, dynamodb: string }> = {
    'eq': { expression: '=', dynamodb: '=' },
    'begins_with': { expression: 'begins_with(#sk, :sk)', dynamodb: 'begins_with' },
    'lt': { expression: '<', dynamodb: '<' },
    'lte': { expression: '<=', dynamodb: '<=' },
    'gt': { expression: '>', dynamodb: '>' },
    'gte': { expression: '>=', dynamodb: '>=' },
    'between': { expression: 'BETWEEN :sk1 AND :sk2', dynamodb: 'between' },
  }
  return conditions[condition] || conditions['eq']
}

// Convert value string to DynamoDB attribute value
function convertToAttributeValue(value: string, attrName: string): any {
  const attrDef = exploreTableDetails.value?.AttributeDefinitions?.find((a: any) => a.AttributeName === attrName)
  const type = attrDef?.AttributeType || 'S'
  
  switch (type) {
    case 'N':
      return { N: value }
    case 'B':
      return { B: value }
    default:
      return { S: value }
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
async function putItem() {
  putItemLoading.value = true
  putItemError.value = null
  
  try {
    const item = JSON.parse(newItemJson.value)
    
    await dbPutItem({
      TableName: exploreTableName.value,
      Item: item
    })
    
    showPutItemModal.value = false
    lastEvaluatedKey.value = null
    await scanOrQueryTable(exploreTableName.value, 'scan')
  } catch (e: any) {
    putItemError.value = e.message.includes('JSON') 
      ? 'Invalid JSON format. Use DynamoDB format like: {"key": {"S": "value"}}'
      : e.message
  } finally {
    putItemLoading.value = false
  }
}

// Confirm delete item
function confirmDeleteItem(item: any) {
  itemToDelete.value = item
  showDeleteItemModal.value = true
}

// Delete item
async function deleteItem() {
  if (!itemToDelete.value) return
  
  deleteItemLoading.value = true
  try {
    // Build key from item
    const key: any = {}
    for (const attr of exploreTableDetails.value.KeySchema) {
      const itemAttr = itemToDelete.value[attr.AttributeName]
      if (itemAttr) {
        key[attr.AttributeName] = itemAttr
      }
    }
    
    await dbDeleteItem({
      TableName: exploreTableName.value,
      Key: key
    })
    
    showDeleteItemModal.value = false
    itemToDelete.value = null
    lastEvaluatedKey.value = null
    await scanOrQueryTable(exploreTableName.value, 'scan')
  } catch (e: any) {
    exploreError.value = 'Failed to delete item: ' + e.message
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
async function deleteTable() {
  if (!tableToDelete.value) return
  
  deleting.value = true
  try {
    await dbDeleteTable(tableToDelete.value)
    showDeleteModal.value = false
    tableToDelete.value = null
    await loadTables()
  } catch (e: any) {
    error.value = 'Failed to delete table: ' + e.message
  } finally {
    deleting.value = false
  }
}

// Get key type label
function getKeyTypeLabel(type: string): string {
  const types: Record<string, string> = {
    'S': 'String',
    'N': 'Number',
    'B': 'Binary'
  }
  return types[type] || type
}

// Get billing mode label
function getBillingModeLabel(mode: string): string {
  const modes: Record<string, string> = {
    'PAY_PER_REQUEST': 'On-Demand',
    'PROVISIONED': 'Provisioned'
  }
  return modes[mode] || mode
}

// Format attribute value for display
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

// Get attribute type label
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
  return '?'
}

// Get partition key name for explore query
const explorePKName = computed(() => {
  if (!exploreTableDetails.value) return ''
  const pk = exploreTableDetails.value.KeySchema?.find((k: any) => k.KeyType === 'HASH')
  return pk?.AttributeName || ''
})

// Get sort key name for explore query
const exploreSKName = computed(() => {
  if (!exploreTableDetails.value) return ''
  const sk = exploreTableDetails.value.KeySchema?.find((k: any) => k.KeyType === 'RANGE')
  return sk?.AttributeName || ''
})

// Get all unique attribute names from items
const allAttributes = computed(() => {
  const attrs = new Set<string>()
  items.value.forEach(item => {
    Object.keys(item).forEach(key => attrs.add(key))
  })
  return Array.from(attrs)
})

// Example code tabs
const selectedExample = ref(0)
const exampleType = ref<'table' | 'stream'>('table')

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
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
              <component
                :is="expandedTables.has(table) ? ChevronDownIcon : ChevronRightIcon"
                class="h-5 w-5"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              />
              <TableCellsIcon class="h-5 w-5 text-primary-500" />
              <span class="font-medium text-light-text dark:text-dark-text">{{ table }}</span>
            </div>
            <div class="col-span-4 text-right" @click.stop>
              <div class="flex items-center justify-end gap-2">
                <button
                  class="px-3 py-1 text-sm text-green-500 hover:text-green-700 border border-green-500 rounded hover:bg-green-50"
                  @click="exploreTable(table)"
                >
                  Explore Data
                </button>
                <button
                  class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Delete"
                  @click="confirmDelete(table)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Accordion Content -->
          <div
            v-if="expandedTables.has(table)"
            class="px-4 pb-4 border-t"
            :class="settingsStore.darkMode ? 'border-dark-border' : 'border-light-border'"
          >
            <div v-if="tableDetailsMap[table]" class="mt-4 space-y-4">
              <!-- Table Status -->
              <div class="flex items-center gap-2">
                <span
                  class="px-2 py-1 text-xs rounded"
                  :class="tableDetailsMap[table].TableStatus === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'"
                >
                  {{ tableDetailsMap[table].TableStatus }}
                </span>
                <span class="text-sm text-light-muted dark:text-dark-muted">
                  {{ getBillingModeLabel(tableDetailsMap[table].BillingModeSummary?.BillingMode || 'PROVISIONED') }}
                </span>
              </div>
              
              <!-- Key Schema -->
              <div>
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Key Schema</label>
                <div class="space-y-2">
                  <div 
                    v-for="key in tableDetailsMap[table].KeySchema"
                    :key="key.AttributeName"
                    class="flex items-center gap-2"
                  >
                    <span class="text-sm font-medium text-light-text dark:text-dark-text">{{ key.AttributeName }}</span>
                    <span class="text-xs px-2 py-0.5 rounded" :class="key.KeyType === 'HASH' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'"
                    >
                      {{ key.KeyType === 'HASH' ? 'Partition Key' : 'Sort Key' }}
                      ({{ getKeyTypeLabel(tableDetailsMap[table].AttributeDefinitions?.find((a: any) => a.AttributeName === key.AttributeName)?.AttributeType || 'S') }})
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Attribute Definitions -->
              <div v-if="tableDetailsMap[table].AttributeDefinitions?.length > 0">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Attributes</label>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="attr in tableDetailsMap[table].AttributeDefinitions"
                    :key="attr.AttributeName"
                    class="text-sm px-2 py-1 rounded bg-light-border dark:bg-dark-border text-light-text dark:text-dark-text"
                  >
                    {{ attr.AttributeName }} ({{ attr.AttributeType }})
                  </span>
                </div>
              </div>
              
              <!-- Provisioned Throughput -->
              <div v-if="tableDetailsMap[table].ProvisionedThroughput" class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Read Capacity</label>
                  <p class="text-sm text-light-text dark:text-dark-text">{{ tableDetailsMap[table].ProvisionedThroughput.ReadCapacityUnits }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Write Capacity</label>
                  <p class="text-sm text-light-text dark:text-dark-text">{{ tableDetailsMap[table].ProvisionedThroughput.WriteCapacityUnits }}</p>
                </div>
              </div>
              
              <!-- Table Stats -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Item Count</label>
                  <p class="text-sm text-light-text dark:text-dark-text">{{ tableDetailsMap[table].ItemCount || 0 }}</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Size</label>
                  <p class="text-sm text-light-text dark:text-dark-text">{{ tableDetailsMap[table].TableSizeBytes ? (tableDetailsMap[table].TableSizeBytes / 1024).toFixed(2) + ' KB' : '0 KB' }}</p>
                </div>
              </div>
              
              <!-- Stream Specification -->
              <div v-if="tableDetailsMap[table].StreamSpecification?.StreamEnabled">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Stream</label>
                <p class="text-sm text-light-text dark:text-dark-text">
                  {{ tableDetailsMap[table].StreamSpecification.StreamViewType?.replace(/_/g, ' ') }}
                </p>
              </div>
            </div>
            <div v-else-if="!tableDetailsMap[table]" class="mt-4 text-center py-4">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent" />
              <p class="mt-2 text-sm text-light-muted dark:text-dark-muted">Loading table details...</p>
            </div>
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
          @click="exampleType = 'table'; selectedExample = 0"
        >
          Table Operations
        </button>
        <button
          class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="exampleType === 'stream'
            ? 'bg-blue-600 text-white'
            : settingsStore.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="exampleType = 'stream'; selectedExample = 0"
        >
          DynamoDB Streams
        </button>
      </div>
      
      <!-- Table Operations Examples -->
      <div
        v-if="exampleType === 'table'"
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          class="flex border-b overflow-x-auto"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <button
            v-for="(example, index) in codeExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
            :class="[
              selectedExample === index
                ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="selectedExample = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >{{ codeExamples[selectedExample]?.code || '' }}</pre>
        </div>
      </div>
      
      <!-- DynamoDB Streams Examples -->
      <div
        v-if="exampleType === 'stream'"
        class="rounded-lg border overflow-hidden"
        :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
      >
        <div
          class="flex border-b overflow-x-auto"
          :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
        >
          <button
            v-for="(example, index) in streamExamples"
            :key="example.language"
            class="px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
            :class="[
              selectedExample === index
                ? settingsStore.darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                : settingsStore.darkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            ]"
            @click="selectedExample = index"
          >
            {{ example.label }}
          </button>
        </div>
        <div class="p-4 overflow-x-auto">
          <pre
            class="text-sm font-mono"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >{{ streamExamples[selectedExample]?.code || '' }}</pre>
        </div>
      </div>
    </div>
  </div>

  <!-- Create Table Modal -->
  <Modal
    :open="showCreateModal"
    title="Create DynamoDB Table"
    size="lg"
    @update:open="showCreateModal = $event"
    @close="showCreateModal = false"
  >
    <div class="space-y-6">
      <!-- Table Name -->
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Table Name *
        </label>
        <input
          v-model="newTableName"
          type="text"
          placeholder="my-table"
          class="w-full px-3 py-2 rounded-lg border"
          :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
        >
      </div>

      <!-- Partition Key -->
      <div
        class="p-4 rounded-lg"
        :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
      >
        <h4
          class="text-sm font-medium mb-3"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Partition Key (Required)
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="block text-xs mb-1"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >
              Attribute Name
            </label>
            <input
              v-model="partitionKeyName"
              type="text"
              placeholder="pk"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :class="settingsStore.darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'"
            >
          </div>
          <div>
            <label
              class="block text-xs mb-1"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >
              Type
            </label>
            <select
              v-model="partitionKeyType"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :class="settingsStore.darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'"
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
      <div
        class="p-4 rounded-lg"
        :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
      >
        <div class="flex items-center justify-between mb-3">
          <h4
            class="text-sm font-medium"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Sort Key (Optional)
          </h4>
          <label class="flex items-center gap-2 text-sm">
            <input
              v-model="hasSortKey"
              type="checkbox"
              class="rounded border-gray-300"
            >
            <span :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'">Enable</span>
          </label>
        </div>
        <div
          v-if="hasSortKey"
          class="grid grid-cols-2 gap-4"
        >
          <div>
            <label
              class="block text-xs mb-1"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >
              Attribute Name
            </label>
            <input
              v-model="sortKeyName"
              type="text"
              placeholder="sk"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :class="settingsStore.darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'"
            >
          </div>
          <div>
            <label
              class="block text-xs mb-1"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >
              Type
            </label>
            <select
              v-model="sortKeyType"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              :class="settingsStore.darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'"
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
        <label
          class="block text-sm font-medium mb-2"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Billing Mode
        </label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2">
            <input
              v-model="billingMode"
              type="radio"
              value="PAY_PER_REQUEST"
              class="border-gray-300"
            >
            <span
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
            >On-Demand</span>
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="billingMode"
              type="radio"
              value="PROVISIONED"
              class="border-gray-300"
            >
            <span
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
            >Provisioned</span>
          </label>
        </div>
      </div>

      <!-- Provisioned Throughput (if PROVISIONED) -->
      <div
        v-if="billingMode === 'PROVISIONED'"
        class="grid grid-cols-2 gap-4"
      >
        <div>
          <label
            class="block text-xs mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            Read Capacity Units
          </label>
          <input
            v-model.number="readCapacity"
            type="number"
            min="1"
            class="w-full px-3 py-2 rounded-lg border text-sm"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
          >
        </div>
        <div>
          <label
            class="block text-xs mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            Write Capacity Units
          </label>
          <input
            v-model.number="writeCapacity"
            type="number"
            min="1"
            class="w-full px-3 py-2 rounded-lg border text-sm"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
          >
        </div>
      </div>

      <!-- Stream Settings -->
      <div
        class="p-4 rounded-lg border"
        :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <h4
              class="text-sm font-medium"
              :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
            >
              DynamoDB Streams
            </h4>
            <p
              class="text-xs mt-1"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >
              Capture item-level changes in your table
            </p>
          </div>
          <label class="flex items-center gap-2">
            <input
              v-model="enableStreams"
              type="checkbox"
              class="rounded border-gray-300"
            >
            <span
              class="text-sm"
              :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
            >Enable</span>
          </label>
        </div>
        
        <div
          v-if="enableStreams"
          class="mt-3"
        >
          <label
            class="block text-xs mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            Stream View Type
          </label>
          <select
            v-model="streamViewType"
            class="w-full px-3 py-2 rounded-lg border text-sm"
            :class="settingsStore.darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'"
          >
            <option value="KEYS_ONLY">
              Keys Only - Only the key attributes of the modified item
            </option>
            <option value="NEW_IMAGE">
              New Image - The entire item as it appears after modification
            </option>
            <option value="OLD_IMAGE">
              Old Image - The entire item as it appeared before modification
            </option>
            <option value="NEW_AND_OLD_IMAGES">
              New and Old Images - Both the new and old item images
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
        @click="showCreateModal = false"
      >
        Cancel
      </button>
      <button
        :disabled="!newTableName.trim() || !partitionKeyName.trim() || creating"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        @click="createTable"
      >
        {{ creating ? 'Creating...' : 'Create Table' }}
      </button>
    </template>
  </Modal>

  <!-- View Table Details Modal -->
  <Modal
    :open="showViewModal"
    :title="selectedTable?.TableName || 'Table Details'"
    size="lg"
    @update:open="showViewModal = $event"
    @close="showViewModal = false"
  >
    <!-- Loading -->
    <div
      v-if="tableLoading"
      class="text-center py-8"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading table details...
      </p>
    </div>

    <!-- Error -->
    <div
      v-else-if="tableError"
      class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ tableError }}
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
        <span
          class="text-sm"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          {{ getBillingModeLabel(tableDetails.BillingModeSummary?.BillingMode || 'PROVISIONED') }}
        </span>
      </div>

      <!-- Key Schema -->
      <div>
        <h4
          class="text-sm font-medium mb-2"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Key Schema
        </h4>
        <div class="space-y-2">
          <div
            v-for="key in tableDetails.KeySchema"
            :key="key.AttributeName"
            class="flex items-center gap-3 p-3 rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
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
              <span
                class="font-medium"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ key.AttributeName }}
              </span>
              <span
                class="text-sm ml-2"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >
                ({{ getKeyTypeLabel(tableDetails.AttributeDefinitions.find((a: any) => a.AttributeName === key.AttributeName)?.AttributeType || 'S') }})
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Attribute Definitions -->
      <div>
        <h4
          class="text-sm font-medium mb-2"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Attribute Definitions
        </h4>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'">
                <th
                  class="px-3 py-2 text-left font-medium"
                  :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
                >
                  Attribute
                </th>
                <th
                  class="px-3 py-2 text-left font-medium"
                  :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
                >
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="attr in tableDetails.AttributeDefinitions"
                :key="attr.AttributeName"
                :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
              >
                <td
                  class="px-3 py-2"
                  :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
                >
                  {{ attr.AttributeName }}
                </td>
                <td
                  class="px-3 py-2"
                  :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
                >
                  {{ getKeyTypeLabel(attr.AttributeType) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Provisioned Throughput (if applicable) -->
      <div v-if="tableDetails.ProvisionedThroughput">
        <h4
          class="text-sm font-medium mb-2"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Provisioned Throughput
        </h4>
        <div class="grid grid-cols-2 gap-4">
          <div
            class="p-3 rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
          >
            <span
              class="text-xs"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >Read Capacity</span>
            <p
              class="font-medium"
              :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
            >
              {{ tableDetails.ProvisionedThroughput.ReadCapacityUnits }}
            </p>
          </div>
          <div
            class="p-3 rounded-lg"
            :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
          >
            <span
              class="text-xs"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >Write Capacity</span>
            <p
              class="font-medium"
              :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
            >
              {{ tableDetails.ProvisionedThroughput.WriteCapacityUnits }}
            </p>
          </div>
        </div>
      </div>

      <!-- Table Stats -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'">Item Count:</span>
          <span
            class="ml-2 font-medium"
            :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
          >
            {{ tableDetails.ItemCount || 0 }}
          </span>
        </div>
        <div>
          <span :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'">Table Size:</span>
          <span
            class="ml-2 font-medium"
            :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
          >
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
          <button
            class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            @click="viewStreams(selectedTable.TableName)"
          >
            View Streams
          </button>
        </div>
      </div>
      <div
        v-else
        class="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between">
          <div>
            <h4
              class="text-sm font-medium"
              :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
            >
              DynamoDB Streams
            </h4>
            <p
              class="text-xs mt-1"
              :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
            >
              Not enabled for this table
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        @click="showViewModal = false"
      >
        Close
      </button>
    </template>
  </Modal>

  <!-- Explore Data Modal -->
  <Modal
    :open="showExploreModal"
    :title="'Explore: ' + exploreTableName"
    size="3xl"
    @update:open="showExploreModal = $event"
    @close="showExploreModal = false"
  >
    <!-- Error -->
    <div
      v-if="exploreError"
      class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
    >
      {{ exploreError }}
    </div>

    <!-- Scan/Query Toggle -->
    <div class="flex items-center gap-4 mb-4">
      <div
        class="flex rounded-lg overflow-hidden border"
        :class="settingsStore.darkMode ? 'border-gray-600' : 'border-gray-300'"
      >
        <button
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="scanMode === 'scan' 
            ? 'bg-blue-600 text-white' 
            : settingsStore.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="scanMode = 'scan'; lastEvaluatedKey = null; scanOrQueryTable(exploreTableName, 'scan')"
        >
          Scan All
        </button>
        <button
          class="px-4 py-2 text-sm font-medium transition-colors"
          :class="scanMode === 'query' 
            ? 'bg-blue-600 text-white' 
            : settingsStore.darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          @click="scanMode = 'query'; lastEvaluatedKey = null; items = []"
        >
          Query
        </button>
      </div>
      
      <button
        class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
        @click="openPutItemModal"
      >
        + Add Item
      </button>
    </div>

    <!-- Query Filters -->
    <div
      v-if="scanMode === 'query'"
      class="mb-4 p-4 rounded-lg"
      :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
    >
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label
            class="block text-xs mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            {{ explorePKName }} (Partition Key) *
          </label>
          <input
            v-model="partitionKeyValue"
            type="text"
            :placeholder="'Enter ' + explorePKName"
            class="w-full px-3 py-2 rounded-lg border text-sm"
            :class="settingsStore.darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'"
          >
        </div>
        <div v-if="exploreSKName">
          <label
            class="block text-xs mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            Condition
          </label>
          <select
            v-model="sortKeyCondition"
            class="w-full px-3 py-2 rounded-lg border text-sm"
            :class="settingsStore.darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'"
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
              > (greater than)
            </option>
            <option value="gte">
              >= (greater or equal)
            </option>
          </select>
        </div>
        <div v-if="exploreSKName">
          <label
            class="block text-xs mb-1"
            :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
          >
            {{ exploreSKName }} (Sort Key)
          </label>
          <input
            v-model="sortKeyValue"
            type="text"
            :placeholder="'Enter ' + exploreSKName"
            class="w-full px-3 py-2 rounded-lg border text-sm"
            :class="settingsStore.darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300'"
          >
        </div>
      </div>
      <button
        class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        @click="lastEvaluatedKey = null; scanOrQueryTable(exploreTableName, 'query')"
      >
        Run Query
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="exploreLoading"
      class="text-center py-8"
    >
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
      <p
        class="mt-2"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-600'"
      >
        Loading items...
      </p>
    </div>

    <!-- Items Table -->
    <div
      v-else
      class="space-y-4"
    >
      <div
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        {{ items.length }} item(s) found
      </div>

      <div
        v-if="items.length === 0"
        class="text-center py-8"
      >
        <p class="text-gray-500">
          No items found in this table.
        </p>
      </div>

      <div
        v-else
        class="overflow-x-auto rounded-lg border"
        :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
      >
        <table class="w-full text-sm">
          <thead :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'">
            <tr>
              <th
                v-for="attr in allAttributes"
                :key="attr"
                class="px-3 py-2 text-left font-medium"
                :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                <div class="flex items-center gap-1">
                  {{ attr }}
                  <span
                    v-if="exploreTableDetails?.KeySchema?.some((k: any) => k.AttributeName === attr)"
                    :class="[
                      'px-1.5 py-0.5 text-[10px] rounded',
                      exploreTableDetails?.KeySchema?.find((k: any) => k.AttributeName === attr)?.KeyType === 'HASH'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    ]"
                  >
                    {{ exploreTableDetails?.KeySchema?.find((k: any) => k.AttributeName === attr)?.KeyType }}
                  </span>
                </div>
              </th>
              <th
                class="px-3 py-2 text-right font-medium"
                :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in items"
              :key="index"
              class="border-t"
              :class="settingsStore.darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'"
            >
              <td
                v-for="attr in allAttributes"
                :key="attr"
                class="px-3 py-2"
                :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-900'"
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
                  @click="confirmDeleteItem(item)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        <button
          :disabled="exploreLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          @click="loadMoreItems"
        >
          Load More
        </button>
        <p
          class="text-xs mt-2"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          There are more items to load
        </p>
      </div>
    </div>
    
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        @click="showExploreModal = false"
      >
        Close
      </button>
    </template>
  </Modal>

  <!-- Put Item Modal -->
  <Modal
    :open="showPutItemModal"
    title="Add Item"
    size="lg"
    @update:open="showPutItemModal = $event"
    @close="showPutItemModal = false"
  >
    <div class="space-y-4">
      <div
        v-if="putItemError"
        class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm"
      >
        {{ putItemError }}
      </div>
      
      <div>
        <label
          class="block text-sm font-medium mb-1"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          Item (DynamoDB JSON format)
        </label>
        <p
          class="text-xs mb-2"
          :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
        >
          Use DynamoDB attribute format: {"key": {"S": "value"}} or {"count": {"N": "42"}}
        </p>
        <textarea
          v-model="newItemJson"
          rows="12"
          placeholder="{&quot;pk&quot;: {&quot;S&quot;: &quot;user1&quot;}, &quot;name&quot;: {&quot;S&quot;: &quot;John&quot;}, &quot;age&quot;: {&quot;N&quot;: &quot;30&quot;}}"
          class="w-full px-3 py-2 rounded-lg border font-mono text-sm"
          :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'"
        />
      </div>

      <!-- Key Info -->
      <div
        v-if="exploreTableDetails"
        class="p-3 rounded-lg text-xs"
        :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
      >
        <span
          class="font-medium"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >Required Keys:</span>
        <span :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'">
          {{ exploreTableDetails.KeySchema?.map((k: any) => k.AttributeName).join(', ') }}
        </span>
      </div>
    </div>
    
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
        @click="showPutItemModal = false"
      >
        Cancel
      </button>
      <button
        :disabled="putItemLoading"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        @click="putItem"
      >
        {{ putItemLoading ? 'Adding...' : 'Add Item' }}
      </button>
    </template>
  </Modal>

  <!-- Delete Item Confirmation Modal -->
  <Modal
    :open="showDeleteItemModal"
    title="Delete Item"
    size="sm"
    @update:open="showDeleteItemModal = $event"
    @close="showDeleteItemModal = false"
  >
    <div class="text-center py-4">
      <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 text-red-600 dark:text-red-400"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <p
        class="text-lg font-medium mb-2"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Delete this item?
      </p>
      <p
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        This action cannot be undone.
      </p>
      <!-- Show key values -->
      <div
        v-if="itemToDelete"
        class="mt-3 p-2 rounded text-left"
        :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
      >
        <p
          v-for="attr in exploreTableDetails?.KeySchema"
          :key="attr.AttributeName"
          class="text-xs font-mono"
          :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
        >
          {{ attr.AttributeName }}: {{ formatAttributeValue(itemToDelete[attr.AttributeName]) }}
        </p>
      </div>
    </div>
    
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
        @click="showDeleteItemModal = false"
      >
        Cancel
      </button>
      <button
        :disabled="deleteItemLoading"
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        @click="deleteItem"
      >
        {{ deleteItemLoading ? 'Deleting...' : 'Delete Item' }}
      </button>
    </template>
  </Modal>

  <!-- Delete Table Confirmation Modal -->
  <Modal
    :open="showDeleteModal"
    title="Delete Table"
    size="sm"
    @update:open="showDeleteModal = $event"
    @close="showDeleteModal = false"
  >
    <div class="text-center py-4">
      <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 text-red-600 dark:text-red-400"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      </div>
      <p
        class="text-lg font-medium mb-2"
        :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
      >
        Delete "{{ tableToDelete }}"?
      </p>
      <p
        class="text-sm"
        :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
      >
        This will permanently delete the table and all its data. This action cannot be undone.
      </p>
    </div>
    
    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 mr-2"
        @click="showDeleteModal = false"
      >
        Cancel
      </button>
      <button
        :disabled="deleting"
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        @click="deleteTable"
      >
        {{ deleting ? 'Deleting...' : 'Delete Table' }}
      </button>
    </template>
  </Modal>

  <!-- Stream Viewer Modal -->
  <Modal
    v-model:open="showStreamModal"
    :title="'DynamoDB Streams: ' + (selectedTable?.TableName || '')"
    size="3xl"
  >
    <!-- Loading -->
    <div
      v-if="streamLoading"
      class="flex justify-center py-8"
    >
      <LoadingSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="streamError && streams.length === 0"
      class="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg"
    >
      {{ streamError }}
    </div>

    <!-- Stream Content -->
    <div
      v-else
      class="space-y-4"
    >
      <!-- Stream Info -->
      <div
        class="p-4 rounded-lg"
        :class="settingsStore.darkMode ? 'bg-gray-700' : 'bg-gray-50'"
      >
        <div v-if="streams.length > 0">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >Stream ARN:</span>
              <p
                class="font-mono text-xs mt-1 break-all"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ streams[0]?.StreamArn }}
              </p>
            </div>
            <div>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >Status:</span>
              <p
                class="font-medium text-sm mt-1"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ streams[0]?.StreamStatus }}
              </p>
            </div>
            <div>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >View Type:</span>
              <p
                class="font-medium text-sm mt-1"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ streams[0]?.StreamViewType?.replace(/_/g, ' ') }}
              </p>
            </div>
            <div>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >Stream Label:</span>
              <p
                class="font-mono text-xs mt-1"
                :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
              >
                {{ streams[0]?.StreamLabel }}
              </p>
            </div>
          </div>
        </div>
        <div
          v-else
          class="text-center py-4"
        >
          <p :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'">
            No streams available for this table
          </p>
        </div>
      </div>

      <!-- Records Section -->
      <div v-if="selectedStream">
        <div class="flex items-center justify-between mb-3">
          <h4
            class="text-sm font-medium"
            :class="settingsStore.darkMode ? 'text-gray-300' : 'text-gray-700'"
          >
            Stream Records
            <span class="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {{ streamRecords.length }}
            </span>
          </h4>
          <button
            v-if="shardIterator"
            :disabled="loadingRecords"
            class="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            @click="loadMoreRecords"
          >
            {{ loadingRecords ? 'Loading...' : 'Load More' }}
          </button>
        </div>

        <!-- Records List -->
        <div
          v-if="streamRecords.length > 0"
          class="space-y-3 max-h-96 overflow-y-auto"
        >
          <div
            v-for="(record, index) in streamRecords"
            :key="index"
            class="p-4 rounded-lg border"
            :class="settingsStore.darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'"
          >
            <div class="flex items-center justify-between mb-2">
              <span
                class="px-2 py-0.5 text-xs font-medium rounded"
                :class="formatEventName(record.eventName)"
              >
                {{ record.eventName }}
              </span>
              <span
                class="text-xs"
                :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'"
              >
                {{ new Date(record.dynamodb?.ApproximateCreationDateTime * 1000).toLocaleString() }}
              </span>
            </div>
            <pre
              class="text-xs font-mono overflow-x-auto p-2 rounded"
              :class="settingsStore.darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-700'"
            >{{ formatRecordData(record) }}</pre>
          </div>
        </div>
        <div
          v-else
          class="text-center py-8"
        >
          <p :class="settingsStore.darkMode ? 'text-gray-400' : 'text-gray-500'">
            No records in stream yet. Make changes to items in the table to see stream events.
          </p>
        </div>
      </div>

      <!-- Select Stream Button -->
      <div
        v-if="streams.length > 0 && !selectedStream"
        class="text-center py-4"
      >
        <button
          :disabled="streamLoading"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          @click="selectStream(streams[0])"
        >
          View Stream Events
        </button>
      </div>
    </div>

    <template #footer>
      <button
        class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        @click="showStreamModal = false"
      >
        Close
      </button>
    </template>
  </Modal>
</template>
