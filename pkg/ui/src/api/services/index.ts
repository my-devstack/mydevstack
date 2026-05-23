/**
 * API Services - Barrel Export
 * Re-exports all AWS service API clients for convenient imports
 * @module api/services
 */

// S3 Service (class-based)
export {
  s3Service,
  listBuckets,
  createBucket,
  deleteBucket,
  emptyBucket,
  headBucket,
  listObjects,
  listObjectsV2,
  putObject,
  getObject,
  headObject,
  deleteObject,
  S3Service,
} from './s3'

// Lambda Service (class-based)
export {
  lambdaService,
  listFunctions,
  createFunction,
  getFunction,
  getFunctionConfiguration,
  deleteFunction,
  updateFunctionCode,
  invoke,
  invokeFunction,
  updateFunctionConfiguration,
  LambdaService,
  lambda,
} from './lambda'

// DynamoDB Service (class-based)
export {
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
  batchWriteItem,
  batchGetItem,
  DynamoDBService,
  listStreams,
  listAllStreams,
} from './dynamodb'

// SQS Service (functional)
export {
  listQueues,
  getQueueUrl,
  getQueueAttributes,
  createQueue,
  deleteQueue,
  sendMessage,
  deleteMessage,
  purgeQueue,
  setQueueAttributes,
} from './sqs'

// SNS Service (functional)
export {
  listTopics,
  createTopic,
  deleteTopic,
  subscribe,
  listSubscriptionsByTopic,
  publish,
} from './sns'

// IAM Service
export {
  createUser,
  getUser,
  listUsers,
  deleteUser,
  createRole,
  getRole,
  listRoles,
  deleteRole,
  listPolicies,
  getPolicy,
  createAccessKey,
  listAccessKeys,
  attachRolePolicy,
  detachRolePolicy,
  listAttachedRolePolicies,
} from './iam'

// KMS Service
export {
  createKey,
  describeKey,
  listKeys,
  encrypt,
  decrypt,
  enableKey,
  disableKey,
  scheduleKeyDeletion,
  deleteKey,
} from './kms'

// Secrets Manager Service
export {
  createSecret,
  getSecretValue,
  listSecrets,
  putSecretValue,
  deleteSecret,
  updateSecret,
  describeSecret,
  rotateSecret,
  getRandomPassword,
  restoreSecret,
} from './secrets-manager'

// API Gateway Service
export {
  createRestApi,
  getRestApis,
  getRestApi,
  updateRestApi,
  deleteRestApi,
  createResource,
  getResources,
  deleteResource,
  getMethod,
  deleteMethod,
  createDeployment,
  createStage,
  getStages,
  createHttpApi,
  getHttpApis,
  getHttpApi,
  deleteHttpApi,
  createHttpRoute,
  getHttpRoutes,
  deleteHttpRoute,
  createHttpIntegration,
  getHttpIntegrations,
  deleteHttpApiIntegration,
} from './api-gateway'

// Kinesis Service
export {
  createStream,
  listStreams as listKinesisStreams,
  describeStream,
  deleteStream,
  putRecord,
  getRecords,
  getShardIterator,
} from './kinesis'

// CloudFormation Service
export {
  cloudFormationService,
  listStacks,
  createStack,
  deleteStack,
  getStackDetails,
  getStackTemplate,
  listStackResources,
} from './cloudformation'

// SSM Parameter Store Service
export {
  putParameter,
  getParameter,
  getParameters,
  getParametersByPath,
  deleteParameter,
  describeParameters,
  getParameterHistory,
  addTagsToResource,
  removeTagsFromResource,
} from './ssm'

// Step Functions Service (functional, REST-style)
export {
  listStateMachines,
  createStateMachine,
  describeStateMachine,
  updateStateMachine,
  deleteStateMachine,
  startExecution,
  listExecutions,
  stopExecution,
  describeExecution,
  getExecutionHistory,
} from './stepfunctions'

// OpenSearch Service
export {
  openSearchService,
  listDomainNames,
  describeDomain,
  createDomain,
  deleteDomain,
  OpenSearchService,
} from './opensearch'

// MSK Service
export {
  listClustersV2,
  describeClusterV2,
  createClusterV2,
  deleteCluster,
  getBootstrapBrokers,
} from './msk'

// CloudWatch Service
export {
  CloudWatchService,
  cloudWatchService,
  describeAlarms,
  putMetricAlarm,
  deleteAlarms,
  setAlarmState,
  describeAlarmHistory,
  listMetrics,
  getMetricData,
  getMetricStatistics,
  putMetricData,
} from './cloudwatch'

// CloudWatch Logs Service
export {
  CloudWatchLogsService,
  cloudWatchLogsService,
  describeLogGroups,
  createLogGroup,
  deleteLogGroup,
  describeLogStreams,
  createLogStream,
  putLogEvents,
  getLogEvents,
  putRetentionPolicy,
} from './cloudwatch-logs'

// ElastiCache Service
export {
  ElastiCacheService,
  elasticacheService,
  describeReplicationGroups,
  createReplicationGroup,
  deleteReplicationGroup,
} from './elasticache'
export type {
  ReplicationGroup,
  CreateReplicationGroupInput,
} from './elasticache'

// RDS Service
export {
  RDSService,
  rdsService,
  describeDBInstances,
  createDBInstance,
  deleteDBInstance,
  describeDBEngineVersions,
  modifyDBInstance,
  rebootDBInstance,
  describeDBParameterGroups,
  describeDBParameters,
  describeDBSubnetGroups,
} from './rds'

// SES Service
export {
  SESService,
  sesService,
  listEmailIdentities,
  getEmailIdentity,
  createEmailIdentity,
  deleteEmailIdentity,
  sendEmail,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendEmailWithTemplate,
} from './ses'

// Region Service
export {
  setRegion,
  getRegion,
} from './region'
export type {
  SetRegionResponse,
} from './region'

// Re-export APIError for convenience
export { APIError } from '../client'


