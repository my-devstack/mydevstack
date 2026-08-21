<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const settingsStore = useSettingsStore()

const snippets = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List state machines
aws stepfunctions list-state-machines --endpoint-url ${settingsStore.publicEndpoint}

# Create state machine
aws stepfunctions create-state-machine \\
    --name "MyStateMachine" \\
    --definition '{"StartAt": "HelloWorld", "States": {"HelloWorld": {"Type": "Pass", "End": true}}}' \\
    --role-arn "arn:aws:iam::123456789012:role/my-role" \\
    --endpoint-url ${settingsStore.publicEndpoint}

# Start execution
aws stepfunctions start-execution \\
    --state-machine-arn "arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine" \\
    --input '{"key": "value"}' \\
    --endpoint-url ${settingsStore.publicEndpoint}

# Describe execution
aws stepfunctions describe-execution \\
    --execution-arn "arn:aws:states:us-east-1:123456789012:execution:MyStateMachine:exec-01" \\
    --endpoint-url ${settingsStore.publicEndpoint}`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `import { SFNClient,
  ListStateMachinesCommand,
  StartExecutionCommand,
  DescribeExecutionCommand,
} from "@aws-sdk/client-sfn";

const client = new SFNClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.publicEndpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List state machines
const listCmd = new ListStateMachinesCommand({});
const listResp = await client.send(listCmd);
console.log(listResp.stateMachines);

// Start execution
const startCmd = new StartExecutionCommand({
  stateMachineArn: "arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine",
  input: JSON.stringify({ key: "value" }),
});
const startResp = await client.send(startCmd);
console.log(startResp.executionArn);

// Describe execution
const descCmd = new DescribeExecutionCommand({
  executionArn: "arn:aws:states:us-east-1:123456789012:execution:MyStateMachine:exec-01",
});
const descResp = await client.send(descCmd);
console.log(descResp.status, descResp.startDate);`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `import boto3

client = boto3.client(
    'stepfunctions',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.publicEndpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List state machines
response = client.list_state_machines()
for sm in response['stateMachines']:
    print(f"{sm['name']}: {sm['stateMachineArn']}")

# Start execution
response = client.start_execution(
    stateMachineArn='arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine',
    input='{"key": "value"}',
)
print(f"Execution: {response['executionArn']}")

# Describe execution
response = client.describe_execution(
    executionArn='arn:aws:states:us-east-1:123456789012:execution:MyStateMachine:exec-01'
)
print(f"Status: {response['status']}")
print(f"Start: {response['startDate']}")`,
  },
  {
    language: 'go',
    label: 'Go',
    code: `import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/sfn"
)

cfg, _ := config.LoadDefaultConfig(
    context.Background(),
    config.WithRegion("${settingsStore.region}"),
    config.WithEndpointResolverWithOptions(
        aws.EndpointResolverWithOptionsFunc(
            func(service, region string, options ...interface{}) (aws.Endpoint, error) {
                return aws.Endpoint{URL: "${settingsStore.publicEndpoint}"}, nil
            },
        ),
    ),
    config.WithCredentialsProvider(
        credentials.NewStaticCredentialsProvider(
            "${settingsStore.accessKey}",
            "${settingsStore.secretKey}",
            "",
        ),
    ),
)
client := sfn.NewFromConfig(cfg)

// List state machines
resp, _ := client.ListStateMachines(context.Background(), &sfn.ListStateMachinesInput{})
for _, sm := range resp.StateMachines {
    fmt.Println(*sm.Name, *sm.StateMachineArn)
}

// Start execution
startResp, _ := client.StartExecution(context.Background(), &sfn.StartExecutionInput{
    StateMachineArn: aws.String("arn:aws:states:us-east-1:123456789012:stateMachine:MyStateMachine"),
    Input:           aws.String(\`{"key": "value"}\`),
})
fmt.Println(*startResp.ExecutionArn)

// Describe execution
descResp, _ := client.DescribeExecution(context.Background(), &sfn.DescribeExecutionInput{
    ExecutionArn: aws.String("arn:aws:states:us-east-1:123456789012:execution:MyStateMachine:exec-01"),
})
fmt.Println(*descResp.Status, *descResp.StartDate)`,
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
