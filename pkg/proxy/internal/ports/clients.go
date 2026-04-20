package ports

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/elasticache"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

// APIGatewayClientPort defines the interface for the AWS API Gateway client
type APIGatewayClientPort interface {
	GetRestApis(ctx context.Context, input *apigateway.GetRestApisInput, opts ...func(*apigateway.Options)) (*apigateway.GetRestApisOutput, error)
	CreateRestApi(ctx context.Context, input *apigateway.CreateRestApiInput, opts ...func(*apigateway.Options)) (*apigateway.CreateRestApiOutput, error)
	ImportRestApi(ctx context.Context, input *apigateway.ImportRestApiInput, opts ...func(*apigateway.Options)) (*apigateway.ImportRestApiOutput, error)
	DeleteRestApi(ctx context.Context, input *apigateway.DeleteRestApiInput, opts ...func(*apigateway.Options)) (*apigateway.DeleteRestApiOutput, error)
	GetRestApi(ctx context.Context, input *apigateway.GetRestApiInput, opts ...func(*apigateway.Options)) (*apigateway.GetRestApiOutput, error)
	UpdateRestApi(ctx context.Context, input *apigateway.UpdateRestApiInput, opts ...func(*apigateway.Options)) (*apigateway.UpdateRestApiOutput, error)
	GetResources(ctx context.Context, input *apigateway.GetResourcesInput, opts ...func(*apigateway.Options)) (*apigateway.GetResourcesOutput, error)
	GetResource(ctx context.Context, input *apigateway.GetResourceInput, opts ...func(*apigateway.Options)) (*apigateway.GetResourceOutput, error)
	CreateResource(ctx context.Context, input *apigateway.CreateResourceInput, opts ...func(*apigateway.Options)) (*apigateway.CreateResourceOutput, error)
	DeleteResource(ctx context.Context, input *apigateway.DeleteResourceInput, opts ...func(*apigateway.Options)) (*apigateway.DeleteResourceOutput, error)
	PutMethod(ctx context.Context, input *apigateway.PutMethodInput, opts ...func(*apigateway.Options)) (*apigateway.PutMethodOutput, error)
	GetMethod(ctx context.Context, input *apigateway.GetMethodInput, opts ...func(*apigateway.Options)) (*apigateway.GetMethodOutput, error)
	DeleteMethod(ctx context.Context, input *apigateway.DeleteMethodInput, opts ...func(*apigateway.Options)) (*apigateway.DeleteMethodOutput, error)
	PutIntegration(ctx context.Context, input *apigateway.PutIntegrationInput, opts ...func(*apigateway.Options)) (*apigateway.PutIntegrationOutput, error)
	GetIntegration(ctx context.Context, input *apigateway.GetIntegrationInput, opts ...func(*apigateway.Options)) (*apigateway.GetIntegrationOutput, error)
	DeleteIntegration(ctx context.Context, input *apigateway.DeleteIntegrationInput, opts ...func(*apigateway.Options)) (*apigateway.DeleteIntegrationOutput, error)
	CreateDeployment(ctx context.Context, input *apigateway.CreateDeploymentInput, opts ...func(*apigateway.Options)) (*apigateway.CreateDeploymentOutput, error)
	DeleteDeployment(ctx context.Context, input *apigateway.DeleteDeploymentInput, opts ...func(*apigateway.Options)) (*apigateway.DeleteDeploymentOutput, error)
	GetDeployments(ctx context.Context, input *apigateway.GetDeploymentsInput, opts ...func(*apigateway.Options)) (*apigateway.GetDeploymentsOutput, error)
	CreateStage(ctx context.Context, input *apigateway.CreateStageInput, opts ...func(*apigateway.Options)) (*apigateway.CreateStageOutput, error)
	GetStages(ctx context.Context, input *apigateway.GetStagesInput, opts ...func(*apigateway.Options)) (*apigateway.GetStagesOutput, error)
	UpdateStage(ctx context.Context, input *apigateway.UpdateStageInput, opts ...func(*apigateway.Options)) (*apigateway.UpdateStageOutput, error)
	DeleteStage(ctx context.Context, input *apigateway.DeleteStageInput, opts ...func(*apigateway.Options)) (*apigateway.DeleteStageOutput, error)
}

