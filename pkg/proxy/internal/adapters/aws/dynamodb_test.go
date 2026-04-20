package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	ddbmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewDynamoDBAdapter(t *testing.T) {
	adapter := NewDynamoDBAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &DynamoDBAdapter{}, adapter)
}

func TestDynamoDBAdapter_ListTables(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.ListTablesInput{}
	expectedOutput := &dynamodb.ListTablesOutput{TableNames: []string{"test-table"}}

	mockClient.EXPECT().ListTables(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.ListTables(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_CreateTable(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.CreateTableInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.CreateTableOutput{TableDescription: &types.TableDescription{TableName: aws.String("test-table")}}

	mockClient.EXPECT().CreateTable(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.CreateTable(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_DescribeTable(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.DescribeTableInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.DescribeTableOutput{}

	mockClient.EXPECT().DescribeTable(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.DescribeTable(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_DeleteTable(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.DeleteTableInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.DeleteTableOutput{}

	mockClient.EXPECT().DeleteTable(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.DeleteTable(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_PutItem(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.PutItemInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.PutItemOutput{}

	mockClient.EXPECT().PutItem(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.PutItem(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_GetItem(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.GetItemInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.GetItemOutput{}

	mockClient.EXPECT().GetItem(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.GetItem(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_DeleteItem(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.DeleteItemInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.DeleteItemOutput{}

	mockClient.EXPECT().DeleteItem(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.DeleteItem(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_Query(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.QueryInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.QueryOutput{}

	mockClient.EXPECT().Query(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.Query(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_Scan(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.ScanInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.ScanOutput{}

	mockClient.EXPECT().Scan(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.Scan(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
