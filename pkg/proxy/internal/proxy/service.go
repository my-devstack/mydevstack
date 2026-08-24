package proxy

import (
	"context"
	"sync"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	awsadapter "github.com/my-devstack/mydevstack/pkg/proxy/internal/adapters/aws"
	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type ProxyService struct {
	cfg             *configloader.Config
	region          string
	secretsManager  ports.SecretsManagerPort
	stepfunctions   ports.StepFunctionsPort
	s3              ports.S3Port
	lambda          ports.LambdaPort
	sqs             ports.SQSPort
	sns             ports.SNSPort
	kms             ports.KMSPort
	dynamodb        ports.DynamoDBPort
	dynamodbstreams ports.DynamoDBStreamsPort
	apigateway      ports.APIGatewayPort
	apigatewayv2    ports.APIGatewayV2Port
	ssm             ports.SSMPort
	iam             ports.IAMPort
	kinesis         ports.KinesisPort
	rds             ports.RDSPort
	elasticache     ports.ElastiCachePort
	msk             ports.MSKPort
	opensearch      ports.OpenSearchPort
	cloudformation  ports.CloudFormationPort
	cloudwatch      ports.CloudWatchPort
	cloudwatchlogs  ports.CloudWatchLogsPort
	sesv2           ports.SESv2Port
	ec2             ports.EC2Port
	vpc             ports.VpcPort
	cognito         ports.CognitoPort
	mu              sync.RWMutex
	ctx             context.Context
}

func NewProxyService(cfg *configloader.Config, ctx context.Context) ports.ProxyService {
	// Default region is us-east-1 if not set
	region := "us-east-1"

	return &ProxyService{
		cfg:    cfg,
		region: region,
		ctx:    ctx,
	}
}

func (s *ProxyService) Config() *configloader.Config {
	return s.cfg
}

func (s *ProxyService) Region() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.region
}

func (s *ProxyService) SetRegion(region string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.region = region

	// Recreate all adapters with the new region
	if err := s.SetServices(); err != nil {
		return err
	}
	return nil
}

func (s *ProxyService) SetServices() error {
	awsCfg, err := awsconfig.LoadDefaultConfig(s.ctx,
		awsconfig.WithRegion(s.region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			s.cfg.AWS.AccessKey,
			s.cfg.AWS.SecretKey,
			"",
		)),
	)
	if err != nil {
		return err
	}
	s.secretsManager = awsadapter.NewSecretsManagerAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.stepfunctions = awsadapter.NewStepFunctionsAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.s3 = awsadapter.NewS3Adapter(awsCfg, s.cfg.AWS.Endpoint, s.region)
	s.lambda = awsadapter.NewLambdaAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.sqs = awsadapter.NewSQSAdapter(awsCfg, s.cfg.AWS.Endpoint, s.cfg.Emulator)
	s.sns = awsadapter.NewSNSAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.kms = awsadapter.NewKMSAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.dynamodb = awsadapter.NewDynamoDBAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.dynamodbstreams = awsadapter.NewDynamoDBStreamsAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.apigateway = awsadapter.NewAPIGatewayAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.apigatewayv2 = awsadapter.NewAPIGatewayV2Adapter(awsCfg, s.cfg.AWS.Endpoint)
	s.ssm = awsadapter.NewSSMAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.iam = awsadapter.NewIAMAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.kinesis = awsadapter.NewKinesisAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.rds = awsadapter.NewRDSAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.elasticache = awsadapter.NewElastiCacheAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.msk = awsadapter.NewMSKAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.opensearch = awsadapter.NewOpenSearchAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.cloudformation = awsadapter.NewCloudFormationAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.cloudwatch = awsadapter.NewCloudWatchAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.cloudwatchlogs = awsadapter.NewCloudWatchLogsAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.sesv2 = awsadapter.NewSESv2Adapter(awsCfg, s.cfg.AWS.Endpoint)
	s.ec2 = awsadapter.NewEC2Adapter(awsCfg, s.cfg.AWS.Endpoint)
	s.vpc = awsadapter.NewVpcAdapter(awsCfg, s.cfg.AWS.Endpoint)
	s.cognito = awsadapter.NewCognitoAdapter(awsCfg, s.cfg.AWS.Endpoint)
	return nil
}

func (s *ProxyService) SecretsManager() ports.SecretsManagerPort {
	return s.secretsManager
}

func (s *ProxyService) StepFunctions() ports.StepFunctionsPort {
	return s.stepfunctions
}

func (s *ProxyService) S3() ports.S3Port {
	return s.s3
}

func (s *ProxyService) Lambda() ports.LambdaPort {
	return s.lambda
}

func (s *ProxyService) SQS() ports.SQSPort {
	return s.sqs
}

func (s *ProxyService) SNS() ports.SNSPort {
	return s.sns
}

func (s *ProxyService) KMS() ports.KMSPort {
	return s.kms
}

func (s *ProxyService) DynamoDB() ports.DynamoDBPort {
	return s.dynamodb
}

func (s *ProxyService) DynamoDBStreams() ports.DynamoDBStreamsPort {
	return s.dynamodbstreams
}

func (s *ProxyService) APIGateway() ports.APIGatewayPort {
	return s.apigateway
}

func (s *ProxyService) APIGatewayV2() ports.APIGatewayV2Port {
	return s.apigatewayv2
}

func (s *ProxyService) SSM() ports.SSMPort {
	return s.ssm
}

func (s *ProxyService) IAM() ports.IAMPort {
	return s.iam
}

func (s *ProxyService) Kinesis() ports.KinesisPort {
	return s.kinesis
}

func (s *ProxyService) RDS() ports.RDSPort {
	return s.rds
}

func (s *ProxyService) ElastiCache() ports.ElastiCachePort {
	return s.elasticache
}

func (s *ProxyService) MSK() ports.MSKPort {
	return s.msk
}

func (s *ProxyService) OpenSearch() ports.OpenSearchPort {
	return s.opensearch
}

func (s *ProxyService) CloudFormation() ports.CloudFormationPort {
	return s.cloudformation
}

func (s *ProxyService) SESv2() ports.SESv2Port {
	return s.sesv2
}

func (s *ProxyService) EC2() ports.EC2Port {
	return s.ec2
}

func (s *ProxyService) Vpc() ports.VpcPort {
	return s.vpc
}

func (s *ProxyService) CloudWatch() ports.CloudWatchPort {
	return s.cloudwatch
}

func (s *ProxyService) CloudWatchLogs() ports.CloudWatchLogsPort {
	return s.cloudwatchlogs
}

func (s *ProxyService) Cognito() ports.CognitoPort {
	return s.cognito
}
