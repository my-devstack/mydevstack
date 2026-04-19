package aws

import (
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

var (
	_ ports.S3Port             = (*S3Adapter)(nil)
	_ ports.LambdaPort         = (*LambdaAdapter)(nil)
	_ ports.SecretsManagerPort = (*SecretsManagerAdapter)(nil)
	_ ports.SQSPort            = (*SQSAdapter)(nil)
	_ ports.SNSPort            = (*SNSAdapter)(nil)
	_ ports.KMSPort            = (*KMSAdapter)(nil)
	_ ports.DynamoDBPort       = (*DynamoDBAdapter)(nil)
	_ ports.APIGatewayPort     = (*APIGatewayAdapter)(nil)
	_ ports.APIGatewayV2Port   = (*APIGatewayV2Adapter)(nil)
	_ ports.SSMPort            = (*SSMAdapter)(nil)
	_ ports.IAMPort            = (*IAMAdapter)(nil)
	_ ports.KinesisPort        = (*KinesisAdapter)(nil)
)
