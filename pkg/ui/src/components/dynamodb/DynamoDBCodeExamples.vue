<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

interface Props {
  type?: 'table' | 'stream'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'table',
})

const settingsStore = useSettingsStore()

const tableExamples = computed(() => [
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
  --endpoint-url http://127.0.0.1:4566`,
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
}));`,
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
)`,
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
})`,
  },
])

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
  --endpoint-url http://127.0.0.1:4566`,
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
console.log('Records:', recordsResponse.Records);`,
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
    print(f"Event: {record['eventName']}")`,
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
fmt.Printf("Records: %d\\n", len(recordsOutput.Records))`,
  },
])

const snippets = computed(() => props.type === 'stream' ? streamExamples.value : tableExamples.value)
</script>

<template>
  <CodeSnippet
    title="Usage Examples"
    :snippets="snippets"
    default-tab="aws-cli"
  />
</template>