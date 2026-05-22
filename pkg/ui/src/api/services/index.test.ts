/**
 * Barrel export tests
 * Verifies all re-exports from index.ts are properly wired
 * @module api/services/index.test
 */

import { describe, it, expect } from 'vitest'

// --- S3 ---
import {
  S3Service,
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
} from './s3'

// --- Lambda ---
import {
  LambdaService,
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
  lambda,
} from './lambda'

// --- DynamoDB ---
import {
  DynamoDBService,
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
  listStreams,
  listAllStreams,
} from './dynamodb'

// --- SQS ---
import {
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

// --- SNS ---
import {
  listTopics,
  createTopic,
  deleteTopic,
  getTopicAttributes,
  subscribe,
  listSubscriptions,
  listSubscriptionsByTopic,
  unsubscribe,
  publish,
  confirmSubscription,
  getSubscriptionAttributes,
  setSubscriptionAttributes,
  listTagsForResource,
} from './sns'

// --- IAM ---
import {
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

// --- KMS ---
import {
  createKey,
  describeKey,
  listKeys,
  encrypt,
  decrypt,
  generateDataKey,
  sign,
  verify,
  enableKey,
  disableKey,
  scheduleKeyDeletion,
  deleteKey,
  cancelKeyDeletion,
  getKeyRotationStatus,
  enableKeyRotation,
  disableKeyRotation,
} from './kms'

// --- Secrets Manager ---
import {
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

// --- API Gateway ---
import {
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

// --- Kinesis ---
import {
  createStream,
  listStreams,
  describeStream,
  describeStreamSummary,
  deleteStream,
  putRecord,
  putRecords,
  getRecords,
  getShardIterator,
  listShards,
  splitShard,
  mergeShards,
  updateShardCount,
} from './kinesis'

// --- CloudFormation ---
import {
  CloudFormationService,
  cloudFormationService,
  listStacks,
  createStack,
  deleteStack,
  getStackDetails,
  getStackTemplate,
  listStackResources,
} from './cloudformation'

// --- SSM ---
import {
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

// --- Step Functions ---
import {
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

// --- OpenSearch ---
import {
  OpenSearchService,
  openSearchService,
  listDomainNames,
  describeDomain,
  createDomain,
  deleteDomain,
} from './opensearch'

// --- MSK ---
import {
  listClustersV2,
  describeClusterV2,
  createClusterV2,
  deleteCluster,
  getBootstrapBrokers,
} from './msk'

// --- Shared re-exports ---
import { APIError } from '../client'

interface ReExportEntry {
  name: string
  value: unknown
  module: string
}

describe('Barrel exports (index.ts)', () => {
  // Collect all re-exports into a single list for verification
  const reExports: ReExportEntry[] = [
    // S3
    { name: 'S3Service', value: S3Service, module: 's3' },
    { name: 's3Service', value: s3Service, module: 's3' },
    { name: 'listBuckets', value: listBuckets, module: 's3' },
    { name: 'createBucket', value: createBucket, module: 's3' },
    { name: 'deleteBucket', value: deleteBucket, module: 's3' },
    { name: 'emptyBucket', value: emptyBucket, module: 's3' },
    { name: 'headBucket', value: headBucket, module: 's3' },
    { name: 'listObjects', value: listObjects, module: 's3' },
    { name: 'listObjectsV2', value: listObjectsV2, module: 's3' },
    { name: 'putObject', value: putObject, module: 's3' },
    { name: 'getObject', value: getObject, module: 's3' },
    { name: 'headObject', value: headObject, module: 's3' },
    { name: 'deleteObject', value: deleteObject, module: 's3' },

    // Lambda
    { name: 'LambdaService', value: LambdaService, module: 'lambda' },
    { name: 'lambdaService', value: lambdaService, module: 'lambda' },
    { name: 'listFunctions', value: listFunctions, module: 'lambda' },
    { name: 'createFunction', value: createFunction, module: 'lambda' },
    { name: 'getFunction', value: getFunction, module: 'lambda' },
    { name: 'getFunctionConfiguration', value: getFunctionConfiguration, module: 'lambda' },
    { name: 'deleteFunction', value: deleteFunction, module: 'lambda' },
    { name: 'updateFunctionCode', value: updateFunctionCode, module: 'lambda' },
    { name: 'invoke', value: invoke, module: 'lambda' },
    { name: 'invokeFunction', value: invokeFunction, module: 'lambda' },
    { name: 'updateFunctionConfiguration', value: updateFunctionConfiguration, module: 'lambda' },
    { name: 'lambda', value: lambda, module: 'lambda' },

    // DynamoDB
    { name: 'DynamoDBService', value: DynamoDBService, module: 'dynamodb' },
    { name: 'dynamodbService', value: dynamodbService, module: 'dynamodb' },
    { name: 'createTable', value: createTable, module: 'dynamodb' },
    { name: 'deleteTable', value: deleteTable, module: 'dynamodb' },
    { name: 'describeTable', value: describeTable, module: 'dynamodb' },
    { name: 'listTables', value: listTables, module: 'dynamodb' },
    { name: 'updateTable', value: updateTable, module: 'dynamodb' },
    { name: 'putItem', value: putItem, module: 'dynamodb' },
    { name: 'getItem', value: getItem, module: 'dynamodb' },
    { name: 'deleteItem', value: deleteItem, module: 'dynamodb' },
    { name: 'updateItem', value: updateItem, module: 'dynamodb' },
    { name: 'query', value: query, module: 'dynamodb' },
    { name: 'scan', value: scan, module: 'dynamodb' },
    { name: 'batchWriteItem', value: batchWriteItem, module: 'dynamodb' },
    { name: 'batchGetItem', value: batchGetItem, module: 'dynamodb' },
    { name: 'listStreams', value: listStreams, module: 'dynamodb' },
    { name: 'listAllStreams', value: listAllStreams, module: 'dynamodb' },

    // SQS
    { name: 'listQueues', value: listQueues, module: 'sqs' },
    { name: 'getQueueUrl', value: getQueueUrl, module: 'sqs' },
    { name: 'getQueueAttributes', value: getQueueAttributes, module: 'sqs' },
    { name: 'createQueue', value: createQueue, module: 'sqs' },
    { name: 'deleteQueue', value: deleteQueue, module: 'sqs' },
    { name: 'sendMessage', value: sendMessage, module: 'sqs' },
    { name: 'deleteMessage', value: deleteMessage, module: 'sqs' },
    { name: 'purgeQueue', value: purgeQueue, module: 'sqs' },
    { name: 'setQueueAttributes', value: setQueueAttributes, module: 'sqs' },

    // SNS
    { name: 'listTopics', value: listTopics, module: 'sns' },
    { name: 'createTopic', value: createTopic, module: 'sns' },
    { name: 'deleteTopic', value: deleteTopic, module: 'sns' },
    { name: 'getTopicAttributes', value: getTopicAttributes, module: 'sns' },
    { name: 'subscribe', value: subscribe, module: 'sns' },
    { name: 'listSubscriptions', value: listSubscriptions, module: 'sns' },
    { name: 'listSubscriptionsByTopic', value: listSubscriptionsByTopic, module: 'sns' },
    { name: 'unsubscribe', value: unsubscribe, module: 'sns' },
    { name: 'publish', value: publish, module: 'sns' },
    { name: 'confirmSubscription', value: confirmSubscription, module: 'sns' },
    { name: 'getSubscriptionAttributes', value: getSubscriptionAttributes, module: 'sns' },
    { name: 'setSubscriptionAttributes', value: setSubscriptionAttributes, module: 'sns' },
    { name: 'listTagsForResource', value: listTagsForResource, module: 'sns' },

    // IAM
    { name: 'createUser', value: createUser, module: 'iam' },
    { name: 'getUser', value: getUser, module: 'iam' },
    { name: 'listUsers', value: listUsers, module: 'iam' },
    { name: 'deleteUser', value: deleteUser, module: 'iam' },
    { name: 'createRole', value: createRole, module: 'iam' },
    { name: 'getRole', value: getRole, module: 'iam' },
    { name: 'listRoles', value: listRoles, module: 'iam' },
    { name: 'deleteRole', value: deleteRole, module: 'iam' },
    { name: 'listPolicies', value: listPolicies, module: 'iam' },
    { name: 'getPolicy', value: getPolicy, module: 'iam' },
    { name: 'createAccessKey', value: createAccessKey, module: 'iam' },
    { name: 'listAccessKeys', value: listAccessKeys, module: 'iam' },
    { name: 'attachRolePolicy', value: attachRolePolicy, module: 'iam' },
    { name: 'detachRolePolicy', value: detachRolePolicy, module: 'iam' },
    { name: 'listAttachedRolePolicies', value: listAttachedRolePolicies, module: 'iam' },

    // KMS
    { name: 'createKey', value: createKey, module: 'kms' },
    { name: 'describeKey', value: describeKey, module: 'kms' },
    { name: 'listKeys', value: listKeys, module: 'kms' },
    { name: 'encrypt', value: encrypt, module: 'kms' },
    { name: 'decrypt', value: decrypt, module: 'kms' },
    { name: 'generateDataKey', value: generateDataKey, module: 'kms' },
    { name: 'sign', value: sign, module: 'kms' },
    { name: 'verify', value: verify, module: 'kms' },
    { name: 'enableKey', value: enableKey, module: 'kms' },
    { name: 'disableKey', value: disableKey, module: 'kms' },
    { name: 'scheduleKeyDeletion', value: scheduleKeyDeletion, module: 'kms' },
    { name: 'deleteKey', value: deleteKey, module: 'kms' },
    { name: 'cancelKeyDeletion', value: cancelKeyDeletion, module: 'kms' },
    { name: 'getKeyRotationStatus', value: getKeyRotationStatus, module: 'kms' },
    { name: 'enableKeyRotation', value: enableKeyRotation, module: 'kms' },
    { name: 'disableKeyRotation', value: disableKeyRotation, module: 'kms' },

    // Secrets Manager
    { name: 'createSecret', value: createSecret, module: 'secrets-manager' },
    { name: 'getSecretValue', value: getSecretValue, module: 'secrets-manager' },
    { name: 'listSecrets', value: listSecrets, module: 'secrets-manager' },
    { name: 'putSecretValue', value: putSecretValue, module: 'secrets-manager' },
    { name: 'deleteSecret', value: deleteSecret, module: 'secrets-manager' },
    { name: 'updateSecret', value: updateSecret, module: 'secrets-manager' },
    { name: 'describeSecret', value: describeSecret, module: 'secrets-manager' },
    { name: 'rotateSecret', value: rotateSecret, module: 'secrets-manager' },
    { name: 'getRandomPassword', value: getRandomPassword, module: 'secrets-manager' },
    { name: 'restoreSecret', value: restoreSecret, module: 'secrets-manager' },

    // API Gateway
    { name: 'createRestApi', value: createRestApi, module: 'api-gateway' },
    { name: 'getRestApis', value: getRestApis, module: 'api-gateway' },
    { name: 'getRestApi', value: getRestApi, module: 'api-gateway' },
    { name: 'updateRestApi', value: updateRestApi, module: 'api-gateway' },
    { name: 'deleteRestApi', value: deleteRestApi, module: 'api-gateway' },
    { name: 'createResource', value: createResource, module: 'api-gateway' },
    { name: 'getResources', value: getResources, module: 'api-gateway' },
    { name: 'deleteResource', value: deleteResource, module: 'api-gateway' },
    { name: 'getMethod', value: getMethod, module: 'api-gateway' },
    { name: 'deleteMethod', value: deleteMethod, module: 'api-gateway' },
    { name: 'createDeployment', value: createDeployment, module: 'api-gateway' },
    { name: 'createStage', value: createStage, module: 'api-gateway' },
    { name: 'getStages', value: getStages, module: 'api-gateway' },
    { name: 'createHttpApi', value: createHttpApi, module: 'api-gateway' },
    { name: 'getHttpApis', value: getHttpApis, module: 'api-gateway' },
    { name: 'getHttpApi', value: getHttpApi, module: 'api-gateway' },
    { name: 'deleteHttpApi', value: deleteHttpApi, module: 'api-gateway' },
    { name: 'createHttpRoute', value: createHttpRoute, module: 'api-gateway' },
    { name: 'getHttpRoutes', value: getHttpRoutes, module: 'api-gateway' },
    { name: 'deleteHttpRoute', value: deleteHttpRoute, module: 'api-gateway' },
    { name: 'createHttpIntegration', value: createHttpIntegration, module: 'api-gateway' },
    { name: 'getHttpIntegrations', value: getHttpIntegrations, module: 'api-gateway' },
    { name: 'deleteHttpApiIntegration', value: deleteHttpApiIntegration, module: 'api-gateway' },

    // Kinesis
    { name: 'createStream', value: createStream, module: 'kinesis' },
    { name: 'listStreams', value: listStreams, module: 'kinesis' },
    { name: 'describeStream', value: describeStream, module: 'kinesis' },
    { name: 'describeStreamSummary', value: describeStreamSummary, module: 'kinesis' },
    { name: 'deleteStream', value: deleteStream, module: 'kinesis' },
    { name: 'putRecord', value: putRecord, module: 'kinesis' },
    { name: 'putRecords', value: putRecords, module: 'kinesis' },
    { name: 'getRecords', value: getRecords, module: 'kinesis' },
    { name: 'getShardIterator', value: getShardIterator, module: 'kinesis' },
    { name: 'listShards', value: listShards, module: 'kinesis' },
    { name: 'splitShard', value: splitShard, module: 'kinesis' },
    { name: 'mergeShards', value: mergeShards, module: 'kinesis' },
    { name: 'updateShardCount', value: updateShardCount, module: 'kinesis' },

    // CloudFormation
    { name: 'CloudFormationService', value: CloudFormationService, module: 'cloudformation' },
    { name: 'cloudFormationService', value: cloudFormationService, module: 'cloudformation' },
    { name: 'listStacks', value: listStacks, module: 'cloudformation' },
    { name: 'createStack', value: createStack, module: 'cloudformation' },
    { name: 'deleteStack', value: deleteStack, module: 'cloudformation' },
    { name: 'getStackDetails', value: getStackDetails, module: 'cloudformation' },
    { name: 'getStackTemplate', value: getStackTemplate, module: 'cloudformation' },
    { name: 'listStackResources', value: listStackResources, module: 'cloudformation' },

    // SSM
    { name: 'putParameter', value: putParameter, module: 'ssm' },
    { name: 'getParameter', value: getParameter, module: 'ssm' },
    { name: 'getParameters', value: getParameters, module: 'ssm' },
    { name: 'getParametersByPath', value: getParametersByPath, module: 'ssm' },
    { name: 'deleteParameter', value: deleteParameter, module: 'ssm' },
    { name: 'describeParameters', value: describeParameters, module: 'ssm' },
    { name: 'getParameterHistory', value: getParameterHistory, module: 'ssm' },
    { name: 'addTagsToResource', value: addTagsToResource, module: 'ssm' },
    { name: 'removeTagsFromResource', value: removeTagsFromResource, module: 'ssm' },

    // Step Functions
    { name: 'listStateMachines', value: listStateMachines, module: 'stepfunctions' },
    { name: 'createStateMachine', value: createStateMachine, module: 'stepfunctions' },
    { name: 'describeStateMachine', value: describeStateMachine, module: 'stepfunctions' },
    { name: 'updateStateMachine', value: updateStateMachine, module: 'stepfunctions' },
    { name: 'deleteStateMachine', value: deleteStateMachine, module: 'stepfunctions' },
    { name: 'startExecution', value: startExecution, module: 'stepfunctions' },
    { name: 'listExecutions', value: listExecutions, module: 'stepfunctions' },
    { name: 'stopExecution', value: stopExecution, module: 'stepfunctions' },
    { name: 'describeExecution', value: describeExecution, module: 'stepfunctions' },
    { name: 'getExecutionHistory', value: getExecutionHistory, module: 'stepfunctions' },

    // OpenSearch
    { name: 'OpenSearchService', value: OpenSearchService, module: 'opensearch' },
    { name: 'openSearchService', value: openSearchService, module: 'opensearch' },
    { name: 'listDomainNames', value: listDomainNames, module: 'opensearch' },
    { name: 'describeDomain', value: describeDomain, module: 'opensearch' },
    { name: 'createDomain', value: createDomain, module: 'opensearch' },
    { name: 'deleteDomain', value: deleteDomain, module: 'opensearch' },

    // MSK
    { name: 'listClustersV2', value: listClustersV2, module: 'msk' },
    { name: 'describeClusterV2', value: describeClusterV2, module: 'msk' },
    { name: 'createClusterV2', value: createClusterV2, module: 'msk' },
    { name: 'deleteCluster', value: deleteCluster, module: 'msk' },
    { name: 'getBootstrapBrokers', value: getBootstrapBrokers, module: 'msk' },
  ]

  // Group tests by module
  const moduleGroups = reExports.reduce<Record<string, ReExportEntry[]>>((acc, entry) => {
    if (!acc[entry.module]) acc[entry.module] = []
    acc[entry.module].push(entry)
    return acc
  }, {})

  for (const [module, exports] of Object.entries(moduleGroups)) {
    describe(`${module}`, () => {
      for (const { name, value } of exports) {
        it(`exports ${name}`, () => {
          expect(value).toBeDefined()
        })
      }
    })
  }

  describe('shared re-exports', () => {
    it('re-exports APIError class', () => {
      expect(APIError).toBeDefined()
      expect(typeof APIError).toBe('function')
    })


  })
})