// APIGatewayV2ClientPort defines the interface for the AWS API Gateway V2 client
type APIGatewayV2ClientPort interface {
	GetApis(ctx context.Context, input *apigatewayv2.GetApisInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.GetApisOutput, error)
	CreateApi(ctx context.Context, input *apigatewayv2.CreateApiInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.CreateApiOutput, error)
	DeleteApi(ctx context.Context, input *apigatewayv2.DeleteApiInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.DeleteApiOutput, error)
	GetApi(ctx context.Context, input *apigatewayv2.GetApiInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.GetApiOutput, error)
	GetRoutes(ctx context.Context, input *apigatewayv2.GetRoutesInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.GetRoutesOutput, error)
	CreateRoute(ctx context.Context, input *apigatewayv2.CreateRouteInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.CreateRouteOutput, error)
	UpdateRoute(ctx context.Context, input *apigatewayv2.UpdateRouteInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.UpdateRouteOutput, error)
	DeleteRoute(ctx context.Context, input *apigatewayv2.DeleteRouteInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.DeleteRouteOutput, error)
	GetIntegrations(ctx context.Context, input *apigatewayv2.GetIntegrationsInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.GetIntegrationsOutput, error)
	CreateIntegration(ctx context.Context, input *apigatewayv2.CreateIntegrationInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.CreateIntegrationOutput, error)
	UpdateIntegration(ctx context.Context, input *apigatewayv2.UpdateIntegrationInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.UpdateIntegrationOutput, error)
	DeleteIntegration(ctx context.Context, input *apigatewayv2.DeleteIntegrationInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.DeleteIntegrationOutput, error)
	// Stages
	GetStages(ctx context.Context, input *apigatewayv2.GetStagesInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.GetStagesOutput, error)
	GetStage(ctx context.Context, input *apigatewayv2.GetStageInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.GetStageOutput, error)
	CreateStage(ctx context.Context, input *apigatewayv2.CreateStageInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.CreateStageOutput, error)
	UpdateStage(ctx context.Context, input *apigatewayv2.UpdateStageInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.UpdateStageOutput, error)
	DeleteStage(ctx context.Context, input *apigatewayv2.DeleteStageInput, opts ...func(*apigatewayv2.Options)) (*apigatewayv2.DeleteStageOutput, error)
}

// DynamoDBClientPort defines the interface for the AWS DynamoDB client
type DynamoDBClientPort interface {
	ListTables(ctx context.Context, input *dynamodb.ListTablesInput, opts ...func(*dynamodb.Options)) (*dynamodb.ListTablesOutput, error)
	CreateTable(ctx context.Context, input *dynamodb.CreateTableInput, opts ...func(*dynamodb.Options)) (*dynamodb.CreateTableOutput, error)
	DescribeTable(ctx context.Context, input *dynamodb.DescribeTableInput, opts ...func(*dynamodb.Options)) (*dynamodb.DescribeTableOutput, error)
	DeleteTable(ctx context.Context, input *dynamodb.DeleteTableInput, opts ...func(*dynamodb.Options)) (*dynamodb.DeleteTableOutput, error)
	UpdateTable(ctx context.Context, input *dynamodb.UpdateTableInput, opts ...func(*dynamodb.Options)) (*dynamodb.UpdateTableOutput, error)
	PutItem(ctx context.Context, input *dynamodb.PutItemInput, opts ...func(*dynamodb.Options)) (*dynamodb.PutItemOutput, error)
	GetItem(ctx context.Context, input *dynamodb.GetItemInput, opts ...func(*dynamodb.Options)) (*dynamodb.GetItemOutput, error)
	DeleteItem(ctx context.Context, input *dynamodb.DeleteItemInput, opts ...func(*dynamodb.Options)) (*dynamodb.DeleteItemOutput, error)
	UpdateItem(ctx context.Context, input *dynamodb.UpdateItemInput, opts ...func(*dynamodb.Options)) (*dynamodb.UpdateItemOutput, error)
	Query(ctx context.Context, input *dynamodb.QueryInput, opts ...func(*dynamodb.Options)) (*dynamodb.QueryOutput, error)
	Scan(ctx context.Context, input *dynamodb.ScanInput, opts ...func(*dynamodb.Options)) (*dynamodb.ScanOutput, error)
	BatchWriteItem(ctx context.Context, input *dynamodb.BatchWriteItemInput, opts ...func(*dynamodb.Options)) (*dynamodb.BatchWriteItemOutput, error)
	BatchGetItem(ctx context.Context, input *dynamodb.BatchGetItemInput, opts ...func(*dynamodb.Options)) (*dynamodb.BatchGetItemOutput, error)
	DescribeTimeToLive(ctx context.Context, input *dynamodb.DescribeTimeToLiveInput, opts ...func(*dynamodb.Options)) (*dynamodb.DescribeTimeToLiveOutput, error)
	UpdateTimeToLive(ctx context.Context, input *dynamodb.UpdateTimeToLiveInput, opts ...func(*dynamodb.Options)) (*dynamodb.UpdateTimeToLiveOutput, error)
}

