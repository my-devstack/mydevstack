import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: 'Dashboard', icon: 'home' },
  },
  // S3
  {
    path: '/services/s3',
    name: 'S3',
    component: () => import('@/views/services/S3.vue'),
    meta: { title: 'S3', service: 's3' },
  },
  // Lambda
  {
    path: '/services/lambda',
    name: 'Lambda',
    component: () => import('@/views/services/Lambda.vue'),
    meta: { title: 'Lambda', service: 'lambda' },
  },
  // Lambda Event Source Mapping
  {
    path: '/services/lambda-event-source-mapping',
    name: 'LambdaEventSourceMapping',
    component: () => import('@/views/services/LambdaEventSourceMapping.vue'),
    meta: { title: 'Lambda Event Source Mapping', service: 'lambda' },
  },
  // DynamoDB
  {
    path: '/services/dynamodb',
    name: 'DynamoDB',
    component: () => import('@/views/services/DynamoDB.vue'),
    meta: { title: 'DynamoDB', service: 'dynamodb' },
  },
  // SQS
  {
    path: '/services/sqs',
    name: 'SQS',
    component: () => import('@/views/services/SQS.vue'),
    meta: { title: 'SQS', service: 'sqs' },
  },
  // SNS
  {
    path: '/services/sns',
    name: 'SNS',
    component: () => import('@/views/services/SNS.vue'),
    meta: { title: 'SNS', service: 'sns' },
  },
  // IAM
  {
    path: '/services/iam',
    name: 'IAM',
    component: () => import('@/views/services/IAM.vue'),
    meta: { title: 'IAM', service: 'iam' },
  },
  // KMS
  {
    path: '/services/kms',
    name: 'KMS',
    component: () => import('@/views/services/KMS.vue'),
    meta: { title: 'KMS', service: 'kms' },
  },
  // Secrets Manager
  {
    path: '/services/secrets-manager',
    name: 'SecretsManager',
    component: () => import('@/views/services/SecretsManager.vue'),
    meta: { title: 'Secrets Manager', service: 'secretsmanager' },
  },
  // API Gateway
  {
    path: '/services/api-gateway',
    name: 'APIGateway',
    component: () => import('@/views/services/APIGateway.vue'),
    meta: { title: 'API Gateway', service: 'apigateway' },
  },
  // Kinesis
  {
    path: '/services/kinesis',
    name: 'Kinesis',
    component: () => import('@/views/services/Kinesis.vue'),
    meta: { title: 'Kinesis', service: 'kinesis' },
  },
  // CloudFormation
  {
    path: '/services/cloudformation',
    name: 'CloudFormation',
    component: () => import('@/views/services/CloudFormation.vue'),
    meta: { title: 'CloudFormation', service: 'cloudformation' },
  },
  // SSM
  {
    path: '/services/ssm',
    name: 'SSM',
    component: () => import('@/views/services/SSM.vue'),
    meta: { title: 'SSM Parameter Store', service: 'ssm' },
  },
  // ElastiCache
  {
    path: '/services/elasticache',
    name: 'ElastiCache',
    component: () => import('@/views/services/ElastiCache.vue'),
    meta: { title: 'ElastiCache', service: 'elasticache' },
  },
  // EC2
  {
    path: '/services/ec2',
    name: 'EC2',
    component: () => import('@/views/services/EC2.vue'),
    meta: { title: 'EC2', service: 'ec2' },
  },
  // RDS
  {
    path: '/services/rds',
    name: 'RDS',
    component: () => import('@/views/services/RDS.vue'),
    meta: { title: 'RDS', service: 'rds' },
  },
  // Step Functions
  {
    path: '/services/step-functions',
    name: 'StepFunctions',
    component: () => import('@/views/services/StepFunctions.vue'),
    meta: { title: 'Step Functions', service: 'stepfunctions' },
  },
  // OpenSearch
  {
    path: '/services/opensearch',
    name: 'OpenSearch',
    component: () => import('@/views/services/OpenSearch.vue'),
    meta: { title: 'OpenSearch', service: 'opensearch' },
  },
  // SES
  {
    path: '/services/ses',
    name: 'SES',
    component: () => import('@/views/services/SES.vue'),
    meta: { title: 'SES', service: 'ses' },
  },
  // CloudWatch
  {
    path: '/services/cloudwatch',
    name: 'CloudWatch',
    component: () => import('@/views/services/CloudWatch.vue'),
    meta: { title: 'CloudWatch', service: 'cloudwatch' },
  },
  // MSK
  {
    path: '/services/msk',
    name: 'MSK',
    component: () => import('@/views/services/MSK.vue'),
    meta: { title: 'MSK', service: 'msk' },
  },
  
  // Explicit redirect for /services to dashboard
  {
    path: '/services',
    redirect: '/',
  },
  // Catch-all - redirect to dashboard
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  // Use hash-based history to avoid conflicts with S3 proxy
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

// Update document title on navigation
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} - MyDevStack` : 'MyDevStack'
  next()
})

export default router
