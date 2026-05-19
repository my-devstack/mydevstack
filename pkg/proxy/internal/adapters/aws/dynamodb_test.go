package aws

import (
	"context"
	"errors"
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

// --- Error tests for existing methods ---

func TestDynamoDBAdapter_ListTables_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.ListTablesInput{}
	mockClient.EXPECT().ListTables(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.ListTables(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_CreateTable_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.CreateTableInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().CreateTable(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.CreateTable(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_DescribeTable_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.DescribeTableInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().DescribeTable(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.DescribeTable(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_DeleteTable_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.DeleteTableInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().DeleteTable(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.DeleteTable(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_PutItem_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.PutItemInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().PutItem(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.PutItem(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_GetItem_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.GetItemInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().GetItem(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.GetItem(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_DeleteItem_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.DeleteItemInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().DeleteItem(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.DeleteItem(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_Query_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.QueryInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().Query(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.Query(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_Scan_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.ScanInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().Scan(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.Scan(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// --- New uncovered methods: success + error ---

func TestDynamoDBAdapter_UpdateTable(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.UpdateTableInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.UpdateTableOutput{}

	mockClient.EXPECT().UpdateTable(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.UpdateTable(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_UpdateTable_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.UpdateTableInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().UpdateTable(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.UpdateTable(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_UpdateItem(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.UpdateItemInput{
		TableName: aws.String("test-table"),
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: "test"},
		},
	}
	expectedOutput := &dynamodb.UpdateItemOutput{}

	mockClient.EXPECT().UpdateItem(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.UpdateItem(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_UpdateItem_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.UpdateItemInput{
		TableName: aws.String("test-table"),
		Key: map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: "test"},
		},
	}
	mockClient.EXPECT().UpdateItem(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.UpdateItem(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_BatchWriteItem(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			"test-table": {
				{
					PutRequest: &types.PutRequest{
						Item: map[string]types.AttributeValue{
							"pk": &types.AttributeValueMemberS{Value: "test"},
						},
					},
				},
			},
		},
	}
	expectedOutput := &dynamodb.BatchWriteItemOutput{}

	mockClient.EXPECT().BatchWriteItem(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.BatchWriteItem(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_BatchWriteItem_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]types.WriteRequest{
			"test-table": {
				{
					PutRequest: &types.PutRequest{
						Item: map[string]types.AttributeValue{
							"pk": &types.AttributeValueMemberS{Value: "test"},
						},
					},
				},
			},
		},
	}
	mockClient.EXPECT().BatchWriteItem(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.BatchWriteItem(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_BatchGetItem(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.BatchGetItemInput{
		RequestItems: map[string]types.KeysAndAttributes{
			"test-table": {
				Keys: []map[string]types.AttributeValue{
					{"pk": &types.AttributeValueMemberS{Value: "test"}},
				},
			},
		},
	}
	expectedOutput := &dynamodb.BatchGetItemOutput{}

	mockClient.EXPECT().BatchGetItem(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.BatchGetItem(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_BatchGetItem_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.BatchGetItemInput{
		RequestItems: map[string]types.KeysAndAttributes{
			"test-table": {
				Keys: []map[string]types.AttributeValue{
					{"pk": &types.AttributeValueMemberS{Value: "test"}},
				},
			},
		},
	}
	mockClient.EXPECT().BatchGetItem(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.BatchGetItem(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_DescribeTimeToLive(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.DescribeTimeToLiveInput{TableName: aws.String("test-table")}
	expectedOutput := &dynamodb.DescribeTimeToLiveOutput{}

	mockClient.EXPECT().DescribeTimeToLive(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.DescribeTimeToLive(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_DescribeTimeToLive_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.DescribeTimeToLiveInput{TableName: aws.String("test-table")}
	mockClient.EXPECT().DescribeTimeToLive(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.DescribeTimeToLive(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

func TestDynamoDBAdapter_UpdateTimeToLive(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.UpdateTimeToLiveInput{
		TableName: aws.String("test-table"),
		TimeToLiveSpecification: &types.TimeToLiveSpecification{
			AttributeName: aws.String("ttl"),
			Enabled:       aws.Bool(true),
		},
	}
	expectedOutput := &dynamodb.UpdateTimeToLiveOutput{}

	mockClient.EXPECT().UpdateTimeToLive(ctx, input).Return(expectedOutput, nil)
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.UpdateTimeToLive(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestDynamoDBAdapter_UpdateTimeToLive_Error(t *testing.T) {
	mockClient := ddbmocks.NewDynamoDBClientPort(t)
	ctx := context.Background()
	input := &dynamodb.UpdateTimeToLiveInput{
		TableName: aws.String("test-table"),
		TimeToLiveSpecification: &types.TimeToLiveSpecification{
			AttributeName: aws.String("ttl"),
			Enabled:       aws.Bool(true),
		},
	}
	mockClient.EXPECT().UpdateTimeToLive(ctx, input).Return(nil, errors.New("some error"))
	adapter := &DynamoDBAdapter{client: mockClient}

	output, err := adapter.UpdateTimeToLive(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
