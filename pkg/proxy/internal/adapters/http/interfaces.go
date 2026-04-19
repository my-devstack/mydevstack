package httphandlers

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

type S3Service interface {
	ListBuckets(ctx context.Context) (*s3.ListBucketsOutput, error)
	ListObjectsV2(ctx context.Context, input *s3.ListObjectsV2Input) (*s3.ListObjectsV2Output, error)
	GetObject(ctx context.Context, input *s3.GetObjectInput) (*s3.GetObjectOutput, error)
	PutObject(ctx context.Context, input *s3.PutObjectInput) (*s3.PutObjectOutput, error)
	DeleteObject(ctx context.Context, input *s3.DeleteObjectInput) (*s3.DeleteObjectOutput, error)
	DeleteBucket(ctx context.Context, input *s3.DeleteBucketInput) (*s3.DeleteBucketOutput, error)
	HeadBucket(ctx context.Context, input *s3.HeadBucketInput) (*s3.HeadBucketOutput, error)
	HeadObject(ctx context.Context, input *s3.HeadObjectInput) (*s3.HeadObjectOutput, error)
	CreateBucket(ctx context.Context, input *s3.CreateBucketInput) (*s3.CreateBucketOutput, error)
}

type LambdaService interface {
	ListFunctions(ctx context.Context, input *lambda.ListFunctionsInput) (*lambda.ListFunctionsOutput, error)
	CreateFunction(ctx context.Context, input *lambda.CreateFunctionInput) (*lambda.CreateFunctionOutput, error)
	GetFunction(ctx context.Context, input *lambda.GetFunctionInput) (*lambda.GetFunctionOutput, error)
	DeleteFunction(ctx context.Context, input *lambda.DeleteFunctionInput) (*lambda.DeleteFunctionOutput, error)
	Invoke(ctx context.Context, input *lambda.InvokeInput) (*lambda.InvokeOutput, error)
	UpdateFunctionConfiguration(ctx context.Context, input *lambda.UpdateFunctionConfigurationInput) (*lambda.UpdateFunctionConfigurationOutput, error)
	UpdateFunctionCode(ctx context.Context, input *lambda.UpdateFunctionCodeInput) (*lambda.UpdateFunctionCodeOutput, error)
	GetFunctionConfiguration(ctx context.Context, input *lambda.GetFunctionConfigurationInput) (*lambda.GetFunctionConfigurationOutput, error)
}

type SecretsManagerService interface {
	ListSecrets(ctx context.Context, input *secretsmanager.ListSecretsInput) (*secretsmanager.ListSecretsOutput, error)
	CreateSecret(ctx context.Context, input *secretsmanager.CreateSecretInput) (*secretsmanager.CreateSecretOutput, error)
	GetSecretValue(ctx context.Context, input *secretsmanager.GetSecretValueInput) (*secretsmanager.GetSecretValueOutput, error)
	PutSecretValue(ctx context.Context, input *secretsmanager.PutSecretValueInput) (*secretsmanager.PutSecretValueOutput, error)
	DeleteSecret(ctx context.Context, input *secretsmanager.DeleteSecretInput) (*secretsmanager.DeleteSecretOutput, error)
	DescribeSecret(ctx context.Context, input *secretsmanager.DescribeSecretInput) (*secretsmanager.DescribeSecretOutput, error)
	UpdateSecret(ctx context.Context, input *secretsmanager.UpdateSecretInput) (*secretsmanager.UpdateSecretOutput, error)
	RestoreSecret(ctx context.Context, input *secretsmanager.RestoreSecretInput) (*secretsmanager.RestoreSecretOutput, error)
	RotateSecret(ctx context.Context, input *secretsmanager.RotateSecretInput) (*secretsmanager.RotateSecretOutput, error)
	GetRandomPassword(ctx context.Context, input *secretsmanager.GetRandomPasswordInput) (*secretsmanager.GetRandomPasswordOutput, error)
}

