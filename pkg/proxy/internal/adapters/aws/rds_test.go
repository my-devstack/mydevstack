package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/rds/types"
	rdsmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewRDSAdapter(t *testing.T) {
	adapter := NewRDSAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &RDSAdapter{}, adapter)
}

func TestRDSAdapter_DescribeDBInstances(t *testing.T) {
	mockClient := rdsmocks.NewRDSClientPort(t)
	ctx := context.Background()
	input := &rds.DescribeDBInstancesInput{}
	expectedOutput := &rds.DescribeDBInstancesOutput{DBInstances: []types.DBInstance{{DBInstanceIdentifier: aws.String("test-db"), DBInstanceClass: aws.String("db.t3.micro")}}}

	mockClient.EXPECT().DescribeDBInstances(ctx, input).Return(expectedOutput, nil)
	adapter := &RDSAdapter{client: mockClient}

	output, err := adapter.DescribeDBInstances(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestRDSAdapter_CreateDBInstance(t *testing.T) {
	mockClient := rdsmocks.NewRDSClientPort(t)
	ctx := context.Background()
	input := &rds.CreateDBInstanceInput{DBInstanceIdentifier: aws.String("test-db"), Engine: aws.String("postgres")}
	expectedOutput := &rds.CreateDBInstanceOutput{DBInstance: &types.DBInstance{DBInstanceIdentifier: aws.String("test-db")}}

	mockClient.EXPECT().CreateDBInstance(ctx, input).Return(expectedOutput, nil)
	adapter := &RDSAdapter{client: mockClient}

	output, err := adapter.CreateDBInstance(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestRDSAdapter_DeleteDBInstance(t *testing.T) {
	mockClient := rdsmocks.NewRDSClientPort(t)
	ctx := context.Background()
	input := &rds.DeleteDBInstanceInput{DBInstanceIdentifier: aws.String("test-db")}
	expectedOutput := &rds.DeleteDBInstanceOutput{DBInstance: &types.DBInstance{DBInstanceIdentifier: aws.String("test-db")}}

	mockClient.EXPECT().DeleteDBInstance(ctx, input).Return(expectedOutput, nil)
	adapter := &RDSAdapter{client: mockClient}

	output, err := adapter.DeleteDBInstance(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestRDSAdapter_DescribeDBEngineVersions(t *testing.T) {
	mockClient := rdsmocks.NewRDSClientPort(t)
	ctx := context.Background()
	input := &rds.DescribeDBEngineVersionsInput{Engine: aws.String("postgres")}
	expectedOutput := &rds.DescribeDBEngineVersionsOutput{DBEngineVersions: []types.DBEngineVersion{{Engine: aws.String("postgres"), EngineVersion: aws.String("14.5")}}}

	mockClient.EXPECT().DescribeDBEngineVersions(ctx, input).Return(expectedOutput, nil)
	adapter := &RDSAdapter{client: mockClient}

	output, err := adapter.DescribeDBEngineVersions(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestRDSAdapter_ModifyDBInstance(t *testing.T) {
	mockClient := rdsmocks.NewRDSClientPort(t)
	ctx := context.Background()
	input := &rds.ModifyDBInstanceInput{DBInstanceIdentifier: aws.String("test-db"), ApplyImmediately: aws.Bool(true)}
	expectedOutput := &rds.ModifyDBInstanceOutput{DBInstance: &types.DBInstance{DBInstanceIdentifier: aws.String("test-db")}}

	mockClient.EXPECT().ModifyDBInstance(ctx, input).Return(expectedOutput, nil)
	adapter := &RDSAdapter{client: mockClient}

	output, err := adapter.ModifyDBInstance(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestRDSAdapter_RebootDBInstance(t *testing.T) {
	mockClient := rdsmocks.NewRDSClientPort(t)
	ctx := context.Background()
	input := &rds.RebootDBInstanceInput{DBInstanceIdentifier: aws.String("test-db")}
	expectedOutput := &rds.RebootDBInstanceOutput{DBInstance: &types.DBInstance{DBInstanceIdentifier: aws.String("test-db")}}

	mockClient.EXPECT().RebootDBInstance(ctx, input).Return(expectedOutput, nil)
	adapter := &RDSAdapter{client: mockClient}

	output, err := adapter.RebootDBInstance(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
