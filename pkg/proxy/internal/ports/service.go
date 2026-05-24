package ports

import (
	"context"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
	"github.com/aws/aws-sdk-go-v2/service/elasticache"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/kafka"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/opensearch"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	config "github.com/beabys/ayotl"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
)

type ProxyService interface {
	S3() S3Port
	Lambda() LambdaPort
	SecretsManager() SecretsManagerPort
	StepFunctions() StepFunctionsPort
	SQS() SQSPort
	SNS() SNSPort
	SESv2() SESv2Port
	KMS() KMSPort
	DynamoDB() DynamoDBPort
	DynamoDBStreams() DynamoDBStreamsPort
	APIGateway() APIGatewayPort
	APIGatewayV2() APIGatewayV2Port
	SSM() SSMPort
	IAM() IAMPort
	Kinesis() KinesisPort
	RDS() RDSPort
	ElastiCache() ElastiCachePort
	MSK() MSKPort
	OpenSearch() OpenSearchPort
	CloudFormation() CloudFormationPort
	CloudWatch() CloudWatchPort
	CloudWatchLogs() CloudWatchLogsPort
	Config() *configloader.Config
	Region() string
	SetRegion(region string) error
	SetServices() error
}

type S3Port interface {
	ListBuckets(ctx context.Context) (*s3.ListBucketsOutput, error)
	ListObjectsV2(ctx context.Context, input *s3.ListObjectsV2Input) (*s3.ListObjectsV2Output, error)
	GetObject(ctx context.Context, input *s3.GetObjectInput) (*s3.GetObjectOutput, error)
	PutObject(ctx context.Context, input *s3.PutObjectInput) (*s3.PutObjectOutput, error)
	DeleteObject(ctx context.Context, input *s3.DeleteObjectInput) (*s3.DeleteObjectOutput, error)
	DeleteBucket(ctx context.Context, input *s3.DeleteBucketInput) (*s3.DeleteBucketOutput, error)
	HeadBucket(ctx context.Context, input *s3.HeadBucketInput) (*s3.HeadBucketOutput, error)
	HeadObject(ctx context.Context, input *s3.HeadObjectInput) (*s3.HeadObjectOutput, error)
	CreateBucket(ctx context.Context, input *s3.CreateBucketInput) (*s3.CreateBucketOutput, error)
	GetBucketVersioning(ctx context.Context, input *s3.GetBucketVersioningInput) (*s3.GetBucketVersioningOutput, error)
	GetBucketEncryption(ctx context.Context, input *s3.GetBucketEncryptionInput) (*s3.GetBucketEncryptionOutput, error)
	GetBucketTagging(ctx context.Context, input *s3.GetBucketTaggingInput) (*s3.GetBucketTaggingOutput, error)
	GetBucketPolicy(ctx context.Context, input *s3.GetBucketPolicyInput) (*s3.GetBucketPolicyOutput, error)
	PresignGetObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error)
	PresignPutObject(ctx context.Context, bucket, key string, expires time.Duration) (string, error)
	PutBucketPolicy(ctx context.Context, input *s3.PutBucketPolicyInput) (*s3.PutBucketPolicyOutput, error)
	PutBucketVersioning(ctx context.Context, input *s3.PutBucketVersioningInput) (*s3.PutBucketVersioningOutput, error)
	PutBucketEncryption(ctx context.Context, input *s3.PutBucketEncryptionInput) (*s3.PutBucketEncryptionOutput, error)
	PutBucketTagging(ctx context.Context, input *s3.PutBucketTaggingInput) (*s3.PutBucketTaggingOutput, error)
	PutPublicAccessBlock(ctx context.Context, input *s3.PutPublicAccessBlockInput) (*s3.PutPublicAccessBlockOutput, error)
	GetPublicAccessBlock(ctx context.Context, input *s3.GetPublicAccessBlockInput) (*s3.GetPublicAccessBlockOutput, error)
	PutBucketNotificationConfiguration(ctx context.Context, input *s3.PutBucketNotificationConfigurationInput) (*s3.PutBucketNotificationConfigurationOutput, error)
	GetBucketNotificationConfiguration(ctx context.Context, input *s3.GetBucketNotificationConfigurationInput) (*s3.GetBucketNotificationConfigurationOutput, error)
}