type SQSService interface {
	ListQueues(ctx context.Context, input *sqs.ListQueuesInput) (*sqs.ListQueuesOutput, error)
	CreateQueue(ctx context.Context, input *sqs.CreateQueueInput) (*sqs.CreateQueueOutput, error)
	DeleteQueue(ctx context.Context, input *sqs.DeleteQueueInput) (*sqs.DeleteQueueOutput, error)
	GetQueueUrl(ctx context.Context, input *sqs.GetQueueUrlInput) (*sqs.GetQueueUrlOutput, error)
	SendMessage(ctx context.Context, input *sqs.SendMessageInput) (*sqs.SendMessageOutput, error)
	ReceiveMessage(ctx context.Context, input *sqs.ReceiveMessageInput) (*sqs.ReceiveMessageOutput, error)
	DeleteMessage(ctx context.Context, input *sqs.DeleteMessageInput) (*sqs.DeleteMessageOutput, error)
	PurgeQueue(ctx context.Context, input *sqs.PurgeQueueInput) (*sqs.PurgeQueueOutput, error)
	GetQueueAttributes(ctx context.Context, input *sqs.GetQueueAttributesInput) (*sqs.GetQueueAttributesOutput, error)
	SetQueueAttributes(ctx context.Context, input *sqs.SetQueueAttributesInput) (*sqs.SetQueueAttributesOutput, error)
}

type SNSService interface {
	ListTopics(ctx context.Context, input *sns.ListTopicsInput) (*sns.ListTopicsOutput, error)
	CreateTopic(ctx context.Context, input *sns.CreateTopicInput) (*sns.CreateTopicOutput, error)
	DeleteTopic(ctx context.Context, input *sns.DeleteTopicInput) (*sns.DeleteTopicOutput, error)
	Subscribe(ctx context.Context, input *sns.SubscribeInput) (*sns.SubscribeOutput, error)
	Unsubscribe(ctx context.Context, input *sns.UnsubscribeInput) (*sns.UnsubscribeOutput, error)
	ListSubscriptions(ctx context.Context, input *sns.ListSubscriptionsInput) (*sns.ListSubscriptionsOutput, error)
	ListSubscriptionsByTopic(ctx context.Context, input *sns.ListSubscriptionsByTopicInput) (*sns.ListSubscriptionsByTopicOutput, error)
	Publish(ctx context.Context, input *sns.PublishInput) (*sns.PublishOutput, error)
}

type KMSService interface {
	ListKeys(ctx context.Context, input *kms.ListKeysInput) (*kms.ListKeysOutput, error)
	CreateKey(ctx context.Context, input *kms.CreateKeyInput) (*kms.CreateKeyOutput, error)
	DeleteAlias(ctx context.Context, input *kms.DeleteAliasInput) (*kms.DeleteAliasOutput, error)
	DescribeKey(ctx context.Context, input *kms.DescribeKeyInput) (*kms.DescribeKeyOutput, error)
	Encrypt(ctx context.Context, input *kms.EncryptInput) (*kms.EncryptOutput, error)
	Decrypt(ctx context.Context, input *kms.DecryptInput) (*kms.DecryptOutput, error)
	GenerateDataKey(ctx context.Context, input *kms.GenerateDataKeyInput) (*kms.GenerateDataKeyOutput, error)
	GenerateRandom(ctx context.Context, input *kms.GenerateRandomInput) (*kms.GenerateRandomOutput, error)
}

type DynamoDBService interface {
	ListTables(ctx context.Context, input *dynamodb.ListTablesInput) (*dynamodb.ListTablesOutput, error)
	CreateTable(ctx context.Context, input *dynamodb.CreateTableInput) (*dynamodb.CreateTableOutput, error)
	DescribeTable(ctx context.Context, input *dynamodb.DescribeTableInput) (*dynamodb.DescribeTableOutput, error)
	DeleteTable(ctx context.Context, input *dynamodb.DeleteTableInput) (*dynamodb.DeleteTableOutput, error)
	UpdateTable(ctx context.Context, input *dynamodb.UpdateTableInput) (*dynamodb.UpdateTableOutput, error)
	PutItem(ctx context.Context, input *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error)
	GetItem(ctx context.Context, input *dynamodb.GetItemInput) (*dynamodb.GetItemOutput, error)
	DeleteItem(ctx context.Context, input *dynamodb.DeleteItemInput) (*dynamodb.DeleteItemOutput, error)
	UpdateItem(ctx context.Context, input *dynamodb.UpdateItemInput) (*dynamodb.UpdateItemOutput, error)
	Query(ctx context.Context, input *dynamodb.QueryInput) (*dynamodb.QueryOutput, error)
	Scan(ctx context.Context, input *dynamodb.ScanInput) (*dynamodb.ScanOutput, error)
	BatchWriteItem(ctx context.Context, input *dynamodb.BatchWriteItemInput) (*dynamodb.BatchWriteItemOutput, error)
	BatchGetItem(ctx context.Context, input *dynamodb.BatchGetItemInput) (*dynamodb.BatchGetItemOutput, error)
	DescribeTimeToLive(ctx context.Context, input *dynamodb.DescribeTimeToLiveInput) (*dynamodb.DescribeTimeToLiveOutput, error)
	UpdateTimeToLive(ctx context.Context, input *dynamodb.UpdateTimeToLiveInput) (*dynamodb.UpdateTimeToLiveOutput, error)
}

