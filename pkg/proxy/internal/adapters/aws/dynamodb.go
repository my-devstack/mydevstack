package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type DynamoDBAdapter struct {
	client ports.DynamoDBClientPort
}

func NewDynamoDBAdapter(awsCfg aws.Config, endpoint string) ports.DynamoDBPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := dynamodb.NewFromConfig(awsCfg, func(o *dynamodb.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &DynamoDBAdapter{client: client}
}

func (a *DynamoDBAdapter) ListTables(ctx context.Context, input *dynamodb.ListTablesInput) (*dynamodb.ListTablesOutput, error) {
	return a.client.ListTables(ctx, input)
}

func (a *DynamoDBAdapter) CreateTable(ctx context.Context, input *dynamodb.CreateTableInput) (*dynamodb.CreateTableOutput, error) {
	return a.client.CreateTable(ctx, input)
}

func (a *DynamoDBAdapter) DescribeTable(ctx context.Context, input *dynamodb.DescribeTableInput) (*dynamodb.DescribeTableOutput, error) {
	return a.client.DescribeTable(ctx, input)
}

func (a *DynamoDBAdapter) DeleteTable(ctx context.Context, input *dynamodb.DeleteTableInput) (*dynamodb.DeleteTableOutput, error) {
	return a.client.DeleteTable(ctx, input)
}

func (a *DynamoDBAdapter) UpdateTable(ctx context.Context, input *dynamodb.UpdateTableInput) (*dynamodb.UpdateTableOutput, error) {
	return a.client.UpdateTable(ctx, input)
}

func (a *DynamoDBAdapter) PutItem(ctx context.Context, input *dynamodb.PutItemInput) (*dynamodb.PutItemOutput, error) {
	return a.client.PutItem(ctx, input)
}

func (a *DynamoDBAdapter) GetItem(ctx context.Context, input *dynamodb.GetItemInput) (*dynamodb.GetItemOutput, error) {
	return a.client.GetItem(ctx, input)
}

func (a *DynamoDBAdapter) DeleteItem(ctx context.Context, input *dynamodb.DeleteItemInput) (*dynamodb.DeleteItemOutput, error) {
	return a.client.DeleteItem(ctx, input)
}

func (a *DynamoDBAdapter) UpdateItem(ctx context.Context, input *dynamodb.UpdateItemInput) (*dynamodb.UpdateItemOutput, error) {
	return a.client.UpdateItem(ctx, input)
}

func (a *DynamoDBAdapter) Query(ctx context.Context, input *dynamodb.QueryInput) (*dynamodb.QueryOutput, error) {
	return a.client.Query(ctx, input)
}

func (a *DynamoDBAdapter) Scan(ctx context.Context, input *dynamodb.ScanInput) (*dynamodb.ScanOutput, error) {
	return a.client.Scan(ctx, input)
}

func (a *DynamoDBAdapter) BatchWriteItem(ctx context.Context, input *dynamodb.BatchWriteItemInput) (*dynamodb.BatchWriteItemOutput, error) {
	return a.client.BatchWriteItem(ctx, input)
}

func (a *DynamoDBAdapter) BatchGetItem(ctx context.Context, input *dynamodb.BatchGetItemInput) (*dynamodb.BatchGetItemOutput, error) {
	return a.client.BatchGetItem(ctx, input)
}

func (a *DynamoDBAdapter) DescribeTimeToLive(ctx context.Context, input *dynamodb.DescribeTimeToLiveInput) (*dynamodb.DescribeTimeToLiveOutput, error) {
	return a.client.DescribeTimeToLive(ctx, input)
}

func (a *DynamoDBAdapter) UpdateTimeToLive(ctx context.Context, input *dynamodb.UpdateTimeToLiveInput) (*dynamodb.UpdateTimeToLiveOutput, error) {
	return a.client.UpdateTimeToLive(ctx, input)
}
