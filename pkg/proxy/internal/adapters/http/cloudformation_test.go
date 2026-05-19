package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	cloudformationTypes "github.com/aws/aws-sdk-go-v2/service/cloudformation/types"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func setupCloudFormationTest(t *testing.T) (*mockports.ProxyService, *mockports.CloudFormationPort, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	cf := mockports.NewCloudFormationPort(t)
	svc.EXPECT().CloudFormation().Return(cf).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, cf, handler
}

func performCFRequest(handler *ProxyHandler, target string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, "POST", "/cloudformation/", target, body)
}

func TestCloudFormation_ListStacks(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)

	expected := &cloudformation.ListStacksOutput{
		StackSummaries: []cloudformationTypes.StackSummary{
			{StackId: aws.String("arn:aws:cloudformation:us-east-1:123:stack/test")},
		},
	}
	cf.EXPECT().ListStacks(mock.Anything, mock.Anything).Return(expected, nil)

	w := performCFRequest(handler, "cloudformation.ListStacks", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp cloudformation.ListStacksOutput
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Len(t, resp.StackSummaries, 1)
	assert.Equal(t, "arn:aws:cloudformation:us-east-1:123:stack/test", *resp.StackSummaries[0].StackId)
}

func TestCloudFormation_CreateStack(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)

	expected := &cloudformation.CreateStackOutput{
		StackId: aws.String("arn:aws:cloudformation:us-east-1:123:stack/new"),
	}
	cf.EXPECT().CreateStack(mock.Anything, mock.Anything).Return(expected, nil)

	w := performCFRequest(handler, "cloudformation.CreateStack", []byte(`{"StackName":"test-stack"}`))
	assert.Equal(t, http.StatusCreated, w.Code)

	var resp cloudformation.CreateStackOutput
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "arn:aws:cloudformation:us-east-1:123:stack/new", *resp.StackId)
}

func TestCloudFormation_DeleteStack(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)

	cf.EXPECT().DeleteStack(mock.Anything, mock.Anything).Return(&cloudformation.DeleteStackOutput{}, nil)

	w := performCFRequest(handler, "cloudformation.DeleteStack", []byte(`{"StackName":"test-stack"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestCloudFormation_DescribeStacks(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)

	expected := &cloudformation.DescribeStacksOutput{
		Stacks: []cloudformationTypes.Stack{
			{StackName: aws.String("test-stack")},
		},
	}
	cf.EXPECT().DescribeStacks(mock.Anything, mock.Anything).Return(expected, nil)

	w := performCFRequest(handler, "cloudformation.DescribeStacks", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp cloudformation.DescribeStacksOutput
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Len(t, resp.Stacks, 1)
	assert.Equal(t, "test-stack", *resp.Stacks[0].StackName)
}

func TestCloudFormation_GetTemplate(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)

	expected := &cloudformation.GetTemplateOutput{
		TemplateBody: aws.String("AWSTemplateFormatVersion: '2010-09-09'"),
	}
	cf.EXPECT().GetTemplate(mock.Anything, mock.Anything).Return(expected, nil)

	w := performCFRequest(handler, "cloudformation.GetTemplate", []byte(`{"StackName":"test-stack"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp cloudformation.GetTemplateOutput
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "AWSTemplateFormatVersion: '2010-09-09'", *resp.TemplateBody)
}

func TestCloudFormation_ListStackResources(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)

	expected := &cloudformation.ListStackResourcesOutput{
		StackResourceSummaries: []cloudformationTypes.StackResourceSummary{
			{LogicalResourceId: aws.String("MyBucket")},
		},
	}
	cf.EXPECT().ListStackResources(mock.Anything, mock.Anything).Return(expected, nil)

	w := performCFRequest(handler, "cloudformation.ListStackResources", []byte(`{"StackName":"test-stack"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp cloudformation.ListStackResourcesOutput
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Len(t, resp.StackResourceSummaries, 1)
	assert.Equal(t, "MyBucket", *resp.StackResourceSummaries[0].LogicalResourceId)
}

func TestCloudFormation_UnknownAction(t *testing.T) {
	t.Parallel()
	_, _, handler := setupCloudFormationTest(t)

	w := performCFRequest(handler, "cloudformation.UnknownAction", []byte(`{}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Unknown CloudFormation action")
}

func TestCloudFormation_ServiceError(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)

	cf.EXPECT().ListStacks(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))

	w := performCFRequest(handler, "cloudformation.ListStacks", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to list stacks")
}

func TestCloudFormation_CreateStack_ServiceError(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)
	cf.EXPECT().CreateStack(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))

	w := performCFRequest(handler, "cloudformation.CreateStack", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to create stack")
}

func TestCloudFormation_DeleteStack_ServiceError(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)
	cf.EXPECT().DeleteStack(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))

	w := performCFRequest(handler, "cloudformation.DeleteStack", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to delete stack")
}

func TestCloudFormation_DescribeStacks_ServiceError(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)
	cf.EXPECT().DescribeStacks(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))

	w := performCFRequest(handler, "cloudformation.DescribeStacks", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to describe stacks")
}

func TestCloudFormation_GetTemplate_ServiceError(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)
	cf.EXPECT().GetTemplate(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))

	w := performCFRequest(handler, "cloudformation.GetTemplate", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to get template")
}

func TestCloudFormation_ListStackResources_ServiceError(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)
	cf.EXPECT().ListStackResources(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))

	w := performCFRequest(handler, "cloudformation.ListStackResources", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to list stack resources")
}

// ---------------------------------------------------------------------------
// Parse error tests
// ---------------------------------------------------------------------------

func TestCloudFormation_ParseErrors(t *testing.T) {
	t.Parallel()

	targets := []string{
		"cloudformation.ListStacks",
		"cloudformation.CreateStack",
		"cloudformation.DeleteStack",
		"cloudformation.DescribeStacks",
		"cloudformation.GetTemplate",
		"cloudformation.ListStackResources",
	}

	for _, target := range targets {
		target := target
		t.Run(target, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupCloudFormationTest(t)
			w := performCFRequest(handler, target, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", target, w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}
