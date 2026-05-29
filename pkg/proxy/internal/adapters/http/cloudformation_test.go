package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
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

func TestCloudFormation_ListStacks(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)

	expected := &cloudformation.ListStacksOutput{
		StackSummaries: []cloudformationTypes.StackSummary{
			{StackId: aws.String("arn:aws:cloudformation:us-east-1:123:stack/test")},
		},
	}
	cf.EXPECT().ListStacks(mock.Anything, mock.Anything).Return(expected, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/cloudformation/stacks", []byte(`{}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/cloudformation/stacks", []byte(`{"StackName":"test-stack"}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "DELETE", "/cloudformation/stacks/teststack", []byte(`{"StackName":"test-stack"}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/cloudformation/stacks/teststack", []byte(`{}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/cloudformation/stacks/teststack/template", []byte(`{"StackName":"test-stack"}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/cloudformation/stacks/teststack/resources", []byte(`{"StackName":"test-stack"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp cloudformation.ListStackResourcesOutput
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Len(t, resp.StackResourceSummaries, 1)
	assert.Equal(t, "MyBucket", *resp.StackResourceSummaries[0].LogicalResourceId)
}

func TestCloudFormation_ServiceError(t *testing.T) {
	t.Parallel()
	_, cf, handler := setupCloudFormationTest(t)

	cf.EXPECT().ListStacks(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/cloudformation/stacks", []byte(`{}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/cloudformation/stacks", []byte(`{}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "DELETE", "/cloudformation/stacks/teststack", []byte(`{}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/cloudformation/stacks/teststack", []byte(`{}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/cloudformation/stacks/teststack/template", []byte(`{}`))
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

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/cloudformation/stacks/teststack/resources", []byte(`{}`))
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

	// Only include actions whose handlers call parseBody.
	// DeleteStack, DescribeStacks, GetTemplate use URL params.
	type parseCase struct {
		name   string
		method string
		path   string
	}

	targets := []parseCase{
		{name: "ListStacks", method: "GET", path: "/cloudformation/stacks"},
		{name: "CreateStack", method: "POST", path: "/cloudformation/stacks"},
		{name: "ListStackResources", method: "GET", path: "/cloudformation/stacks/teststack/resources"},
	}

	for _, target := range targets {
		target := target
		t.Run(target.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupCloudFormationTest(t)
			r := setupTestRouter(handler)
			w := performRequest(r, target.method, target.path, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", target.name, w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}
