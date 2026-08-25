<script setup lang="ts">
import { computed } from 'vue'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const props = defineProps<{
  region: string
  accessKey: string
  secretKey: string
}>()

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List clusters
aws ecs list-clusters --endpoint-url http://127.0.0.1:4566

# Create cluster
aws ecs create-cluster \\
  --cluster-name my-cluster \\
  --endpoint-url http://127.0.0.1:4566

# Delete cluster
aws ecs delete-cluster \\
  --cluster my-cluster \\
  --endpoint-url http://127.0.0.1:4566

# Register task definition
aws ecs register-task-definition \\
  --family my-task \\
  --container-definitions '[{"name":"web","image":"nginx:latest","cpu":256,"memory":512,"essential":true}]' \\
  --endpoint-url http://127.0.0.1:4566

# List task definitions
aws ecs list-task-definitions --endpoint-url http://127.0.0.1:4566

# Run task
aws ecs run-task \\
  --cluster my-cluster \\
  --task-definition my-task:1 \\
  --count 1 \\
  --launch-type FARGATE \\
  --endpoint-url http://127.0.0.1:4566

# List tasks
aws ecs list-tasks \\
  --cluster my-cluster \\
  --endpoint-url http://127.0.0.1:4566

# Stop task
aws ecs stop-task \\
  --cluster my-cluster \\
  --task <task-id> \\
  --endpoint-url http://127.0.0.1:4566

# Create service
aws ecs create-service \\
  --cluster my-cluster \\
  --service-name my-svc \\
  --task-definition my-task:1 \\
  --desired-count 1 \\
  --launch-type FARGATE \\
  --endpoint-url http://127.0.0.1:4566

# List services
aws ecs list-services \\
  --cluster my-cluster \\
  --endpoint-url http://127.0.0.1:4566

# Delete service
aws ecs delete-service \\
  --cluster my-cluster \\
  --service my-svc \\
  --force \\
  --endpoint-url http://127.0.0.1:4566`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import {
  ECSClient,
  ListClustersCommand,
  CreateClusterCommand,
  RegisterTaskDefinitionCommand,
  RunTaskCommand,
  ListTasksCommand,
  CreateServiceCommand,
  ListServicesCommand,
} from "@aws-sdk/client-ecs";

const client = new ECSClient({
  region: '${props.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${props.accessKey}',
    secretAccessKey: '${props.secretKey}',
  },
});

// List clusters
const clusters = await client.send(new ListClustersCommand({}));
console.log(clusters.ClusterArns);

// Create cluster
await client.send(new CreateClusterCommand({ clusterName: "my-cluster" }));

// Register task definition
await client.send(new RegisterTaskDefinitionCommand({
  family: "my-task",
  containerDefinitions: [
    { name: "web", image: "nginx:latest", cpu: 256, memory: 512, essential: true },
  ],
}));

// Run task
await client.send(new RunTaskCommand({
  cluster: "my-cluster",
  taskDefinition: "my-task:1",
  count: 1,
  launchType: "FARGATE",
}));

// List tasks
const tasks = await client.send(new ListTasksCommand({ cluster: "my-cluster" }));
console.log(tasks.taskArns);

// Create service
await client.send(new CreateServiceCommand({
  cluster: "my-cluster",
  serviceName: "my-svc",
  taskDefinition: "my-task:1",
  desiredCount: 1,
  launchType: "FARGATE",
}));

// List services
const services = await client.send(new ListServicesCommand({ cluster: "my-cluster" }));
console.log(services.serviceArns);`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'ecs',
    region_name='${props.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${props.accessKey}',
    aws_secret_access_key='${props.secretKey}',
)

# List clusters
response = client.list_clusters()
print(response['clusterArns'])

# Create cluster
client.create_cluster(clusterName='my-cluster')

# Register task definition
client.register_task_definition(
    family='my-task',
    containerDefinitions=[
        {'name': 'web', 'image': 'nginx:latest', 'cpu': 256, 'memory': 512, 'essential': True},
    ],
)

# Run task
client.run_task(
    cluster='my-cluster',
    taskDefinition='my-task:1',
    count=1,
    launchType='FARGATE',
)

# List tasks
response = client.list_tasks(cluster='my-cluster')
print(response['taskArns'])

# Create service
client.create_service(
    cluster='my-cluster',
    serviceName='my-svc',
    taskDefinition='my-task:1',
    desiredCount=1,
    launchType='FARGATE',
)

# List services
response = client.list_services(cluster='my-cluster')
print(response['serviceArns'])`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/ecs"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${props.region}"),
    config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
        "${props.accessKey}",
        "${props.secretKey}",
        "",
    )),
)

client := ecs.NewFromConfig(cfg, func(o *ecs.Options) {
    o.BaseURL = aws.String("http://127.0.0.1:4566")
})

// List clusters
clusters, _ := client.ListClusters(context.Background(), &ecs.ListClustersInput{})
fmt.Println(clusters.ClusterArns)

// Create cluster
_, _ = client.CreateCluster(context.Background(), &ecs.CreateClusterInput{
    ClusterName: aws.String("my-cluster"),
})

// Register task definition
_, _ = client.RegisterTaskDefinition(context.Background(), &ecs.RegisterTaskDefinitionInput{
    Family: aws.String("my-task"),
    ContainerDefinitions: []types.ContainerDefinition{
        { Name: aws.String("web"), Image: aws.String("nginx:latest"), Cpu: aws.Int32(256), Memory: aws.Int32(512), Essential: aws.Bool(true) },
    },
})

// Run task
_, _ = client.RunTask(context.Background(), &ecs.RunTaskInput{
    Cluster:        aws.String("my-cluster"),
    TaskDefinition: aws.String("my-task:1"),
    Count:          aws.Int32(1),
    LaunchType:     types.LaunchTypeFargate,
})

// List tasks
tasks, _ := client.ListTasks(context.Background(), &ecs.ListTasksInput{
    Cluster: aws.String("my-cluster"),
})
fmt.Println(tasks.TaskArns)

// Create service
_, _ = client.CreateService(context.Background(), &ecs.CreateServiceInput{
    Cluster:        aws.String("my-cluster"),
    ServiceName:    aws.String("my-svc"),
    TaskDefinition: aws.String("my-task:1"),
    DesiredCount:   aws.Int32(1),
    LaunchType:     types.LaunchTypeFargate,
})

// List services
services, _ := client.ListServices(context.Background(), &ecs.ListServicesInput{
    Cluster: aws.String("my-cluster"),
})
fmt.Println(services.ServiceArns)`
  },
])
</script>

<template>
  <CodeSnippet
    title="Usage Examples"
    :snippets="codeExamples"
    default-tab="aws-cli"
    :disable-highlight="true"
  />
</template>