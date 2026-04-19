package application

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
	cfg            *configloader.Config
	region         string
	secretsManager ports.SecretsManagerPort
	s3             ports.S3Port
	lambda         ports.LambdaPort
	sqs            ports.SQSPort
	sns            ports.SNSPort
	kms            ports.KMSPort
	dynamodb       ports.DynamoDBPort
	apigateway     ports.APIGatewayPort
	apigatewayv2   ports.APIGatewayV2Port
	ssm            ports.SSMPort
	iam            ports.IAMPort
	kinesis        ports.KinesisPort
	rds            ports.RDSPort
	elasticache    ports.ElastiCachePort
	mu             sync.RWMutex
}

func NewProxyService(cfg *configloader.Config) ports.ProxyService {
	// Default region is us-east-1 if not set
	region := "us-east-1"

	return &ProxyService{
		cfg:    cfg,
		region: region,
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
	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithRegion(s.region),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			s.cfg.AwsAccessKey,
			s.cfg.AwsSecretKey,
			"",
		)),
	)
	if err != nil {
		return err
	}
	s.secretsManager = awsadapter.NewSecretsManagerAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.s3 = awsadapter.NewS3Adapter(awsCfg, s.cfg.AwsEndpoint)
	s.lambda = awsadapter.NewLambdaAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.sqs = awsadapter.NewSQSAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.sns = awsadapter.NewSNSAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.kms = awsadapter.NewKMSAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.dynamodb = awsadapter.NewDynamoDBAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.apigateway = awsadapter.NewAPIGatewayAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.apigatewayv2 = awsadapter.NewAPIGatewayV2Adapter(awsCfg, s.cfg.AwsEndpoint)
	s.ssm = awsadapter.NewSSMAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.iam = awsadapter.NewIAMAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.kinesis = awsadapter.NewKinesisAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.rds = awsadapter.NewRDSAdapter(awsCfg, s.cfg.AwsEndpoint)
	s.elasticache = awsadapter.NewElastiCacheAdapter(awsCfg, s.cfg.AwsEndpoint)
	return nil
}

func (s *ProxyService) SecretsManager() ports.SecretsManagerPort {
	return s.secretsManager
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