// ElastiCacheClientPort defines the interface for the AWS ElastiCache client
type ElastiCacheClientPort interface {
	DescribeReplicationGroups(ctx context.Context, input *elasticache.DescribeReplicationGroupsInput, opts ...func(*elasticache.Options)) (*elasticache.DescribeReplicationGroupsOutput, error)
	CreateReplicationGroup(ctx context.Context, input *elasticache.CreateReplicationGroupInput, opts ...func(*elasticache.Options)) (*elasticache.CreateReplicationGroupOutput, error)
	DeleteReplicationGroup(ctx context.Context, input *elasticache.DeleteReplicationGroupInput, opts ...func(*elasticache.Options)) (*elasticache.DeleteReplicationGroupOutput, error)
}

// IAMClientPort defines the interface for the AWS IAM client
type IAMClientPort interface {
	CreateUser(ctx context.Context, input *iam.CreateUserInput, opts ...func(*iam.Options)) (*iam.CreateUserOutput, error)
	GetUser(ctx context.Context, input *iam.GetUserInput, opts ...func(*iam.Options)) (*iam.GetUserOutput, error)
	ListUsers(ctx context.Context, input *iam.ListUsersInput, opts ...func(*iam.Options)) (*iam.ListUsersOutput, error)
	DeleteUser(ctx context.Context, input *iam.DeleteUserInput, opts ...func(*iam.Options)) (*iam.DeleteUserOutput, error)
	CreateRole(ctx context.Context, input *iam.CreateRoleInput, opts ...func(*iam.Options)) (*iam.CreateRoleOutput, error)
	GetRole(ctx context.Context, input *iam.GetRoleInput, opts ...func(*iam.Options)) (*iam.GetRoleOutput, error)
	ListRoles(ctx context.Context, input *iam.ListRolesInput, opts ...func(*iam.Options)) (*iam.ListRolesOutput, error)
	DeleteRole(ctx context.Context, input *iam.DeleteRoleInput, opts ...func(*iam.Options)) (*iam.DeleteRoleOutput, error)
	ListPolicies(ctx context.Context, input *iam.ListPoliciesInput, opts ...func(*iam.Options)) (*iam.ListPoliciesOutput, error)
	GetPolicy(ctx context.Context, input *iam.GetPolicyInput, opts ...func(*iam.Options)) (*iam.GetPolicyOutput, error)
	CreateAccessKey(ctx context.Context, input *iam.CreateAccessKeyInput, opts ...func(*iam.Options)) (*iam.CreateAccessKeyOutput, error)
	ListAccessKeys(ctx context.Context, input *iam.ListAccessKeysInput, opts ...func(*iam.Options)) (*iam.ListAccessKeysOutput, error)
	DeleteAccessKey(ctx context.Context, input *iam.DeleteAccessKeyInput, opts ...func(*iam.Options)) (*iam.DeleteAccessKeyOutput, error)
	UpdateAccessKey(ctx context.Context, input *iam.UpdateAccessKeyInput, opts ...func(*iam.Options)) (*iam.UpdateAccessKeyOutput, error)
	AttachRolePolicy(ctx context.Context, input *iam.AttachRolePolicyInput, opts ...func(*iam.Options)) (*iam.AttachRolePolicyOutput, error)
	DetachRolePolicy(ctx context.Context, input *iam.DetachRolePolicyInput, opts ...func(*iam.Options)) (*iam.DetachRolePolicyOutput, error)
	ListAttachedRolePolicies(ctx context.Context, input *iam.ListAttachedRolePoliciesInput, opts ...func(*iam.Options)) (*iam.ListAttachedRolePoliciesOutput, error)
	CreateGroup(ctx context.Context, input *iam.CreateGroupInput, opts ...func(*iam.Options)) (*iam.CreateGroupOutput, error)
	GetGroup(ctx context.Context, input *iam.GetGroupInput, opts ...func(*iam.Options)) (*iam.GetGroupOutput, error)
	ListGroups(ctx context.Context, input *iam.ListGroupsInput, opts ...func(*iam.Options)) (*iam.ListGroupsOutput, error)
	DeleteGroup(ctx context.Context, input *iam.DeleteGroupInput, opts ...func(*iam.Options)) (*iam.DeleteGroupOutput, error)
	AddUserToGroup(ctx context.Context, input *iam.AddUserToGroupInput, opts ...func(*iam.Options)) (*iam.AddUserToGroupOutput, error)
	RemoveUserFromGroup(ctx context.Context, input *iam.RemoveUserFromGroupInput, opts ...func(*iam.Options)) (*iam.RemoveUserFromGroupOutput, error)
	ListGroupsForUser(ctx context.Context, input *iam.ListGroupsForUserInput, opts ...func(*iam.Options)) (*iam.ListGroupsForUserOutput, error)
	ListUserPolicies(ctx context.Context, input *iam.ListUserPoliciesInput, opts ...func(*iam.Options)) (*iam.ListUserPoliciesOutput, error)
	ListRolePolicies(ctx context.Context, input *iam.ListRolePoliciesInput, opts ...func(*iam.Options)) (*iam.ListRolePoliciesOutput, error)
	GetRolePolicy(ctx context.Context, input *iam.GetRolePolicyInput, opts ...func(*iam.Options)) (*iam.GetRolePolicyOutput, error)
}

