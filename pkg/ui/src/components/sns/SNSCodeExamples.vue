<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const settingsStore = useSettingsStore()

const snippets = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List SNS topics
aws sns list-topics --endpoint-url http://127.0.0.1:4566

# Create topic
aws sns create-topic \\
  --name my-topic \\
  --display-name "My Topic" \\
  --endpoint-url http://127.0.0.1:4566

# Create FIFO topic
aws sns create-topic \\
  --name my-topic.fifo \\
  --attributes "FifoTopic=true,ContentBasedDeduplication=true" \\
  --endpoint-url http://127.0.0.1:4566

# Subscribe to topic (HTTPS)
aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --protocol https \\
  --notification-endpoint https://my-app.com/webhook \\
  --endpoint-url http://127.0.0.1:4566

# Subscribe to topic (Email)
aws sns subscribe \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --protocol email \\
  --notification-endpoint your@email.com \\
  --endpoint-url http://127.0.0.1:4566

# List subscriptions by topic
aws sns list-subscriptions-by-topic \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --endpoint-url http://127.0.0.1:4566

# Publish message
aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --message "Hello World" \\
  --subject "Notification" \\
  --endpoint-url http://127.0.0.1:4566

# Publish JSON message
aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --message '{"default": "Hello via SNS"}' \\
  --message-structure json \\
  --endpoint-url http://127.0.0.1:4566

# Delete topic
aws sns delete-topic \\
  --topic-arn arn:aws:sns:us-east-1:000000000000:my-topic \\
  --endpoint-url http://127.0.0.1:4566`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { SNSClient, ListTopicsCommand, CreateTopicCommand, SubscribeCommand, PublishCommand, DeleteTopicCommand, ListSubscriptionsByTopicCommand } from "@aws-sdk/client-sns";

const client = new SNSClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List topics
const topics = await client.send(new ListTopicsCommand({}));
console.log(topics.Topics);

// Create topic
const createResponse = await client.send(new CreateTopicCommand({
  Name: 'my-topic',
  DisplayName: 'My Topic',
}));
console.log(createResponse.TopicArn);

// Subscribe to topic
await client.send(new SubscribeCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
  Protocol: 'https',
  Endpoint: 'https://my-app.com/webhook',
}));

// List subscriptions by topic
const subsResponse = await client.send(new ListSubscriptionsByTopicCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
}));
console.log(subsResponse.Subscriptions);

// Publish message
await client.send(new PublishCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
  Message: 'Hello World',
  Subject: 'Notification',
}));

// Publish JSON message
await client.send(new PublishCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
  Message: JSON.stringify({ default: 'Hello via SNS!' }),
  MessageStructure: 'json',
}));

// Delete topic
await client.send(new DeleteTopicCommand({
  TopicArn: 'arn:aws:sns:us-east-1:000000000000:my-topic',
}));`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3
import json

client = boto3.client(
    'sns',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List topics
response = client.list_topics()
for topic in response['Topics']:
    print(topic['TopicArn'])

# Create topic
response = client.create_topic(
    Name='my-topic',
    DisplayName='My Topic'
)
topic_arn = response['TopicArn']
print(topic_arn)

# Subscribe to topic
client.subscribe(
    TopicArn=topic_arn,
    Protocol='https',
    Endpoint='https://my-app.com/webhook',
)

# List subscriptions by topic
response = client.list_subscriptions_by_topic(TopicArn=topic_arn)
for sub in response['Subscriptions']:
    print(sub['Endpoint'])

# Publish message
client.publish(
    TopicArn=topic_arn,
    Message='Hello World',
    Subject='Notification',
)

# Publish JSON message
client.publish(
    TopicArn=topic_arn,
    Message=json.dumps({'default': 'Hello via SNS!'}),
    MessageStructure='json',
)

# Delete topic
client.delete_topic(TopicArn=topic_arn)`,
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "encoding/json"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/sns"
    "github.com/aws/aws-sdk-go/aws"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := sns.NewFromConfig(cfg, func(o *sns.Options) {
    o.BaseURL = aws.String("http://127.0.0.1:4566")
})

// List topics
topics, _ := client.ListTopics(context.Background(), &sns.ListTopicsInput{})
fmt.Println(topics.Topics)

// Create topic
createOutput, _ := client.CreateTopic(context.Background(), &sns.CreateTopicInput{
    Name:        aws.String("my-topic"),
    DisplayName: aws.String("My Topic"),
})
fmt.Println(createOutput.TopicArn)

// Subscribe to topic
_, _ = client.Subscribe(context.Background(), &sns.SubscribeInput{
    TopicArn: aws.String("arn:aws:sns:us-east-1:000000000000:my-topic"),
    Protocol:  aws.String("https"),
    Endpoint:  aws.String("https://my-app.com/webhook"),
})

// Publish message
_, _ = client.Publish(context.Background(), &sns.PublishInput{
    TopicArn: aws.String("arn:aws:sns:us-east-1:000000000000:my-topic"),
    Message:   aws.String("Hello World"),
    Subject:   aws.String("Notification"),
})

// Publish JSON message
message, _ := json.Marshal(map[string]string{"default": "Hello via SNS!"})
_, _ = client.Publish(context.Background(), &sns.PublishInput{
    TopicArn:       aws.String("arn:aws:sns:us-east-1:000000000000:my-topic"),
    Message:        aws.String(string(message)),
    MessageStructure: aws.String("json"),
})

// Delete topic
_, _ = client.DeleteTopic(context.Background(), &sns.DeleteTopicInput{
    TopicArn: aws.String("arn:aws:sns:us-east-1:000000000000:my-topic"),
})`,
  },
])
</script>

<template>
  <CodeSnippet
    title="Usage Examples"
    :snippets="snippets"
    default-tab="aws-cli"
    :disable-highlight="true"
  />
</template>