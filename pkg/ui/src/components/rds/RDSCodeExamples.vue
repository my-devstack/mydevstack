<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps<{
  region: string
  accessKey: string
  secretKey: string
}>()

const settingsStore = useSettingsStore()
const selectedExample = ref(0)

const codeExamples = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# Create RDS instance
aws rds create-db-instance \\
  --db-instance-identifier my-mysql-db \\
  --db-instance-class db.t3.micro \\
  --engine mysql \\
  --engine-version 8.0.36 \\
  --master-username admin \\
  --master-user-password secret123 \\
  --allocated-storage 20 \\
  --endpoint-url http://localhost:8081

# List RDS instances
aws rds describe-db-instances \\
  --endpoint-url http://localhost:8081

# Reboot instance
aws rds reboot-db-instance \\
  --db-instance-identifier my-mysql-db \\
  --endpoint-url http://localhost:8081

# Delete instance
aws rds delete-db-instance \\
  --db-instance-identifier my-mysql-db \\
  --skip-final-snapshot \\
  --endpoint-url http://localhost:8081`
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import { RDSClient, CreateDBInstanceCommand, DescribeDBInstancesCommand, RebootDBInstanceCommand, DeleteDBInstanceCommand } from "@aws-sdk/client-rds";

const client = new RDSClient({
  region: '${props.region}',
  endpoint: 'http://localhost:8081',
  credentials: {
    accessKeyId: '${props.accessKey}',
    secretAccessKey: '${props.secretKey}',
  },
});

// Create instance
await client.send(new CreateDBInstanceCommand({
  DBInstanceIdentifier: 'my-mysql-db',
  DBInstanceClass: 'db.t3.micro',
  Engine: 'mysql',
  EngineVersion: '8.0.36',
  MasterUsername: 'admin',
  MasterUserPassword: 'secret123',
  AllocatedStorage: 20,
}));

// List instances
const listResponse = await client.send(new DescribeDBInstancesCommand({}));
console.log(listResponse.DBInstances);

// Reboot instance
await client.send(new RebootDBInstanceCommand({
  DBInstanceIdentifier: 'my-mysql-db',
}));

// Delete instance
await client.send(new DeleteDBInstanceCommand({
  DBInstanceIdentifier: 'my-mysql-db',
  SkipFinalSnapshot: true,
}));`
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    'rds',
    region_name='${props.region}',
    endpoint_url='http://localhost:8081',
    aws_access_key_id='${props.accessKey}',
    aws_secret_access_key='${props.secretKey}',
)

# Create instance
client.create_db_instance(
    DBInstanceIdentifier='my-mysql-db',
    DBInstanceClass='db.t3.micro',
    Engine='mysql',
    EngineVersion='8.0.36',
    MasterUsername='admin',
    MasterUserPassword='secret123',
    AllocatedStorage=20,
)

# List instances
response = client.describe_db_instances()
for instance in response['DBInstances']:
    print(instance['DBInstanceIdentifier'])

# Reboot instance
client.reboot_db_instance(
    DBInstanceIdentifier='my-mysql-db',
)

# Delete instance
client.delete_db_instance(
    DBInstanceIdentifier='my-mysql-db',
    SkipFinalSnapshot=True,
)`
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
package main

import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/rds"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go/aws"
)

func main() {
    cfg, _ := config.LoadDefaultConfig(context.Background(),
        config.WithRegion("${props.region}"),
        config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
            "${props.accessKey}",
            "${props.secretKey}",
            "",
        )),
    )

    client := rds.NewFromConfig(cfg, func(o *rds.Options) {
        o.BaseURL = aws.String("http://localhost:8081")
    })

    // Create instance
    client.CreateDBInstance(context.Background(), &rds.CreateDBInstanceInput{
        DBInstanceIdentifier: aws.String("my-mysql-db"),
        DBInstanceClass:      aws.String("db.t3.micro"),
        Engine:               aws.String("mysql"),
        EngineVersion:        aws.String("8.0.36"),
        MasterUsername:       aws.String("admin"),
        MasterUserPassword:   aws.String("secret123"),
        AllocatedStorage:     aws.Int32(20),
    })

    // List instances
    listOutput, _ := client.DescribeDBInstances(context.Background(), &rds.DescribeDBInstancesInput{})
    for _, instance := range listOutput.DBInstances {
        fmt.Println(*instance.DBInstanceIdentifier)
    }

    // Reboot instance
    client.RebootDBInstance(context.Background(), &rds.RebootDBInstanceInput{
        DBInstanceIdentifier: aws.String("my-mysql-db"),
    })

    // Delete instance
    client.DeleteDBInstance(context.Background(), &rds.DeleteDBInstanceInput{
        DBInstanceIdentifier: aws.String("my-mysql-db"),
        SkipFinalSnapshot:    aws.Bool(true),
    })
}`
  },
])
</script>

<template>
  <div class="mt-8">
    <h2
      class="text-lg font-semibold mb-4"
      :class="settingsStore.darkMode ? 'text-white' : 'text-gray-900'"
    >
      Usage Examples
    </h2>
    <div
      class="rounded-lg border overflow-hidden"
      :class="settingsStore.darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'"
    >
      <div
        class="flex border-b"
        :class="settingsStore.darkMode ? 'border-gray-700' : 'border-gray-200'"
      >
        <button
          v-for="(example, index) in codeExamples"
          :key="example.language"
          class="px-4 py-2 text-sm font-medium transition-colors"
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
        >{{ codeExamples[selectedExample].code }}</pre>
      </div>
    </div>
  </div>
</template>