// KinesisClientPort defines the interface for the AWS Kinesis client
type KinesisClientPort interface {
	ListStreams(ctx context.Context, input *kinesis.ListStreamsInput, opts ...func(*kinesis.Options)) (*kinesis.ListStreamsOutput, error)
	CreateStream(ctx context.Context, input *kinesis.CreateStreamInput, opts ...func(*kinesis.Options)) (*kinesis.CreateStreamOutput, error)
	DeleteStream(ctx context.Context, input *kinesis.DeleteStreamInput, opts ...func(*kinesis.Options)) (*kinesis.DeleteStreamOutput, error)
	DescribeStream(ctx context.Context, input *kinesis.DescribeStreamInput, opts ...func(*kinesis.Options)) (*kinesis.DescribeStreamOutput, error)
	DescribeStreamSummary(ctx context.Context, input *kinesis.DescribeStreamSummaryInput, opts ...func(*kinesis.Options)) (*kinesis.DescribeStreamSummaryOutput, error)
	ListShards(ctx context.Context, input *kinesis.ListShardsInput, opts ...func(*kinesis.Options)) (*kinesis.ListShardsOutput, error)
	GetShardIterator(ctx context.Context, input *kinesis.GetShardIteratorInput, opts ...func(*kinesis.Options)) (*kinesis.GetShardIteratorOutput, error)
	GetRecords(ctx context.Context, input *kinesis.GetRecordsInput, opts ...func(*kinesis.Options)) (*kinesis.GetRecordsOutput, error)
	PutRecord(ctx context.Context, input *kinesis.PutRecordInput, opts ...func(*kinesis.Options)) (*kinesis.PutRecordOutput, error)
	PutRecords(ctx context.Context, input *kinesis.PutRecordsInput, opts ...func(*kinesis.Options)) (*kinesis.PutRecordsOutput, error)
	MergeShards(ctx context.Context, input *kinesis.MergeShardsInput, opts ...func(*kinesis.Options)) (*kinesis.MergeShardsOutput, error)
	SplitShard(ctx context.Context, input *kinesis.SplitShardInput, opts ...func(*kinesis.Options)) (*kinesis.SplitShardOutput, error)
	UpdateShardCount(ctx context.Context, input *kinesis.UpdateShardCountInput, opts ...func(*kinesis.Options)) (*kinesis.UpdateShardCountOutput, error)
	EnableEnhancedMonitoring(ctx context.Context, input *kinesis.EnableEnhancedMonitoringInput, opts ...func(*kinesis.Options)) (*kinesis.EnableEnhancedMonitoringOutput, error)
	DisableEnhancedMonitoring(ctx context.Context, input *kinesis.DisableEnhancedMonitoringInput, opts ...func(*kinesis.Options)) (*kinesis.DisableEnhancedMonitoringOutput, error)
}