type APIGatewayService interface {
	GetRestApis(ctx context.Context, input *apigateway.GetRestApisInput) (*apigateway.GetRestApisOutput, error)
	CreateRestApi(ctx context.Context, input *apigateway.CreateRestApiInput) (*apigateway.CreateRestApiOutput, error)
	ImportRestApi(ctx context.Context, input *apigateway.ImportRestApiInput) (*apigateway.ImportRestApiOutput, error)
	DeleteRestApi(ctx context.Context, input *apigateway.DeleteRestApiInput) (*apigateway.DeleteRestApiOutput, error)
	GetRestApi(ctx context.Context, input *apigateway.GetRestApiInput) (*apigateway.GetRestApiOutput, error)
	UpdateRestApi(ctx context.Context, input *apigateway.UpdateRestApiInput) (*apigateway.UpdateRestApiOutput, error)
	GetResources(ctx context.Context, input *apigateway.GetResourcesInput) (*apigateway.GetResourcesOutput, error)
	GetResource(ctx context.Context, input *apigateway.GetResourceInput) (*apigateway.GetResourceOutput, error)
	CreateResource(ctx context.Context, input *apigateway.CreateResourceInput) (*apigateway.CreateResourceOutput, error)
	DeleteResource(ctx context.Context, input *apigateway.DeleteResourceInput) (*apigateway.DeleteResourceOutput, error)
	PutMethod(ctx context.Context, input *apigateway.PutMethodInput) (*apigateway.PutMethodOutput, error)
	GetMethod(ctx context.Context, input *apigateway.GetMethodInput) (*apigateway.GetMethodOutput, error)
	DeleteMethod(ctx context.Context, input *apigateway.DeleteMethodInput) (*apigateway.DeleteMethodOutput, error)
	PutIntegration(ctx context.Context, input *apigateway.PutIntegrationInput) (*apigateway.PutIntegrationOutput, error)
	GetIntegration(ctx context.Context, input *apigateway.GetIntegrationInput) (*apigateway.GetIntegrationOutput, error)
	DeleteIntegration(ctx context.Context, input *apigateway.DeleteIntegrationInput) (*apigateway.DeleteIntegrationOutput, error)
	CreateDeployment(ctx context.Context, input *apigateway.CreateDeploymentInput) (*apigateway.CreateDeploymentOutput, error)
	DeleteDeployment(ctx context.Context, input *apigateway.DeleteDeploymentInput) (*apigateway.DeleteDeploymentOutput, error)
	CreateStage(ctx context.Context, input *apigateway.CreateStageInput) (*apigateway.CreateStageOutput, error)
	GetStages(ctx context.Context, input *apigateway.GetStagesInput) (*apigateway.GetStagesOutput, error)
	UpdateStage(ctx context.Context, input *apigateway.UpdateStageInput) (*apigateway.UpdateStageOutput, error)
	DeleteStage(ctx context.Context, input *apigateway.DeleteStageInput) (*apigateway.DeleteStageOutput, error)
}

