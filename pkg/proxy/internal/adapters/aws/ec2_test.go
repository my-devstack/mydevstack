package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	ec2mocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewEC2Adapter(t *testing.T) {
	adapter := NewEC2Adapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &EC2Adapter{}, adapter)
}

// ---------------------------------------------------------------------------
// DescribeInstances
// ---------------------------------------------------------------------------

func TestEC2Adapter_DescribeInstances(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeInstancesInput{}
	expectedOutput := &ec2.DescribeInstancesOutput{
		Reservations: []types.Reservation{
			{Instances: []types.Instance{{InstanceId: aws.String("i-123")}}},
		},
	}

	mockClient.EXPECT().DescribeInstances(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeInstances(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_DescribeInstances_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeInstancesInput{}
	mockClient.EXPECT().DescribeInstances(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeInstances(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// RunInstances
// ---------------------------------------------------------------------------

func TestEC2Adapter_RunInstances(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.RunInstancesInput{ImageId: aws.String("ami-123"), MaxCount: aws.Int32(1), MinCount: aws.Int32(1)}
	expectedOutput := &ec2.RunInstancesOutput{Instances: []types.Instance{{InstanceId: aws.String("i-123")}}}

	mockClient.EXPECT().RunInstances(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.RunInstances(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_RunInstances_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.RunInstancesInput{}
	mockClient.EXPECT().RunInstances(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.RunInstances(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// TerminateInstances
// ---------------------------------------------------------------------------

func TestEC2Adapter_TerminateInstances(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.TerminateInstancesInput{InstanceIds: []string{"i-123"}}
	expectedOutput := &ec2.TerminateInstancesOutput{TerminatingInstances: []types.InstanceStateChange{{InstanceId: aws.String("i-123")}}}

	mockClient.EXPECT().TerminateInstances(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.TerminateInstances(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_TerminateInstances_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.TerminateInstancesInput{}
	mockClient.EXPECT().TerminateInstances(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.TerminateInstances(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// StartInstances
// ---------------------------------------------------------------------------

func TestEC2Adapter_StartInstances(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.StartInstancesInput{InstanceIds: []string{"i-123"}}
	expectedOutput := &ec2.StartInstancesOutput{StartingInstances: []types.InstanceStateChange{{InstanceId: aws.String("i-123")}}}

	mockClient.EXPECT().StartInstances(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.StartInstances(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_StartInstances_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.StartInstancesInput{}
	mockClient.EXPECT().StartInstances(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.StartInstances(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// StopInstances
// ---------------------------------------------------------------------------

func TestEC2Adapter_StopInstances(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.StopInstancesInput{InstanceIds: []string{"i-123"}}
	expectedOutput := &ec2.StopInstancesOutput{StoppingInstances: []types.InstanceStateChange{{InstanceId: aws.String("i-123")}}}

	mockClient.EXPECT().StopInstances(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.StopInstances(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_StopInstances_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.StopInstancesInput{}
	mockClient.EXPECT().StopInstances(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.StopInstances(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeKeyPairs
// ---------------------------------------------------------------------------

func TestEC2Adapter_DescribeKeyPairs(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeKeyPairsInput{}
	expectedOutput := &ec2.DescribeKeyPairsOutput{
		KeyPairs: []types.KeyPairInfo{{KeyName: aws.String("test-key")}},
	}

	mockClient.EXPECT().DescribeKeyPairs(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeKeyPairs(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_DescribeKeyPairs_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeKeyPairsInput{}
	mockClient.EXPECT().DescribeKeyPairs(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeKeyPairs(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateKeyPair
// ---------------------------------------------------------------------------

func TestEC2Adapter_CreateKeyPair(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateKeyPairInput{KeyName: aws.String("test-key")}
	expectedOutput := &ec2.CreateKeyPairOutput{
		KeyName:        aws.String("test-key"),
		KeyFingerprint: aws.String("fp:123"),
		KeyMaterial:    aws.String("-----BEGIN RSA PRIVATE KEY-----\n..."),
	}

	mockClient.EXPECT().CreateKeyPair(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.CreateKeyPair(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_CreateKeyPair_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateKeyPairInput{}
	mockClient.EXPECT().CreateKeyPair(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.CreateKeyPair(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// ImportKeyPair
// ---------------------------------------------------------------------------

func TestEC2Adapter_ImportKeyPair(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.ImportKeyPairInput{KeyName: aws.String("test-key"), PublicKeyMaterial: []byte("ssh-rsa AAA...")}
	expectedOutput := &ec2.ImportKeyPairOutput{
		KeyName:        aws.String("test-key"),
		KeyFingerprint: aws.String("fp:123"),
	}

	mockClient.EXPECT().ImportKeyPair(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.ImportKeyPair(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_ImportKeyPair_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.ImportKeyPairInput{}
	mockClient.EXPECT().ImportKeyPair(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.ImportKeyPair(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteKeyPair
// ---------------------------------------------------------------------------

func TestEC2Adapter_DeleteKeyPair(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteKeyPairInput{KeyName: aws.String("test-key")}
	expectedOutput := &ec2.DeleteKeyPairOutput{}

	mockClient.EXPECT().DeleteKeyPair(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DeleteKeyPair(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_DeleteKeyPair_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteKeyPairInput{}
	mockClient.EXPECT().DeleteKeyPair(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DeleteKeyPair(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeSecurityGroups
// ---------------------------------------------------------------------------

func TestEC2Adapter_DescribeSecurityGroups(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeSecurityGroupsInput{}
	expectedOutput := &ec2.DescribeSecurityGroupsOutput{
		SecurityGroups: []types.SecurityGroup{{GroupId: aws.String("sg-123")}},
	}

	mockClient.EXPECT().DescribeSecurityGroups(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeSecurityGroups(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_DescribeSecurityGroups_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeSecurityGroupsInput{}
	mockClient.EXPECT().DescribeSecurityGroups(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeSecurityGroups(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateSecurityGroup
// ---------------------------------------------------------------------------

func TestEC2Adapter_CreateSecurityGroup(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateSecurityGroupInput{
		GroupName:   aws.String("test-sg"),
		Description: aws.String("Test SG"),
	}
	expectedOutput := &ec2.CreateSecurityGroupOutput{GroupId: aws.String("sg-123")}

	mockClient.EXPECT().CreateSecurityGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.CreateSecurityGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_CreateSecurityGroup_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateSecurityGroupInput{}
	mockClient.EXPECT().CreateSecurityGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.CreateSecurityGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteSecurityGroup
// ---------------------------------------------------------------------------

func TestEC2Adapter_DeleteSecurityGroup(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteSecurityGroupInput{GroupId: aws.String("sg-123")}
	expectedOutput := &ec2.DeleteSecurityGroupOutput{}

	mockClient.EXPECT().DeleteSecurityGroup(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DeleteSecurityGroup(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_DeleteSecurityGroup_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteSecurityGroupInput{}
	mockClient.EXPECT().DeleteSecurityGroup(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DeleteSecurityGroup(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// AuthorizeSecurityGroupIngress
// ---------------------------------------------------------------------------

func TestEC2Adapter_AuthorizeSecurityGroupIngress(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.AuthorizeSecurityGroupIngressInput{
		GroupId: aws.String("sg-123"),
		IpPermissions: []types.IpPermission{
			{
				IpProtocol: aws.String("tcp"),
				FromPort:   aws.Int32(22),
				ToPort:     aws.Int32(22),
				IpRanges:   []types.IpRange{{CidrIp: aws.String("0.0.0.0/0")}},
			},
		},
	}
	expectedOutput := &ec2.AuthorizeSecurityGroupIngressOutput{}

	mockClient.EXPECT().AuthorizeSecurityGroupIngress(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.AuthorizeSecurityGroupIngress(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_AuthorizeSecurityGroupIngress_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.AuthorizeSecurityGroupIngressInput{}
	mockClient.EXPECT().AuthorizeSecurityGroupIngress(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.AuthorizeSecurityGroupIngress(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeVpcs
// ---------------------------------------------------------------------------

func TestEC2Adapter_DescribeVpcs(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeVpcsInput{}
	expectedOutput := &ec2.DescribeVpcsOutput{
		Vpcs: []types.Vpc{{VpcId: aws.String("vpc-123")}},
	}

	mockClient.EXPECT().DescribeVpcs(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeVpcs(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_DescribeVpcs_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeVpcsInput{}
	mockClient.EXPECT().DescribeVpcs(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeVpcs(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeSubnets
// ---------------------------------------------------------------------------

func TestEC2Adapter_DescribeSubnets(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeSubnetsInput{}
	expectedOutput := &ec2.DescribeSubnetsOutput{
		Subnets: []types.Subnet{{SubnetId: aws.String("subnet-123")}},
	}

	mockClient.EXPECT().DescribeSubnets(ctx, input).Return(expectedOutput, nil)
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeSubnets(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestEC2Adapter_DescribeSubnets_Error(t *testing.T) {
	mockClient := ec2mocks.NewEC2ClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeSubnetsInput{}
	mockClient.EXPECT().DescribeSubnets(ctx, input).Return(nil, errors.New("some error"))
	adapter := &EC2Adapter{client: mockClient}

	output, err := adapter.DescribeSubnets(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