// KMSClientPort defines the interface for the AWS KMS client
type KMSClientPort interface {
	ListKeys(ctx context.Context, input *kms.ListKeysInput, opts ...func(*kms.Options)) (*kms.ListKeysOutput, error)
	CreateKey(ctx context.Context, input *kms.CreateKeyInput, opts ...func(*kms.Options)) (*kms.CreateKeyOutput, error)
	DeleteAlias(ctx context.Context, input *kms.DeleteAliasInput, opts ...func(*kms.Options)) (*kms.DeleteAliasOutput, error)
	DescribeKey(ctx context.Context, input *kms.DescribeKeyInput, opts ...func(*kms.Options)) (*kms.DescribeKeyOutput, error)
	Encrypt(ctx context.Context, input *kms.EncryptInput, opts ...func(*kms.Options)) (*kms.EncryptOutput, error)
	Decrypt(ctx context.Context, input *kms.DecryptInput, opts ...func(*kms.Options)) (*kms.DecryptOutput, error)
	GenerateDataKey(ctx context.Context, input *kms.GenerateDataKeyInput, opts ...func(*kms.Options)) (*kms.GenerateDataKeyOutput, error)
	GenerateRandom(ctx context.Context, input *kms.GenerateRandomInput, opts ...func(*kms.Options)) (*kms.GenerateRandomOutput, error)
}

// LambdaClientPort defines the interface for the AWS Lambda client
type LambdaClientPort interface {
	ListFunctions(ctx context.Context, input *lambda.ListFunctionsInput, opts ...func(*lambda.Options)) (*lambda.ListFunctionsOutput, error)
	CreateFunction(ctx context.Context, input *lambda.CreateFunctionInput, opts ...func(*lambda.Options)) (*lambda.CreateFunctionOutput, error)
	GetFunction(ctx context.Context, input *lambda.GetFunctionInput, opts ...func(*lambda.Options)) (*lambda.GetFunctionOutput, error)
	DeleteFunction(ctx context.Context, input *lambda.DeleteFunctionInput, opts ...func(*lambda.Options)) (*lambda.DeleteFunctionOutput, error)
	Invoke(ctx context.Context, input *lambda.InvokeInput, opts ...func(*lambda.Options)) (*lambda.InvokeOutput, error)
	UpdateFunctionConfiguration(ctx context.Context, input *lambda.UpdateFunctionConfigurationInput, opts ...func(*lambda.Options)) (*lambda.UpdateFunctionConfigurationOutput, error)
	UpdateFunctionCode(ctx context.Context, input *lambda.UpdateFunctionCodeInput, opts ...func(*lambda.Options)) (*lambda.UpdateFunctionCodeOutput, error)
	GetFunctionConfiguration(ctx context.Context, input *lambda.GetFunctionConfigurationInput, opts ...func(*lambda.Options)) (*lambda.GetFunctionConfigurationOutput, error)
}

// RDSClientPort defines the interface for the AWS RDS client
type RDSClientPort interface {
	DescribeDBInstances(ctx context.Context, input *rds.DescribeDBInstancesInput, opts ...func(*rds.Options)) (*rds.DescribeDBInstancesOutput, error)
	CreateDBInstance(ctx context.Context, input *rds.CreateDBInstanceInput, opts ...func(*rds.Options)) (*rds.CreateDBInstanceOutput, error)
	DeleteDBInstance(ctx context.Context, input *rds.DeleteDBInstanceInput, opts ...func(*rds.Options)) (*rds.DeleteDBInstanceOutput, error)
	DescribeDBEngineVersions(ctx context.Context, input *rds.DescribeDBEngineVersionsInput, opts ...func(*rds.Options)) (*rds.DescribeDBEngineVersionsOutput, error)
	ModifyDBInstance(ctx context.Context, input *rds.ModifyDBInstanceInput, opts ...func(*rds.Options)) (*rds.ModifyDBInstanceOutput, error)
	RebootDBInstance(ctx context.Context, input *rds.RebootDBInstanceInput, opts ...func(*rds.Options)) (*rds.RebootDBInstanceOutput, error)
}