type APIGatewayV2Service interface {
	GetApis(ctx context.Context, input *apigatewayv2.GetApisInput) (*apigatewayv2.GetApisOutput, error)
	CreateApi(ctx context.Context, input *apigatewayv2.CreateApiInput) (*apigatewayv2.CreateApiOutput, error)
	DeleteApi(ctx context.Context, input *apigatewayv2.DeleteApiInput) (*apigatewayv2.DeleteApiOutput, error)
	GetApi(ctx context.Context, input *apigatewayv2.GetApiInput) (*apigatewayv2.GetApiOutput, error)
	GetRoutes(ctx context.Context, input *apigatewayv2.GetRoutesInput) (*apigatewayv2.GetRoutesOutput, error)
	CreateRoute(ctx context.Context, input *apigatewayv2.CreateRouteInput) (*apigatewayv2.CreateRouteOutput, error)
	UpdateRoute(ctx context.Context, input *apigatewayv2.UpdateRouteInput) (*apigatewayv2.UpdateRouteOutput, error)
	DeleteRoute(ctx context.Context, input *apigatewayv2.DeleteRouteInput) (*apigatewayv2.DeleteRouteOutput, error)
	GetIntegrations(ctx context.Context, input *apigatewayv2.GetIntegrationsInput) (*apigatewayv2.GetIntegrationsOutput, error)
	CreateIntegration(ctx context.Context, input *apigatewayv2.CreateIntegrationInput) (*apigatewayv2.CreateIntegrationOutput, error)
	UpdateIntegration(ctx context.Context, input *apigatewayv2.UpdateIntegrationInput) (*apigatewayv2.UpdateIntegrationOutput, error)
	DeleteIntegration(ctx context.Context, input *apigatewayv2.DeleteIntegrationInput) (*apigatewayv2.DeleteIntegrationOutput, error)
	GetStages(ctx context.Context, input *apigatewayv2.GetStagesInput) (*apigatewayv2.GetStagesOutput, error)
	GetStage(ctx context.Context, input *apigatewayv2.GetStageInput) (*apigatewayv2.GetStageOutput, error)
	CreateStage(ctx context.Context, input *apigatewayv2.CreateStageInput) (*apigatewayv2.CreateStageOutput, error)
	UpdateStage(ctx context.Context, input *apigatewayv2.UpdateStageInput) (*apigatewayv2.UpdateStageOutput, error)
	DeleteStage(ctx context.Context, input *apigatewayv2.DeleteStageInput) (*apigatewayv2.DeleteStageOutput, error)
}

type SSMService interface {
	GetParameter(ctx context.Context, input *ssm.GetParameterInput) (*ssm.GetParameterOutput, error)
	GetParameters(ctx context.Context, input *ssm.GetParametersInput) (*ssm.GetParametersOutput, error)
	GetParametersByPath(ctx context.Context, input *ssm.GetParametersByPathInput) (*ssm.GetParametersByPathOutput, error)
	PutParameter(ctx context.Context, input *ssm.PutParameterInput) (*ssm.PutParameterOutput, error)
	DeleteParameter(ctx context.Context, input *ssm.DeleteParameterInput) (*ssm.DeleteParameterOutput, error)
	DescribeParameters(ctx context.Context, input *ssm.DescribeParametersInput) (*ssm.DescribeParametersOutput, error)
	GetParameterHistory(ctx context.Context, input *ssm.GetParameterHistoryInput) (*ssm.GetParameterHistoryOutput, error)
	ListTagsForResource(ctx context.Context, input *ssm.ListTagsForResourceInput) (*ssm.ListTagsForResourceOutput, error)
	AddTagsToResource(ctx context.Context, input *ssm.AddTagsToResourceInput) (*ssm.AddTagsToResourceOutput, error)
	RemoveTagsFromResource(ctx context.Context, input *ssm.RemoveTagsFromResourceInput) (*ssm.RemoveTagsFromResourceOutput, error)
}

type IAMService interface {
	CreateUser(ctx context.Context, input *iam.CreateUserInput) (*iam.CreateUserOutput, error)
	GetUser(ctx context.Context, input *iam.GetUserInput) (*iam.GetUserOutput, error)
	ListUsers(ctx context.Context, input *iam.ListUsersInput) (*iam.ListUsersOutput, error)
	DeleteUser(ctx context.Context, input *iam.DeleteUserInput) (*iam.DeleteUserOutput, error)
	CreateRole(ctx context.Context, input *iam.CreateRoleInput) (*iam.CreateRoleOutput, error)
	GetRole(ctx context.Context, input *iam.GetRoleInput) (*iam.GetRoleOutput, error)
	ListRoles(ctx context.Context, input *iam.ListRolesInput) (*iam.ListRolesOutput, error)
	DeleteRole(ctx context.Context, input *iam.DeleteRoleInput) (*iam.DeleteRoleOutput, error)
	ListPolicies(ctx context.Context, input *iam.ListPoliciesInput) (*iam.ListPoliciesOutput, error)
	GetPolicy(ctx context.Context, input *iam.GetPolicyInput) (*iam.GetPolicyOutput, error)
	CreateAccessKey(ctx context.Context, input *iam.CreateAccessKeyInput) (*iam.CreateAccessKeyOutput, error)
	ListAccessKeys(ctx context.Context, input *iam.ListAccessKeysInput) (*iam.ListAccessKeysOutput, error)
	DeleteAccessKey(ctx context.Context, input *iam.DeleteAccessKeyInput) (*iam.DeleteAccessKeyOutput, error)
	UpdateAccessKeyStatus(ctx context.Context, input *iam.UpdateAccessKeyInput) (*iam.UpdateAccessKeyOutput, error)
	AttachRolePolicy(ctx context.Context, input *iam.AttachRolePolicyInput) (*iam.AttachRolePolicyOutput, error)
	DetachRolePolicy(ctx context.Context, input *iam.DetachRolePolicyInput) (*iam.DetachRolePolicyOutput, error)
	ListAttachedRolePolicies(ctx context.Context, input *iam.ListAttachedRolePoliciesInput) (*iam.ListAttachedRolePoliciesOutput, error)
	CreateGroup(ctx context.Context, input *iam.CreateGroupInput) (*iam.CreateGroupOutput, error)
	GetGroup(ctx context.Context, input *iam.GetGroupInput) (*iam.GetGroupOutput, error)
	ListGroups(ctx context.Context, input *iam.ListGroupsInput) (*iam.ListGroupsOutput, error)
	DeleteGroup(ctx context.Context, input *iam.DeleteGroupInput) (*iam.DeleteGroupOutput, error)
	AddUserToGroup(ctx context.Context, input *iam.AddUserToGroupInput) (*iam.AddUserToGroupOutput, error)
	RemoveUserFromGroup(ctx context.Context, input *iam.RemoveUserFromGroupInput) (*iam.RemoveUserFromGroupOutput, error)
	ListGroupsForUser(ctx context.Context, input *iam.ListGroupsForUserInput) (*iam.ListGroupsForUserOutput, error)
	ListUserPolicies(ctx context.Context, input *iam.ListUserPoliciesInput) (*iam.ListUserPoliciesOutput, error)
	ListRolePolicies(ctx context.Context, input *iam.ListRolePoliciesInput) (*iam.ListRolePoliciesOutput, error)
	GetRolePolicy(ctx context.Context, input *iam.GetRolePolicyInput) (*iam.GetRolePolicyOutput, error)
}

