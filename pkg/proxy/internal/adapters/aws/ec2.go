package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type EC2Adapter struct {
	client ports.EC2ClientPort
}

func NewEC2Adapter(awsCfg aws.Config, endpoint string) ports.EC2Port {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := ec2.NewFromConfig(awsCfg, func(o *ec2.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &EC2Adapter{client: client}
}

func (a *EC2Adapter) DescribeInstances(ctx context.Context, input *ec2.DescribeInstancesInput) (*ec2.DescribeInstancesOutput, error) {
	return a.client.DescribeInstances(ctx, input)
}

func (a *EC2Adapter) RunInstances(ctx context.Context, input *ec2.RunInstancesInput) (*ec2.RunInstancesOutput, error) {
	return a.client.RunInstances(ctx, input)
}

func (a *EC2Adapter) TerminateInstances(ctx context.Context, input *ec2.TerminateInstancesInput) (*ec2.TerminateInstancesOutput, error) {
	return a.client.TerminateInstances(ctx, input)
}

func (a *EC2Adapter) StartInstances(ctx context.Context, input *ec2.StartInstancesInput) (*ec2.StartInstancesOutput, error) {
	return a.client.StartInstances(ctx, input)
}

func (a *EC2Adapter) StopInstances(ctx context.Context, input *ec2.StopInstancesInput) (*ec2.StopInstancesOutput, error) {
	return a.client.StopInstances(ctx, input)
}

func (a *EC2Adapter) DescribeKeyPairs(ctx context.Context, input *ec2.DescribeKeyPairsInput) (*ec2.DescribeKeyPairsOutput, error) {
	return a.client.DescribeKeyPairs(ctx, input)
}

func (a *EC2Adapter) CreateKeyPair(ctx context.Context, input *ec2.CreateKeyPairInput) (*ec2.CreateKeyPairOutput, error) {
	return a.client.CreateKeyPair(ctx, input)
}

func (a *EC2Adapter) ImportKeyPair(ctx context.Context, input *ec2.ImportKeyPairInput) (*ec2.ImportKeyPairOutput, error) {
	return a.client.ImportKeyPair(ctx, input)
}

func (a *EC2Adapter) DeleteKeyPair(ctx context.Context, input *ec2.DeleteKeyPairInput) (*ec2.DeleteKeyPairOutput, error) {
	return a.client.DeleteKeyPair(ctx, input)
}

func (a *EC2Adapter) DescribeSecurityGroups(ctx context.Context, input *ec2.DescribeSecurityGroupsInput) (*ec2.DescribeSecurityGroupsOutput, error) {
	return a.client.DescribeSecurityGroups(ctx, input)
}

func (a *EC2Adapter) CreateSecurityGroup(ctx context.Context, input *ec2.CreateSecurityGroupInput) (*ec2.CreateSecurityGroupOutput, error) {
	return a.client.CreateSecurityGroup(ctx, input)
}

func (a *EC2Adapter) DeleteSecurityGroup(ctx context.Context, input *ec2.DeleteSecurityGroupInput) (*ec2.DeleteSecurityGroupOutput, error) {
	return a.client.DeleteSecurityGroup(ctx, input)
}

func (a *EC2Adapter) AuthorizeSecurityGroupIngress(ctx context.Context, input *ec2.AuthorizeSecurityGroupIngressInput) (*ec2.AuthorizeSecurityGroupIngressOutput, error) {
	return a.client.AuthorizeSecurityGroupIngress(ctx, input)
}

func (a *EC2Adapter) DescribeVpcs(ctx context.Context, input *ec2.DescribeVpcsInput) (*ec2.DescribeVpcsOutput, error) {
	return a.client.DescribeVpcs(ctx, input)
}

func (a *EC2Adapter) DescribeSubnets(ctx context.Context, input *ec2.DescribeSubnetsInput) (*ec2.DescribeSubnetsOutput, error) {
	return a.client.DescribeSubnets(ctx, input)
}