type LambdaPort interface {
	ListFunctions(ctx context.Context, input *lambda.ListFunctionsInput) (*lambda.ListFunctionsOutput, error)
	CreateFunction(ctx context.Context, input *lambda.CreateFunctionInput) (*lambda.CreateFunctionOutput, error)
	GetFunction(ctx context.Context, input *lambda.GetFunctionInput) (*lambda.GetFunctionOutput, error)
	DeleteFunction(ctx context.Context, input *lambda.DeleteFunctionInput) (*lambda.DeleteFunctionOutput, error)
	Invoke(ctx context.Context, input *lambda.InvokeInput) (*lambda.InvokeOutput, error)
	UpdateFunctionConfiguration(ctx context.Context, input *lambda.UpdateFunctionConfigurationInput) (*lambda.UpdateFunctionConfigurationOutput, error)
	UpdateFunctionCode(ctx context.Context, input *lambda.UpdateFunctionCodeInput) (*lambda.UpdateFunctionCodeOutput, error)
	GetFunctionConfiguration(ctx context.Context, input *lambda.GetFunctionConfigurationInput) (*lambda.GetFunctionConfigurationOutput, error)
	ListEventSourceMappings(ctx context.Context, input *lambda.ListEventSourceMappingsInput) (*lambda.ListEventSourceMappingsOutput, error)
	CreateEventSourceMapping(ctx context.Context, input *lambda.CreateEventSourceMappingInput) (*lambda.CreateEventSourceMappingOutput, error)
	GetEventSourceMapping(ctx context.Context, input *lambda.GetEventSourceMappingInput) (*lambda.GetEventSourceMappingOutput, error)
	DeleteEventSourceMapping(ctx context.Context, input *lambda.DeleteEventSourceMappingInput) (*lambda.DeleteEventSourceMappingOutput, error)
}