type KinesisService interface {
	ListStreams(ctx context.Context, input *kinesis.ListStreamsInput) (*kinesis.ListStreamsOutput, error)
	CreateStream(ctx context.Context, input *kinesis.CreateStreamInput) (*kinesis.CreateStreamOutput, error)
	DeleteStream(ctx context.Context, input *kinesis.DeleteStreamInput) (*kinesis.DeleteStreamOutput, error)
	DescribeStream(ctx context.Context, input *kinesis.DescribeStreamInput) (*kinesis.DescribeStreamOutput, error)
	DescribeStreamSummary(ctx context.Context, input *kinesis.DescribeStreamSummaryInput) (*kinesis.DescribeStreamSummaryOutput, error)
	ListShards(ctx context.Context, input *kinesis.ListShardsInput) (*kinesis.ListShardsOutput, error)
	GetShardIterator(ctx context.Context, input *kinesis.GetShardIteratorInput) (*kinesis.GetShardIteratorOutput, error)
	GetRecords(ctx context.Context, input *kinesis.GetRecordsInput) (*kinesis.GetRecordsOutput, error)
	PutRecord(ctx context.Context, input *kinesis.PutRecordInput) (*kinesis.PutRecordOutput, error)
	PutRecords(ctx context.Context, input *kinesis.PutRecordsInput) (*kinesis.PutRecordsOutput, error)
	MergeShards(ctx context.Context, input *kinesis.MergeShardsInput) (*kinesis.MergeShardsOutput, error)
	SplitShard(ctx context.Context, input *kinesis.SplitShardInput) (*kinesis.SplitShardOutput, error)
	UpdateShardCount(ctx context.Context, input *kinesis.UpdateShardCountInput) (*kinesis.UpdateShardCountOutput, error)
	EnableEnhancedMonitoring(ctx context.Context, input *kinesis.EnableEnhancedMonitoringInput) (*kinesis.EnableEnhancedMonitoringOutput, error)
	DisableEnhancedMonitoring(ctx context.Context, input *kinesis.DisableEnhancedMonitoringInput) (*kinesis.DisableEnhancedMonitoringOutput, error)
}

type ConfigGetter interface {
	Config() *HandlerConfig
}

type HandlerConfig struct {
	AwsEndpoint string
	AwsRegion   string
}

type ProxyService interface {
	S3() S3Service
	Lambda() LambdaService
	SecretsManager() SecretsManagerService
	SQS() SQSService
	SNS() SNSService
	KMS() KMSService
	DynamoDB() DynamoDBService
	APIGateway() APIGatewayService
	APIGatewayV2() APIGatewayV2Service
	SSM() SSMService
	IAM() IAMService
	Kinesis() KinesisService
	Config() *HandlerConfig
}
