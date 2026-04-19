// Service definitions and helpers
import type { Service } from '@/types/services'

// All AWS services defined
export const SERVICES: Service[] = [
  // Compute
  { id: 'lambda', name: 'Lambda', category: 'compute', icon: 'CloudIcon', route: '/services/lambda' },
  
  // Storage
  { id: 's3', name: 'S3', category: 'storage', icon: 'ArchiveBoxIcon', route: '/services/s3' },
  { id: 'elasticache', name: 'ElastiCache', category: 'storage', icon: 'CircleStackIcon', route: '/services/elasticache' },
  { id: 'rds', name: 'RDS', category: 'storage', icon: 'ServerIcon', route: '/services/rds' },
  
  // Database
  { id: 'dynamodb', name: 'DynamoDB', category: 'database', icon: 'TableCellsIcon', route: '/services/dynamodb' },
  { id: 'dynamodb-streams', name: 'DynamoDB Streams', category: 'database', icon: 'PlayIcon', route: '/services/dynamodb-streams' },
  
  // Messaging
  { id: 'sqs', name: 'SQS', category: 'messaging', icon: 'QueueListIcon', route: '/services/sqs' },
  { id: 'sns', name: 'SNS', category: 'messaging', icon: 'MegaphoneIcon', route: '/services/sns' },
  { id: 'eventbridge', name: 'EventBridge', category: 'messaging', icon: 'BoltIcon', route: '/services/eventbridge' },
  
  // Security
  // { id: 'iam', name: 'IAM', category: 'security', icon: 'UserGroupIcon', route: '/services/iam' },
  { id: 'kms', name: 'KMS', category: 'security', icon: 'KeyIcon', route: '/services/kms' },
  { id: 'secrets-manager', name: 'Secrets Manager', category: 'security', icon: 'ShieldCheckIcon', route: '/services/secrets-manager' },
  { id: 'cognito', name: 'Cognito', category: 'security', icon: 'IdentificationIcon', route: '/services/cognito' },
  
  // Networking
  { id: 'api-gateway', name: 'API Gateway', category: 'networking', icon: 'GlobeAltIcon', route: '/services/api-gateway' },
  
  // Analytics
  { id: 'kinesis', name: 'Kinesis', category: 'analytics', icon: 'WaveformIcon', route: '/services/kinesis' },
  
  // Orchestration
  { id: 'step-functions', name: 'Step Functions', category: 'orchestration', icon: 'ArrowsRightLeftIcon', route: '/services/step-functions' },
  // { id: 'cloudformation', name: 'CloudFormation', category: 'orchestration', icon: 'CloudIcon', route: '/services/cloudformation' },
  
  // Monitoring
  { id: 'cloudwatch', name: 'CloudWatch', category: 'monitoring', icon: 'ChartBarIcon', route: '/services/cloudwatch' },
  
  // Parameters
  { id: 'ssm', name: 'SSM Parameter Store', category: 'parameters', icon: 'Cog6ToothIcon', route: '/services/ssm' }
]

// Get service by ID
export function getServiceById(id: string): Service | undefined {
  return SERVICES.find(s => s.id === id)
}

// Search services
export function searchServices(query: string): Service[] {
  const lowerQuery = query.toLowerCase()
  return SERVICES.filter(
    s => s.name.toLowerCase().includes(lowerQuery) ||
         s.id.toLowerCase().includes(lowerQuery)
  )
}
