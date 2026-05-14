package aws

import (
	"context"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/opensearch"
	osmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewOpenSearchAdapter(t *testing.T) {
	adapter := NewOpenSearchAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &OpenSearchAdapter{}, adapter)
}

func TestOpenSearchAdapter_ListDomainNames(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.ListDomainNamesInput{}
	expectedOutput := &opensearch.ListDomainNamesOutput{}

	mockClient.EXPECT().ListDomainNames(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.ListDomainNames(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestOpenSearchAdapter_DescribeDomain(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.DescribeDomainInput{DomainName: aws.String("test-domain")}
	expectedOutput := &opensearch.DescribeDomainOutput{}

	mockClient.EXPECT().DescribeDomain(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.DescribeDomain(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestOpenSearchAdapter_CreateDomain(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.CreateDomainInput{DomainName: aws.String("test-domain")}
	expectedOutput := &opensearch.CreateDomainOutput{}

	mockClient.EXPECT().CreateDomain(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.CreateDomain(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestOpenSearchAdapter_DeleteDomain(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.DeleteDomainInput{DomainName: aws.String("test-domain")}
	expectedOutput := &opensearch.DeleteDomainOutput{}

	mockClient.EXPECT().DeleteDomain(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.DeleteDomain(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestOpenSearchAdapter_UpdateDomainConfig(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.UpdateDomainConfigInput{DomainName: aws.String("test-domain")}
	expectedOutput := &opensearch.UpdateDomainConfigOutput{}

	mockClient.EXPECT().UpdateDomainConfig(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.UpdateDomainConfig(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestOpenSearchAdapter_DescribeDomainConfig(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.DescribeDomainConfigInput{DomainName: aws.String("test-domain")}
	expectedOutput := &opensearch.DescribeDomainConfigOutput{}

	mockClient.EXPECT().DescribeDomainConfig(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.DescribeDomainConfig(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestOpenSearchAdapter_ListTags(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.ListTagsInput{ARN: aws.String("arn:aws:es:us-east-1:123456789012:domain/test-domain")}
	expectedOutput := &opensearch.ListTagsOutput{}

	mockClient.EXPECT().ListTags(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.ListTags(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestOpenSearchAdapter_AddTags(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.AddTagsInput{ARN: aws.String("arn:aws:es:us-east-1:123456789012:domain/test-domain")}
	expectedOutput := &opensearch.AddTagsOutput{}

	mockClient.EXPECT().AddTags(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.AddTags(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestOpenSearchAdapter_GetCompatibleVersions(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.GetCompatibleVersionsInput{}
	expectedOutput := &opensearch.GetCompatibleVersionsOutput{}

	mockClient.EXPECT().GetCompatibleVersions(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.GetCompatibleVersions(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestOpenSearchAdapter_RemoveTags(t *testing.T) {
	mockClient := osmocks.NewOpenSearchClientPort(t)
	ctx := context.Background()
	input := &opensearch.RemoveTagsInput{ARN: aws.String("arn:aws:es:us-east-1:123456789012:domain/test-domain")}
	expectedOutput := &opensearch.RemoveTagsOutput{}

	mockClient.EXPECT().RemoveTags(ctx, input).Return(expectedOutput, nil)
	adapter := &OpenSearchAdapter{client: mockClient}

	output, err := adapter.RemoveTags(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}