type SecretsManagerPort interface {
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

type StepFunctionsPort interface {
	ListStateMachines(ctx context.Context, input *sfn.ListStateMachinesInput) (*sfn.ListStateMachinesOutput, error)
	CreateStateMachine(ctx context.Context, input *sfn.CreateStateMachineInput) (*sfn.CreateStateMachineOutput, error)
	DescribeStateMachine(ctx context.Context, input *sfn.DescribeStateMachineInput) (*sfn.DescribeStateMachineOutput, error)
	UpdateStateMachine(ctx context.Context, input *sfn.UpdateStateMachineInput) (*sfn.UpdateStateMachineOutput, error)
	DeleteStateMachine(ctx context.Context, input *sfn.DeleteStateMachineInput) (*sfn.DeleteStateMachineOutput, error)
	StartExecution(ctx context.Context, input *sfn.StartExecutionInput) (*sfn.StartExecutionOutput, error)
	StopExecution(ctx context.Context, input *sfn.StopExecutionInput) (*sfn.StopExecutionOutput, error)
	ListExecutions(ctx context.Context, input *sfn.ListExecutionsInput) (*sfn.ListExecutionsOutput, error)
	DescribeExecution(ctx context.Context, input *sfn.DescribeExecutionInput) (*sfn.DescribeExecutionOutput, error)
	GetExecutionHistory(ctx context.Context, input *sfn.GetExecutionHistoryInput) (*sfn.GetExecutionHistoryOutput, error)
	ListTagsForResource(ctx context.Context, input *sfn.ListTagsForResourceInput) (*sfn.ListTagsForResourceOutput, error)
	TagResource(ctx context.Context, input *sfn.TagResourceInput) (*sfn.TagResourceOutput, error)
	UntagResource(ctx context.Context, input *sfn.UntagResourceInput) (*sfn.UntagResourceOutput, error)
}

type SQSPort interface {
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

type SNSPort interface {
	ListTopics(ctx context.Context, input *sns.ListTopicsInput) (*sns.ListTopicsOutput, error)
	CreateTopic(ctx context.Context, input *sns.CreateTopicInput) (*sns.CreateTopicOutput, error)
	DeleteTopic(ctx context.Context, input *sns.DeleteTopicInput) (*sns.DeleteTopicOutput, error)
	Subscribe(ctx context.Context, input *sns.SubscribeInput) (*sns.SubscribeOutput, error)
	Unsubscribe(ctx context.Context, input *sns.UnsubscribeInput) (*sns.UnsubscribeOutput, error)
	ListSubscriptions(ctx context.Context, input *sns.ListSubscriptionsInput) (*sns.ListSubscriptionsOutput, error)
	ListSubscriptionsByTopic(ctx context.Context, input *sns.ListSubscriptionsByTopicInput) (*sns.ListSubscriptionsByTopicOutput, error)
	Publish(ctx context.Context, input *sns.PublishInput) (*sns.PublishOutput, error)
}

type SESv2Port interface {
	ListEmailIdentities(ctx context.Context, input *sesv2.ListEmailIdentitiesInput) (*sesv2.ListEmailIdentitiesOutput, error)
	GetEmailIdentity(ctx context.Context, input *sesv2.GetEmailIdentityInput) (*sesv2.GetEmailIdentityOutput, error)
	CreateEmailIdentity(ctx context.Context, input *sesv2.CreateEmailIdentityInput) (*sesv2.CreateEmailIdentityOutput, error)
	DeleteEmailIdentity(ctx context.Context, input *sesv2.DeleteEmailIdentityInput) (*sesv2.DeleteEmailIdentityOutput, error)
	SendEmail(ctx context.Context, input *sesv2.SendEmailInput) (*sesv2.SendEmailOutput, error)
	SendBulkEmail(ctx context.Context, input *sesv2.SendBulkEmailInput) (*sesv2.SendBulkEmailOutput, error)
	ListEmailTemplates(ctx context.Context, input *sesv2.ListEmailTemplatesInput) (*sesv2.ListEmailTemplatesOutput, error)
	GetEmailTemplate(ctx context.Context, input *sesv2.GetEmailTemplateInput) (*sesv2.GetEmailTemplateOutput, error)
	CreateEmailTemplate(ctx context.Context, input *sesv2.CreateEmailTemplateInput) (*sesv2.CreateEmailTemplateOutput, error)
	UpdateEmailTemplate(ctx context.Context, input *sesv2.UpdateEmailTemplateInput) (*sesv2.UpdateEmailTemplateOutput, error)
	DeleteEmailTemplate(ctx context.Context, input *sesv2.DeleteEmailTemplateInput) (*sesv2.DeleteEmailTemplateOutput, error)
	GetAccount(ctx context.Context, input *sesv2.GetAccountInput) (*sesv2.GetAccountOutput, error)
	PutAccountSuppressionAttributes(ctx context.Context, input *sesv2.PutAccountSuppressionAttributesInput) (*sesv2.PutAccountSuppressionAttributesOutput, error)
	ListSuppressedDestinations(ctx context.Context, input *sesv2.ListSuppressedDestinationsInput) (*sesv2.ListSuppressedDestinationsOutput, error)
	ListContactLists(ctx context.Context, input *sesv2.ListContactListsInput) (*sesv2.ListContactListsOutput, error)
	CreateContactList(ctx context.Context, input *sesv2.CreateContactListInput) (*sesv2.CreateContactListOutput, error)
	DeleteContactList(ctx context.Context, input *sesv2.DeleteContactListInput) (*sesv2.DeleteContactListOutput, error)
	ListCustomVerificationEmailTemplates(ctx context.Context, input *sesv2.ListCustomVerificationEmailTemplatesInput) (*sesv2.ListCustomVerificationEmailTemplatesOutput, error)
}

type KMSPort interface {
	ListKeys(ctx context.Context, input *kms.ListKeysInput) (*kms.ListKeysOutput, error)
	CreateKey(ctx context.Context, input *kms.CreateKeyInput) (*kms.CreateKeyOutput, error)
	DeleteAlias(ctx context.Context, input *kms.DeleteAliasInput) (*kms.DeleteAliasOutput, error)
	DescribeKey(ctx context.Context, input *kms.DescribeKeyInput) (*kms.DescribeKeyOutput, error)
	Encrypt(ctx context.Context, input *kms.EncryptInput) (*kms.EncryptOutput, error)
	Decrypt(ctx context.Context, input *kms.DecryptInput) (*kms.DecryptOutput, error)
	GenerateDataKey(ctx context.Context, input *kms.GenerateDataKeyInput) (*kms.GenerateDataKeyOutput, error)
	GenerateRandom(ctx context.Context, input *kms.GenerateRandomInput) (*kms.GenerateRandomOutput, error)
	GetKeyPolicy(ctx context.Context, input *kms.GetKeyPolicyInput) (*kms.GetKeyPolicyOutput, error)
	EnableKey(ctx context.Context, input *kms.EnableKeyInput) (*kms.EnableKeyOutput, error)
	DisableKey(ctx context.Context, input *kms.DisableKeyInput) (*kms.DisableKeyOutput, error)
	ScheduleKeyDeletion(ctx context.Context, input *kms.ScheduleKeyDeletionInput) (*kms.ScheduleKeyDeletionOutput, error)
}

type DynamoDBPort interface {
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

type DynamoDBStreamsPort interface {
	ListStreams(ctx context.Context, input *dynamodbstreams.ListStreamsInput) (*dynamodbstreams.ListStreamsOutput, error)
	DescribeStream(ctx context.Context, input *dynamodbstreams.DescribeStreamInput) (*dynamodbstreams.DescribeStreamOutput, error)
	GetShardIterator(ctx context.Context, input *dynamodbstreams.GetShardIteratorInput) (*dynamodbstreams.GetShardIteratorOutput, error)
	GetRecords(ctx context.Context, input *dynamodbstreams.GetRecordsInput) (*dynamodbstreams.GetRecordsOutput, error)
}

type APIGatewayPort interface {
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
	GetDeployments(ctx context.Context, input *apigateway.GetDeploymentsInput) (*apigateway.GetDeploymentsOutput, error)
	CreateStage(ctx context.Context, input *apigateway.CreateStageInput) (*apigateway.CreateStageOutput, error)
	GetStages(ctx context.Context, input *apigateway.GetStagesInput) (*apigateway.GetStagesOutput, error)
	UpdateStage(ctx context.Context, input *apigateway.UpdateStageInput) (*apigateway.UpdateStageOutput, error)
	DeleteStage(ctx context.Context, input *apigateway.DeleteStageInput) (*apigateway.DeleteStageOutput, error)
	GetInvokeUrl(ctx context.Context, apiId, stageName string) (string, error)
}

type APIGatewayV2Port interface {
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
	// Stages
	GetStages(ctx context.Context, input *apigatewayv2.GetStagesInput) (*apigatewayv2.GetStagesOutput, error)
	GetStage(ctx context.Context, input *apigatewayv2.GetStageInput) (*apigatewayv2.GetStageOutput, error)
	CreateStage(ctx context.Context, input *apigatewayv2.CreateStageInput) (*apigatewayv2.CreateStageOutput, error)
	UpdateStage(ctx context.Context, input *apigatewayv2.UpdateStageInput) (*apigatewayv2.UpdateStageOutput, error)
	DeleteStage(ctx context.Context, input *apigatewayv2.DeleteStageInput) (*apigatewayv2.DeleteStageOutput, error)
	GetInvokeUrl(ctx context.Context, apiId, stageName, protocolType string) (string, error)
}

type SSMPort interface {
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

type IAMPort interface {
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
	CreatePolicy(ctx context.Context, input *iam.CreatePolicyInput) (*iam.CreatePolicyOutput, error)
	DeletePolicy(ctx context.Context, input *iam.DeletePolicyInput) (*iam.DeletePolicyOutput, error)
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

type KinesisPort interface {
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

type RDSPort interface {
	DescribeDBInstances(ctx context.Context, input *rds.DescribeDBInstancesInput) (*rds.DescribeDBInstancesOutput, error)
	CreateDBInstance(ctx context.Context, input *rds.CreateDBInstanceInput) (*rds.CreateDBInstanceOutput, error)
	DeleteDBInstance(ctx context.Context, input *rds.DeleteDBInstanceInput) (*rds.DeleteDBInstanceOutput, error)
	DescribeDBEngineVersions(ctx context.Context, input *rds.DescribeDBEngineVersionsInput) (*rds.DescribeDBEngineVersionsOutput, error)
	ModifyDBInstance(ctx context.Context, input *rds.ModifyDBInstanceInput) (*rds.ModifyDBInstanceOutput, error)
	RebootDBInstance(ctx context.Context, input *rds.RebootDBInstanceInput) (*rds.RebootDBInstanceOutput, error)
}

type MSKPort interface {
	ListClustersV2(ctx context.Context, input *kafka.ListClustersV2Input) (*kafka.ListClustersV2Output, error)
	DescribeClusterV2(ctx context.Context, input *kafka.DescribeClusterV2Input) (*kafka.DescribeClusterV2Output, error)
	CreateClusterV2(ctx context.Context, input *kafka.CreateClusterV2Input) (*kafka.CreateClusterV2Output, error)
	DeleteCluster(ctx context.Context, input *kafka.DeleteClusterInput) (*kafka.DeleteClusterOutput, error)
	GetBootstrapBrokers(ctx context.Context, input *kafka.GetBootstrapBrokersInput) (*kafka.GetBootstrapBrokersOutput, error)
}

type ElastiCachePort interface {
	DescribeReplicationGroups(ctx context.Context, input *elasticache.DescribeReplicationGroupsInput) (*elasticache.DescribeReplicationGroupsOutput, error)
	CreateReplicationGroup(ctx context.Context, input *elasticache.CreateReplicationGroupInput) (*elasticache.CreateReplicationGroupOutput, error)
	DeleteReplicationGroup(ctx context.Context, input *elasticache.DeleteReplicationGroupInput) (*elasticache.DeleteReplicationGroupOutput, error)
}

type OpenSearchPort interface {
	ListDomainNames(ctx context.Context, input *opensearch.ListDomainNamesInput) (*opensearch.ListDomainNamesOutput, error)
	DescribeDomain(ctx context.Context, input *opensearch.DescribeDomainInput) (*opensearch.DescribeDomainOutput, error)
	CreateDomain(ctx context.Context, input *opensearch.CreateDomainInput) (*opensearch.CreateDomainOutput, error)
	DeleteDomain(ctx context.Context, input *opensearch.DeleteDomainInput) (*opensearch.DeleteDomainOutput, error)
	UpdateDomainConfig(ctx context.Context, input *opensearch.UpdateDomainConfigInput) (*opensearch.UpdateDomainConfigOutput, error)
	DescribeDomainConfig(ctx context.Context, input *opensearch.DescribeDomainConfigInput) (*opensearch.DescribeDomainConfigOutput, error)
	ListTags(ctx context.Context, input *opensearch.ListTagsInput) (*opensearch.ListTagsOutput, error)
	AddTags(ctx context.Context, input *opensearch.AddTagsInput) (*opensearch.AddTagsOutput, error)
	RemoveTags(ctx context.Context, input *opensearch.RemoveTagsInput) (*opensearch.RemoveTagsOutput, error)
	GetCompatibleVersions(ctx context.Context, input *opensearch.GetCompatibleVersionsInput) (*opensearch.GetCompatibleVersionsOutput, error)
}

type CloudFormationPort interface {
	ListStacks(ctx context.Context, input *cloudformation.ListStacksInput) (*cloudformation.ListStacksOutput, error)
	CreateStack(ctx context.Context, input *cloudformation.CreateStackInput) (*cloudformation.CreateStackOutput, error)
	DeleteStack(ctx context.Context, input *cloudformation.DeleteStackInput) (*cloudformation.DeleteStackOutput, error)
	DescribeStacks(ctx context.Context, input *cloudformation.DescribeStacksInput) (*cloudformation.DescribeStacksOutput, error)
	GetTemplate(ctx context.Context, input *cloudformation.GetTemplateInput) (*cloudformation.GetTemplateOutput, error)
	ListStackResources(ctx context.Context, input *cloudformation.ListStackResourcesInput) (*cloudformation.ListStackResourcesOutput, error)
}

type CloudWatchPort interface {
	DescribeAlarms(ctx context.Context, input *cloudwatch.DescribeAlarmsInput) (*cloudwatch.DescribeAlarmsOutput, error)
	PutMetricAlarm(ctx context.Context, input *cloudwatch.PutMetricAlarmInput) (*cloudwatch.PutMetricAlarmOutput, error)
	DeleteAlarms(ctx context.Context, input *cloudwatch.DeleteAlarmsInput) (*cloudwatch.DeleteAlarmsOutput, error)
	SetAlarmState(ctx context.Context, input *cloudwatch.SetAlarmStateInput) (*cloudwatch.SetAlarmStateOutput, error)
	DescribeAlarmHistory(ctx context.Context, input *cloudwatch.DescribeAlarmHistoryInput) (*cloudwatch.DescribeAlarmHistoryOutput, error)
	ListMetrics(ctx context.Context, input *cloudwatch.ListMetricsInput) (*cloudwatch.ListMetricsOutput, error)
	GetMetricData(ctx context.Context, input *cloudwatch.GetMetricDataInput) (*cloudwatch.GetMetricDataOutput, error)
	GetMetricStatistics(ctx context.Context, input *cloudwatch.GetMetricStatisticsInput) (*cloudwatch.GetMetricStatisticsOutput, error)
	PutMetricData(ctx context.Context, input *cloudwatch.PutMetricDataInput) (*cloudwatch.PutMetricDataOutput, error)
}

type CloudWatchLogsPort interface {
	DescribeLogGroups(ctx context.Context, input *cloudwatchlogs.DescribeLogGroupsInput) (*cloudwatchlogs.DescribeLogGroupsOutput, error)
	CreateLogGroup(ctx context.Context, input *cloudwatchlogs.CreateLogGroupInput) (*cloudwatchlogs.CreateLogGroupOutput, error)
	DeleteLogGroup(ctx context.Context, input *cloudwatchlogs.DeleteLogGroupInput) (*cloudwatchlogs.DeleteLogGroupOutput, error)
	DescribeLogStreams(ctx context.Context, input *cloudwatchlogs.DescribeLogStreamsInput) (*cloudwatchlogs.DescribeLogStreamsOutput, error)
	CreateLogStream(ctx context.Context, input *cloudwatchlogs.CreateLogStreamInput) (*cloudwatchlogs.CreateLogStreamOutput, error)
	PutLogEvents(ctx context.Context, input *cloudwatchlogs.PutLogEventsInput) (*cloudwatchlogs.PutLogEventsOutput, error)
	GetLogEvents(ctx context.Context, input *cloudwatchlogs.GetLogEventsInput) (*cloudwatchlogs.GetLogEventsOutput, error)
	PutRetentionPolicy(ctx context.Context, input *cloudwatchlogs.PutRetentionPolicyInput) (*cloudwatchlogs.PutRetentionPolicyOutput, error)
	PutMetricFilter(ctx context.Context, input *cloudwatchlogs.PutMetricFilterInput) (*cloudwatchlogs.PutMetricFilterOutput, error)
	DescribeMetricFilters(ctx context.Context, input *cloudwatchlogs.DescribeMetricFiltersInput) (*cloudwatchlogs.DescribeMetricFiltersOutput, error)
}

type ConfigPort interface {
	GetConfigs() *configloader.Config
	LoadConfig(ctx context.Context) (ConfigPort, error)
	SetDefaults() config.ConfigMap
}