// S3ClientPort defines the interface for the AWS S3 client
type S3ClientPort interface {
	ListBuckets(ctx context.Context, input *s3.ListBucketsInput, opts ...func(*s3.Options)) (*s3.ListBucketsOutput, error)
	ListObjectsV2(ctx context.Context, input *s3.ListObjectsV2Input, opts ...func(*s3.Options)) (*s3.ListObjectsV2Output, error)
	GetObject(ctx context.Context, input *s3.GetObjectInput, opts ...func(*s3.Options)) (*s3.GetObjectOutput, error)
	PutObject(ctx context.Context, input *s3.PutObjectInput, opts ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	DeleteObject(ctx context.Context, input *s3.DeleteObjectInput, opts ...func(*s3.Options)) (*s3.DeleteObjectOutput, error)
	DeleteBucket(ctx context.Context, input *s3.DeleteBucketInput, opts ...func(*s3.Options)) (*s3.DeleteBucketOutput, error)
	HeadBucket(ctx context.Context, input *s3.HeadBucketInput, opts ...func(*s3.Options)) (*s3.HeadBucketOutput, error)
	HeadObject(ctx context.Context, input *s3.HeadObjectInput, opts ...func(*s3.Options)) (*s3.HeadObjectOutput, error)
	CreateBucket(ctx context.Context, input *s3.CreateBucketInput, opts ...func(*s3.Options)) (*s3.CreateBucketOutput, error)
}

// SecretsManagerClientPort defines the interface for the AWS Secrets Manager client
type SecretsManagerClientPort interface {
	ListSecrets(ctx context.Context, input *secretsmanager.ListSecretsInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.ListSecretsOutput, error)
	CreateSecret(ctx context.Context, input *secretsmanager.CreateSecretInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.CreateSecretOutput, error)
	GetSecretValue(ctx context.Context, input *secretsmanager.GetSecretValueInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.GetSecretValueOutput, error)
	PutSecretValue(ctx context.Context, input *secretsmanager.PutSecretValueInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.PutSecretValueOutput, error)
	DeleteSecret(ctx context.Context, input *secretsmanager.DeleteSecretInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.DeleteSecretOutput, error)
	DescribeSecret(ctx context.Context, input *secretsmanager.DescribeSecretInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.DescribeSecretOutput, error)
	UpdateSecret(ctx context.Context, input *secretsmanager.UpdateSecretInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.UpdateSecretOutput, error)
	RestoreSecret(ctx context.Context, input *secretsmanager.RestoreSecretInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.RestoreSecretOutput, error)
	RotateSecret(ctx context.Context, input *secretsmanager.RotateSecretInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.RotateSecretOutput, error)
	GetRandomPassword(ctx context.Context, input *secretsmanager.GetRandomPasswordInput, opts ...func(*secretsmanager.Options)) (*secretsmanager.GetRandomPasswordOutput, error)
}

// SQSClientPort defines the interface for the AWS SQS client
type SQSClientPort interface {
	ListQueues(ctx context.Context, input *sqs.ListQueuesInput, opts ...func(*sqs.Options)) (*sqs.ListQueuesOutput, error)
	CreateQueue(ctx context.Context, input *sqs.CreateQueueInput, opts ...func(*sqs.Options)) (*sqs.CreateQueueOutput, error)
	DeleteQueue(ctx context.Context, input *sqs.DeleteQueueInput, opts ...func(*sqs.Options)) (*sqs.DeleteQueueOutput, error)
	GetQueueUrl(ctx context.Context, input *sqs.GetQueueUrlInput, opts ...func(*sqs.Options)) (*sqs.GetQueueUrlOutput, error)
	SendMessage(ctx context.Context, input *sqs.SendMessageInput, opts ...func(*sqs.Options)) (*sqs.SendMessageOutput, error)
	ReceiveMessage(ctx context.Context, input *sqs.ReceiveMessageInput, opts ...func(*sqs.Options)) (*sqs.ReceiveMessageOutput, error)
	DeleteMessage(ctx context.Context, input *sqs.DeleteMessageInput, opts ...func(*sqs.Options)) (*sqs.DeleteMessageOutput, error)
	PurgeQueue(ctx context.Context, input *sqs.PurgeQueueInput, opts ...func(*sqs.Options)) (*sqs.PurgeQueueOutput, error)
	GetQueueAttributes(ctx context.Context, input *sqs.GetQueueAttributesInput, opts ...func(*sqs.Options)) (*sqs.GetQueueAttributesOutput, error)
	SetQueueAttributes(ctx context.Context, input *sqs.SetQueueAttributesInput, opts ...func(*sqs.Options)) (*sqs.SetQueueAttributesOutput, error)
}

// SNSClientPort defines the interface for the AWS SNS client
type SNSClientPort interface {
	ListTopics(ctx context.Context, input *sns.ListTopicsInput, opts ...func(*sns.Options)) (*sns.ListTopicsOutput, error)
	CreateTopic(ctx context.Context, input *sns.CreateTopicInput, opts ...func(*sns.Options)) (*sns.CreateTopicOutput, error)
	DeleteTopic(ctx context.Context, input *sns.DeleteTopicInput, opts ...func(*sns.Options)) (*sns.DeleteTopicOutput, error)
	Subscribe(ctx context.Context, input *sns.SubscribeInput, opts ...func(*sns.Options)) (*sns.SubscribeOutput, error)
	Unsubscribe(ctx context.Context, input *sns.UnsubscribeInput, opts ...func(*sns.Options)) (*sns.UnsubscribeOutput, error)
	ListSubscriptions(ctx context.Context, input *sns.ListSubscriptionsInput, opts ...func(*sns.Options)) (*sns.ListSubscriptionsOutput, error)
	ListSubscriptionsByTopic(ctx context.Context, input *sns.ListSubscriptionsByTopicInput, opts ...func(*sns.Options)) (*sns.ListSubscriptionsByTopicOutput, error)
	Publish(ctx context.Context, input *sns.PublishInput, opts ...func(*sns.Options)) (*sns.PublishOutput, error)
}

// SSMClientPort defines the interface for the AWS SSM client
type SSMClientPort interface {
	GetParameter(ctx context.Context, input *ssm.GetParameterInput, opts ...func(*ssm.Options)) (*ssm.GetParameterOutput, error)
	GetParameters(ctx context.Context, input *ssm.GetParametersInput, opts ...func(*ssm.Options)) (*ssm.GetParametersOutput, error)
	GetParametersByPath(ctx context.Context, input *ssm.GetParametersByPathInput, opts ...func(*ssm.Options)) (*ssm.GetParametersByPathOutput, error)
	PutParameter(ctx context.Context, input *ssm.PutParameterInput, opts ...func(*ssm.Options)) (*ssm.PutParameterOutput, error)
	DeleteParameter(ctx context.Context, input *ssm.DeleteParameterInput, opts ...func(*ssm.Options)) (*ssm.DeleteParameterOutput, error)
	DescribeParameters(ctx context.Context, input *ssm.DescribeParametersInput, opts ...func(*ssm.Options)) (*ssm.DescribeParametersOutput, error)
	GetParameterHistory(ctx context.Context, input *ssm.GetParameterHistoryInput, opts ...func(*ssm.Options)) (*ssm.GetParameterHistoryOutput, error)
	ListTagsForResource(ctx context.Context, input *ssm.ListTagsForResourceInput, opts ...func(*ssm.Options)) (*ssm.ListTagsForResourceOutput, error)
	AddTagsToResource(ctx context.Context, input *ssm.AddTagsToResourceInput, opts ...func(*ssm.Options)) (*ssm.AddTagsToResourceOutput, error)
	RemoveTagsFromResource(ctx context.Context, input *ssm.RemoveTagsFromResourceInput, opts ...func(*ssm.Options)) (*ssm.RemoveTagsFromResourceOutput, error)
}
