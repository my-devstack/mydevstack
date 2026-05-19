package httphandlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	apigwTypes "github.com/aws/aws-sdk-go-v2/service/apigateway/types"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
	apigwV2Types "github.com/aws/aws-sdk-go-v2/service/apigatewayv2/types"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

func performAGRequest(handler *ProxyHandler, target string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, "POST", "/apigateway/", target, body)
}

type agTestSetup struct {
	svc  *mockports.ProxyService
	mp   *mockports.APIGatewayPort
	mpV2 *mockports.APIGatewayV2Port
	h    *ProxyHandler
}

func setupAGTestV1(t *testing.T) *agTestSetup {
	svc := createMockSvc(t, nil)
	mp := mockports.NewAPIGatewayPort(t)
	svc.EXPECT().APIGateway().Return(mp).Maybe()
	svc.EXPECT().APIGatewayV2().Return(nil).Maybe()
	versionSvc := createTestVersionService(t)
	h := createHandler(svc, versionSvc)
	return &agTestSetup{svc: svc, mp: mp, h: h}
}

func setupAGTestV2(t *testing.T) *agTestSetup {
	svc := createMockSvc(t, nil)
	mpV2 := mockports.NewAPIGatewayV2Port(t)
	svc.EXPECT().APIGatewayV2().Return(mpV2).Maybe()
	svc.EXPECT().APIGateway().Return(nil).Maybe()
	versionSvc := createTestVersionService(t)
	h := createHandler(svc, versionSvc)
	return &agTestSetup{svc: svc, mpV2: mpV2, h: h}
}

func setupAGTestDual(t *testing.T) *agTestSetup {
	svc := createMockSvc(t, nil)
	mp := mockports.NewAPIGatewayPort(t)
	mpV2 := mockports.NewAPIGatewayV2Port(t)
	svc.EXPECT().APIGateway().Return(mp).Maybe()
	svc.EXPECT().APIGatewayV2().Return(mpV2).Maybe()
	versionSvc := createTestVersionService(t)
	h := createHandler(svc, versionSvc)
	return &agTestSetup{svc: svc, mp: mp, mpV2: mpV2, h: h}
}

// ---------------------------------------------------------------------------
// REST API v1
// ---------------------------------------------------------------------------

func TestAPIGateway_GetRestApis(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetRestApis(mock.Anything, mock.Anything).
		Return(&apigateway.GetRestApisOutput{Items: []apigwTypes.RestApi{{Id: aws.String("abc")}}}, nil)

	w := performAGRequest(s.h, "APIGateway.GetRestApis", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.GetRestApisOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Len(t, resp.Items, 1)
}

func TestAPIGateway_CreateRestApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().CreateRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.CreateRestApiOutput{Id: aws.String("abc"), Name: aws.String("my-api")}, nil)

	w := performAGRequest(s.h, "APIGateway.CreateRestApi", []byte(`{"name":"my-api"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.CreateRestApiOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "abc", *resp.Id)
	assert.Equal(t, "my-api", *resp.Name)
}

func TestAPIGateway_DeleteRestApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().DeleteRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteRestApiOutput{}, nil)

	w := performAGRequest(s.h, "APIGateway.DeleteRestApi", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetRestApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.GetRestApiOutput{Id: aws.String("abc"), Name: aws.String("my-api")}, nil)

	w := performAGRequest(s.h, "APIGateway.GetRestApi", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.GetRestApiOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "abc", *resp.Id)
}

func TestAPIGateway_UpdateRestApi_SimpleFormat(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().UpdateRestApi(mock.Anything, mock.MatchedBy(func(in *apigateway.UpdateRestApiInput) bool {
		return in.RestApiId != nil && *in.RestApiId == "abc" && len(in.PatchOperations) == 2
	})).Return(&apigateway.UpdateRestApiOutput{Id: aws.String("abc")}, nil)

	w := performAGRequest(s.h, "APIGateway.UpdateRestApi", []byte(`{"restApiId":"abc","name":"new-name","Description":"new desc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateRestApi_SimpleFormatLowercase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().UpdateRestApi(mock.Anything, mock.MatchedBy(func(in *apigateway.UpdateRestApiInput) bool {
		return in.RestApiId != nil && *in.RestApiId == "abc" && len(in.PatchOperations) == 2
	})).Return(&apigateway.UpdateRestApiOutput{Id: aws.String("abc")}, nil)

	w := performAGRequest(s.h, "APIGateway.UpdateRestApi", []byte(`{"restApiId":"abc","name":"new-name","description":"lower desc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateRestApi_SDKFormat(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().UpdateRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.UpdateRestApiOutput{Id: aws.String("abc")}, nil)

	body := `{"restApiId":"abc","patchOperations":[{"op":"replace","path":"/name","value":"new-name"}]}`
	w := performAGRequest(s.h, "APIGateway.UpdateRestApi", []byte(body))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_ImportRestApi_Base64Body(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.ImportRestApiOutput{Id: aws.String("abc")}, nil)

	// Base64 encoded JSON: {"swagger":"2.0"}
	body := `{"body":"eyJzd2FnZ2VyIjoiMi4wIn0="}`
	w := performAGRequest(s.h, "APIGateway.ImportRestApi", []byte(body))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.ImportRestApiOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "abc", *resp.Id)
}

func TestAPIGateway_ImportRestApi_Base64DecodeError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.ImportRestApiOutput{Id: aws.String("abc")}, nil)

	// Invalid base64 body: the decode fails, then it falls back to raw string body
	body := `{"body":"not-valid-base64-!!!-invalid"}`
	w := performAGRequest(s.h, "APIGateway.ImportRestApi", []byte(body))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.ImportRestApiOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "abc", *resp.Id)
}

func TestAPIGateway_ImportRestApi_RawJSONBody(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.ImportRestApiOutput{Id: aws.String("abc")}, nil)

	w := performAGRequest(s.h, "APIGateway.ImportRestApi", []byte(`{"swagger":"2.0","info":{"title":"test"}}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_ImportRestApi_RawBody(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.ImportRestApiOutput{Id: aws.String("abc")}, nil)

	// Non-JSON raw body (e.g. YAML)
	body := []byte("openapi: 3.0.0\ninfo:\n  title: test\n")
	w := performAGRequest(s.h, "APIGateway.ImportRestApi", body)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetResources_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetResources(mock.Anything, mock.Anything).
		Return(&apigateway.GetResourcesOutput{Items: []apigwTypes.Resource{{Id: aws.String("r1")}}}, nil)

	w := performAGRequest(s.h, "APIGateway.GetResources", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.GetResourcesOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Len(t, resp.Items, 1)
}

func TestAPIGateway_GetResources_NotFoundException(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetResources(mock.Anything, mock.Anything).
		Return(nil, errors.New("NotFoundException: API not found"))

	w := performAGRequest(s.h, "APIGateway.GetResources", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp, "items")
}

func TestAPIGateway_GetResources_InvalidAPI(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetResources(mock.Anything, mock.Anything).
		Return(nil, errors.New("Invalid API identifier specified"))

	w := performAGRequest(s.h, "APIGateway.GetResources", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp, "items")
}

func TestAPIGateway_GetResources_OtherError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetResources(mock.Anything, mock.Anything).
		Return(nil, errors.New("some other error"))

	w := performAGRequest(s.h, "APIGateway.GetResources", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetResources_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.GetResources", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetResource(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetResource(mock.Anything, mock.Anything).
		Return(&apigateway.GetResourceOutput{Id: aws.String("r1")}, nil)

	w := performAGRequest(s.h, "APIGateway.GetResource", []byte(`{"restApiId":"abc","resourceId":"r1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateResource(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().CreateResource(mock.Anything, mock.Anything).
		Return(&apigateway.CreateResourceOutput{Id: aws.String("new-res")}, nil)

	w := performAGRequest(s.h, "APIGateway.CreateResource", []byte(`{"restApiId":"abc","parentId":"root","pathPart":"items"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteResource(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().DeleteResource(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteResourceOutput{}, nil)

	w := performAGRequest(s.h, "APIGateway.DeleteResource", []byte(`{"restApiId":"abc","resourceId":"r1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_PutMethod(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().PutMethod(mock.Anything, mock.Anything).
		Return(&apigateway.PutMethodOutput{HttpMethod: aws.String("GET")}, nil)

	w := performAGRequest(s.h, "APIGateway.PutMethod", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET","authorizationType":"NONE"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetMethod_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetMethod(mock.Anything, mock.Anything).
		Return(&apigateway.GetMethodOutput{HttpMethod: aws.String("GET")}, nil)

	w := performAGRequest(s.h, "APIGateway.GetMethod", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetMethod_NotFound(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetMethod(mock.Anything, mock.Anything).
		Return(nil, errors.New("NotFound"))

	w := performAGRequest(s.h, "APIGateway.GetMethod", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET"}`))
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestAPIGateway_GetMethod_OtherError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetMethod(mock.Anything, mock.Anything).
		Return(nil, errors.New("some error"))

	w := performAGRequest(s.h, "APIGateway.GetMethod", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetMethod_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.GetMethod", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteMethod(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().DeleteMethod(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteMethodOutput{}, nil)

	w := performAGRequest(s.h, "APIGateway.DeleteMethod", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_PutIntegration(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().PutIntegration(mock.Anything, mock.Anything).
		Return(&apigateway.PutIntegrationOutput{}, nil)

	w := performAGRequest(s.h, "APIGateway.PutIntegration", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET","type":"HTTP"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetIntegration_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetIntegration(mock.Anything, mock.Anything).
		Return(&apigateway.GetIntegrationOutput{}, nil)

	w := performAGRequest(s.h, "APIGateway.GetIntegration", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetIntegration_NotFound(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetIntegration(mock.Anything, mock.Anything).
		Return(nil, errors.New("NotFound"))

	w := performAGRequest(s.h, "APIGateway.GetIntegration", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET"}`))
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestAPIGateway_GetIntegration_InvalidIntegration(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetIntegration(mock.Anything, mock.Anything).
		Return(nil, errors.New("Invalid integration"))

	w := performAGRequest(s.h, "APIGateway.GetIntegration", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET"}`))
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestAPIGateway_GetIntegration_OtherError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetIntegration(mock.Anything, mock.Anything).
		Return(nil, errors.New("some error"))

	w := performAGRequest(s.h, "APIGateway.GetIntegration", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetIntegration_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.GetIntegration", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteIntegration_V1_DelegatesToV2(t *testing.T) {
	t.Parallel()
	// "DeleteIntegration" case in v2 section comes before v1 section.
	// Even with "APIGateway." prefix the v2 handler is called.
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().DeleteIntegration(mock.Anything, mock.Anything).
		Return(&apigatewayv2.DeleteIntegrationOutput{}, nil)

	w := performAGRequest(s.h, "APIGateway.DeleteIntegration", []byte(`{"apiId":"abc","integrationId":"i1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateDeployment(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().CreateDeployment(mock.Anything, mock.Anything).
		Return(&apigateway.CreateDeploymentOutput{Id: aws.String("d1")}, nil)

	w := performAGRequest(s.h, "APIGateway.CreateDeployment", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteDeployment(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().DeleteDeployment(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteDeploymentOutput{}, nil)

	w := performAGRequest(s.h, "APIGateway.DeleteDeployment", []byte(`{"restApiId":"abc","deploymentId":"d1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetDeployments(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetDeployments(mock.Anything, mock.Anything).
		Return(&apigateway.GetDeploymentsOutput{Items: []apigwTypes.Deployment{{Id: aws.String("d1")}}}, nil)

	w := performAGRequest(s.h, "APIGateway.GetDeployments", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

// ---------------------------------------------------------------------------
// REST API v1: dual-routed methods with "APIGateway." prefix
// ---------------------------------------------------------------------------

func TestAPIGateway_CreateStage_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mp.EXPECT().CreateStage(mock.Anything, mock.Anything).
		Return(&apigateway.CreateStageOutput{StageName: aws.String("prod")}, nil)

	w := performAGRequest(s.h, "APIGateway.CreateStage", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetStages_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mp.EXPECT().GetStages(mock.Anything, mock.Anything).
		Return(&apigateway.GetStagesOutput{Item: []apigwTypes.Stage{{StageName: aws.String("prod")}}}, nil)

	w := performAGRequest(s.h, "APIGateway.GetStages", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateStage_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mp.EXPECT().UpdateStage(mock.Anything, mock.Anything).
		Return(&apigateway.UpdateStageOutput{StageName: aws.String("prod")}, nil)

	w := performAGRequest(s.h, "APIGateway.UpdateStage", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteStage_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mp.EXPECT().DeleteStage(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteStageOutput{}, nil)

	w := performAGRequest(s.h, "APIGateway.DeleteStage", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mp.EXPECT().GetInvokeUrl(mock.Anything, "my-api", "prod").
		Return("https://my-api.execute-api.us-east-1.amazonaws.com/prod", nil)

	w := performAGRequest(s.h, "APIGateway.GetInvokeUrl", []byte(`{"apiId":"my-api","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["invokeUrl"], "execute-api")
}

// ---------------------------------------------------------------------------
// HTTP API v2
// ---------------------------------------------------------------------------

func TestAPIGateway_GetApis(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().GetApis(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetApisOutput{Items: []apigwV2Types.Api{{ApiId: aws.String("abc")}}}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.GetApis", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateApi_Lowercase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().CreateApi(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateApiInput) bool {
		return in.Name != nil && *in.Name == "my-api" && in.Description != nil && *in.Description == "desc"
	})).Return(&apigatewayv2.CreateApiOutput{ApiId: aws.String("abc")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateApi", []byte(`{"name":"my-api","description":"desc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateApi_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().CreateApi(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateApiInput) bool {
		return in.Name != nil && *in.Name == "my-api" && in.Description != nil && *in.Description == "desc"
	})).Return(&apigatewayv2.CreateApiOutput{ApiId: aws.String("abc")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateApi", []byte(`{"Name":"my-api","Description":"desc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().DeleteApi(mock.Anything, mock.Anything).
		Return(&apigatewayv2.DeleteApiOutput{}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.DeleteApi", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().GetApi(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetApiOutput{ApiId: aws.String("abc"), Name: aws.String("my-api")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.GetApi", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetRoutes(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().GetRoutes(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetRoutesOutput{Items: []apigwV2Types.Route{{RouteId: aws.String("r1")}}}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.GetRoutes", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateRoute_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().CreateRoute(mock.Anything, mock.Anything).
		Return(&apigatewayv2.CreateRouteOutput{RouteId: aws.String("new-route")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateRoute", []byte(`{"apiId":"abc","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateRoute_TitleCaseKeys(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().CreateRoute(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateRouteInput) bool {
		return in.ApiId != nil && *in.ApiId == "abc" &&
			in.RouteKey != nil && *in.RouteKey == "GET /items" &&
			in.Target != nil && *in.Target == "integrations/def" &&
			in.AuthorizerId != nil && *in.AuthorizerId == "authorizer-1"
	})).Return(&apigatewayv2.CreateRouteOutput{RouteId: aws.String("new-route")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateRoute",
		[]byte(`{"ApiId":"abc","RouteKey":"GET /items","Target":"integrations/def","AuthorizationType":"CUSTOM","AuthorizerId":"authorizer-1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateRoute_MissingApiId(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateRoute", []byte(`{"routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateRoute_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().UpdateRoute(mock.Anything, mock.Anything).
		Return(&apigatewayv2.UpdateRouteOutput{RouteId: aws.String("r1")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateRoute", []byte(`{"apiId":"abc","routeId":"r1","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateRoute_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().UpdateRoute(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.UpdateRouteInput) bool {
		return in.ApiId != nil && *in.ApiId == "abc" &&
			in.RouteId != nil && *in.RouteId == "r1" &&
			in.RouteKey != nil && *in.RouteKey == "POST /items" &&
			in.AuthorizerId != nil && *in.AuthorizerId == "auth-1"
	})).Return(&apigatewayv2.UpdateRouteOutput{RouteId: aws.String("r1")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateRoute",
		[]byte(`{"ApiId":"abc","RouteId":"r1","RouteKey":"POST /items","AuthorizationType":"CUSTOM","AuthorizerId":"auth-1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateRoute_MissingApiId(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateRoute", []byte(`{"routeId":"r1","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateRoute_MissingRouteId(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateRoute", []byte(`{"apiId":"abc","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteRoute(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().DeleteRoute(mock.Anything, mock.Anything).
		Return(&apigatewayv2.DeleteRouteOutput{}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.DeleteRoute", []byte(`{"apiId":"abc","routeId":"r1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetIntegrationsV2(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().GetIntegrations(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetIntegrationsOutput{Items: []apigwV2Types.Integration{{IntegrationId: aws.String("i1")}}}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.GetIntegrations", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateIntegrationV2(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().CreateIntegration(mock.Anything, mock.Anything).
		Return(&apigatewayv2.CreateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateIntegration", []byte(`{"apiId":"abc","integrationType":"HTTP"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_AllFields(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().CreateIntegration(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateIntegrationInput) bool {
		return in.ApiId != nil && *in.ApiId == "abc" &&
			in.IntegrationType == apigwV2Types.IntegrationType("HTTP_PROXY") &&
			in.IntegrationUri != nil && *in.IntegrationUri == "https://example.com" &&
			in.Description != nil && *in.Description == "my integration"
	})).Return(&apigatewayv2.CreateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateIntegration",
		[]byte(`{"ApiId":"abc","IntegrationType":"HTTP_PROXY","IntegrationUri":"https://example.com","Description":"my integration","IntegrationMethod":"ANY","PayloadFormatVersion":"2.0","ConnectionType":"INTERNET","TimeoutInMillis":30000}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_LowercaseAll(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().CreateIntegration(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateIntegrationInput) bool {
		return in.ApiId != nil && *in.ApiId == "abc" &&
			in.IntegrationType == apigwV2Types.IntegrationType("AWS_PROXY") &&
			in.Description != nil && *in.Description == "lower integration"
	})).Return(&apigatewayv2.CreateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateIntegration",
		[]byte(`{"apiId":"abc","integrationType":"AWS_PROXY","description":"lower integration"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_MissingApiId(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateIntegration", []byte(`{"integrationType":"HTTP"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().UpdateIntegration(mock.Anything, mock.Anything).
		Return(&apigatewayv2.UpdateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateIntegration", []byte(`{"apiId":"abc","integrationId":"i1","description":"updated"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().UpdateIntegration(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.UpdateIntegrationInput) bool {
		return in.ApiId != nil && *in.ApiId == "abc" &&
			in.IntegrationId != nil && *in.IntegrationId == "i1" &&
			in.IntegrationType == apigwV2Types.IntegrationType("HTTP_PROXY")
	})).Return(&apigatewayv2.UpdateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateIntegration",
		[]byte(`{"ApiId":"abc","IntegrationId":"i1","IntegrationType":"HTTP_PROXY","IntegrationUri":"https://example.com"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2_MissingApiId(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateIntegration", []byte(`{"integrationId":"i1","description":"updated"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2_MissingIntegrationId(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateIntegration", []byte(`{"apiId":"abc","description":"updated"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteIntegration_V2(t *testing.T) {
	t.Parallel()
	// DeleteIntegration without "APIGateway." prefix -> routed to v2
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().DeleteIntegration(mock.Anything, mock.Anything).
		Return(&apigatewayv2.DeleteIntegrationOutput{}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.DeleteIntegration", []byte(`{"apiId":"abc","integrationId":"i1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

// ---------------------------------------------------------------------------
// HTTP API v2 Stage operations
// ---------------------------------------------------------------------------

func TestAPIGateway_GetStages_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mpV2.EXPECT().GetStages(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetStagesOutput{Items: []apigwV2Types.Stage{{StageName: aws.String("prod")}}}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.GetStages", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetStages_V2_Default(t *testing.T) {
	t.Parallel()
	// No prefix (neither ApiGatewayV2. nor APIGateway.) -> defaults to v2
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().GetStages(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetStagesOutput{Items: []apigwV2Types.Stage{{StageName: aws.String("prod")}}}, nil)

	w := performAGRequest(s.h, "GetStages", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetStageV2(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().GetStage(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetStageOutput{StageName: aws.String("prod")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.GetStage", []byte(`{"apiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateStage_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mpV2.EXPECT().CreateStage(mock.Anything, mock.Anything).
		Return(&apigatewayv2.CreateStageOutput{StageName: aws.String("prod")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateStage", []byte(`{"apiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateStage_V2_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mpV2.EXPECT().CreateStage(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateStageInput) bool {
		return in.ApiId != nil && *in.ApiId == "abc" &&
			in.StageName != nil && *in.StageName == "prod" &&
			in.Description != nil && *in.Description == "my desc" &&
			in.AutoDeploy != nil && *in.AutoDeploy == true
	})).Return(&apigatewayv2.CreateStageOutput{StageName: aws.String("prod")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateStage", []byte(`{"ApiId":"abc","StageName":"prod","Description":"my desc","AutoDeploy":true}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateStage_V2_MissingApiId(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateStage", []byte(`{"stageName":"prod"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_CreateStage_V2_EmptyApiId(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	w := performAGRequest(s.h, "ApiGatewayV2.CreateStage", []byte(`{"apiId":"","stageName":"prod"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateStage_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mpV2.EXPECT().UpdateStage(mock.Anything, mock.Anything).
		Return(&apigatewayv2.UpdateStageOutput{StageName: aws.String("prod")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateStage", []byte(`{"apiId":"abc","stageName":"prod","description":"updated"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateStage_V2_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mpV2.EXPECT().UpdateStage(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.UpdateStageInput) bool {
		return in.ApiId != nil && *in.ApiId == "abc" &&
			in.StageName != nil && *in.StageName == "prod" &&
			in.Description != nil && *in.Description == "title stage" &&
			in.AutoDeploy != nil && *in.AutoDeploy == true
	})).Return(&apigatewayv2.UpdateStageOutput{StageName: aws.String("prod")}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateStage",
		[]byte(`{"ApiId":"abc","StageName":"prod","Description":"title stage","AutoDeploy":true}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateStage_V2_MissingApiId(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateStage", []byte(`{"stageName":"prod"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateStage_V2_MissingStageName(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	w := performAGRequest(s.h, "ApiGatewayV2.UpdateStage", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteStage_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mpV2.EXPECT().DeleteStage(mock.Anything, mock.Anything).
		Return(&apigatewayv2.DeleteStageOutput{}, nil)

	w := performAGRequest(s.h, "ApiGatewayV2.DeleteStage", []byte(`{"apiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)

	s.mpV2.EXPECT().GetInvokeUrl(mock.Anything, "my-api", "prod").
		Return("https://my-api.execute-api.us-east-1.amazonaws.com/prod", nil)

	w := performAGRequest(s.h, "ApiGatewayV2.GetInvokeUrl", []byte(`{"apiId":"my-api","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["invokeUrl"], "execute-api")
}

func TestAPIGateway_GetInvokeUrl_V2_Default(t *testing.T) {
	t.Parallel()
	// No prefix -> defaults to v2
	s := setupAGTestV2(t)

	s.mpV2.EXPECT().GetInvokeUrl(mock.Anything, "my-api", "prod").
		Return("https://my-api.execute-api.us-east-1.amazonaws.com/prod", nil)

	w := performAGRequest(s.h, "GetInvokeUrl", []byte(`{"apiId":"my-api","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["invokeUrl"], "execute-api")
}

// ---------------------------------------------------------------------------
// Unknown action
// ---------------------------------------------------------------------------

func TestAPIGateway_UnknownAction(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	w := performAGRequest(s.h, "APIGateway.UnknownAction", []byte(`{}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Unknown API Gateway action")
}

// ---------------------------------------------------------------------------
// Error cases - parse errors in body
// ---------------------------------------------------------------------------

func TestAPIGateway_GetRestApis_InvalidBody(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	w := performAGRequest(s.h, "APIGateway.GetRestApis", []byte(`{invalid}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)

	s.mp.EXPECT().GetRestApis(mock.Anything, mock.Anything).
		Return(nil, errors.New("service error"))

	w := performAGRequest(s.h, "APIGateway.GetRestApis", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// Error path tests – REST API v1
// ---------------------------------------------------------------------------

func TestAPIGateway_CreateRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().CreateRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.CreateRestApi", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateRestApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.CreateRestApi", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_ImportRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.ImportRestApi", []byte(`{"swagger":"2.0"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_ImportRestApi_JSONBodyServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("json body error"))
	w := performAGRequest(s.h, "APIGateway.ImportRestApi", []byte(`{"body":"eyJzd2FnZ2VyIjoiMi4wIn0="}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_ImportRestApi_RawBodyServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("raw body error"))
	w := performAGRequest(s.h, "APIGateway.ImportRestApi", []byte("openapi: 3.0.0\ninfo:\n  title: test\n"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().DeleteRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.DeleteRestApi", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteRestApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.DeleteRestApi", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().GetRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.GetRestApi", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetRestApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.GetRestApi", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().UpdateRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.UpdateRestApi", []byte(`{"restApiId":"abc","name":"new-name"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateRestApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.UpdateRestApi", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetResource_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().GetResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.GetResource", []byte(`{"restApiId":"abc","resourceId":"r1"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetResource_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.GetResource", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_CreateResource_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().CreateResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.CreateResource", []byte(`{"restApiId":"abc","parentId":"root","pathPart":"items"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateResource_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.CreateResource", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteResource_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().DeleteResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.DeleteResource", []byte(`{"restApiId":"abc","resourceId":"r1"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteResource_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.DeleteResource", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_PutMethod_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().PutMethod(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.PutMethod", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET","authorizationType":"NONE"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_PutMethod_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.PutMethod", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteMethod_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().DeleteMethod(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.DeleteMethod", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteMethod_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.DeleteMethod", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_PutIntegration_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().PutIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.PutIntegration", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET","type":"HTTP"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_PutIntegration_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.PutIntegration", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// deleteIntegration REST API v1 – direct call (dispatch bug prevents routing)
func TestAPIGateway_DeleteIntegration_RestApiV1(t *testing.T) {
	t.Parallel()
	mp := mockports.NewAPIGatewayPort(t)
	mp.EXPECT().DeleteIntegration(mock.Anything, mock.Anything).Return(&apigateway.DeleteIntegrationOutput{}, nil)
	svc := createMockSvc(t, nil)
	svc.EXPECT().APIGateway().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/apigateway/", bytes.NewReader([]byte("{}")))
	c.Request.Header.Set("X-Amz-Target", "APIGateway.DeleteIntegration")
	handler.deleteIntegration(context.Background(), c, []byte("{}"))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteIntegration_RestApiV1_ServiceError(t *testing.T) {
	t.Parallel()
	mp := mockports.NewAPIGatewayPort(t)
	mp.EXPECT().DeleteIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().APIGateway().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/apigateway/", bytes.NewReader([]byte("{}")))
	c.Request.Header.Set("X-Amz-Target", "APIGateway.DeleteIntegration")
	handler.deleteIntegration(context.Background(), c, []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteIntegration_RestApiV1_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/apigateway/", bytes.NewReader([]byte("{bad")))
	c.Request.Header.Set("X-Amz-Target", "APIGateway.DeleteIntegration")
	handler.deleteIntegration(context.Background(), c, []byte("{bad"))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_CreateDeployment_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().CreateDeployment(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.CreateDeployment", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateDeployment_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.CreateDeployment", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteDeployment_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().DeleteDeployment(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.DeleteDeployment", []byte(`{"restApiId":"abc","deploymentId":"d1"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteDeployment_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.DeleteDeployment", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetDeployments_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().GetDeployments(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.GetDeployments", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetDeployments_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.GetDeployments", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_CreateStage_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().CreateStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.CreateStage", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateStage_V1_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.CreateStage", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetStages_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().GetStages(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.GetStages", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetStages_V1_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.GetStages", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateStage_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().UpdateStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.UpdateStage", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateStage_V1_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.UpdateStage", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteStage_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().DeleteStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.DeleteStage", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteStage_V1_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.DeleteStage", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	s.mp.EXPECT().GetInvokeUrl(mock.Anything, mock.Anything, mock.Anything).Return("", errors.New("service error"))
	w := performAGRequest(s.h, "APIGateway.GetInvokeUrl", []byte(`{"apiId":"my-api","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V1_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "APIGateway.GetInvokeUrl", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ---------------------------------------------------------------------------
// Error path tests – HTTP API v2
// ---------------------------------------------------------------------------

func TestAPIGateway_GetApis_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().GetApis(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.GetApis", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetApis_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.GetApis", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_CreateApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().CreateApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.CreateApi", []byte(`{"name":"my-api"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.CreateApi", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().DeleteApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.DeleteApi", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.DeleteApi", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().GetApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.GetApi", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.GetApi", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetRoutes_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().GetRoutes(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.GetRoutes", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetRoutes_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.GetRoutes", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_CreateRoute_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().CreateRoute(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.CreateRoute", []byte(`{"apiId":"abc","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateRoute_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.CreateRoute", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateRoute_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().UpdateRoute(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.UpdateRoute", []byte(`{"apiId":"abc","routeId":"r1","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateRoute_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.UpdateRoute", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteRoute_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().DeleteRoute(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.DeleteRoute", []byte(`{"apiId":"abc","routeId":"r1"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteRoute_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.DeleteRoute", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetIntegrationsV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().GetIntegrations(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.GetIntegrations", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetIntegrationsV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.GetIntegrations", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().CreateIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.CreateIntegration", []byte(`{"apiId":"abc","integrationType":"HTTP"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.CreateIntegration", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().UpdateIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.UpdateIntegration", []byte(`{"apiId":"abc","integrationId":"i1","description":"updated"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.UpdateIntegration", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteIntegrationV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().DeleteIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.DeleteIntegration", []byte(`{"apiId":"abc","integrationId":"i1"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteIntegrationV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.DeleteIntegration", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetStagesV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().GetStages(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.GetStages", []byte(`{"apiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetStagesV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.GetStages", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetStageV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	s.mpV2.EXPECT().GetStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.GetStage", []byte(`{"apiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetStageV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.GetStage", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_CreateStageV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	s.mpV2.EXPECT().CreateStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.CreateStage", []byte(`{"apiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateStageV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.CreateStage", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateStageV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	s.mpV2.EXPECT().UpdateStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.UpdateStage", []byte(`{"apiId":"abc","stageName":"prod","description":"updated"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateStageV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.UpdateStage", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteStageV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	s.mpV2.EXPECT().DeleteStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.DeleteStage", []byte(`{"apiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteStageV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.DeleteStage", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	s.mpV2.EXPECT().GetInvokeUrl(mock.Anything, mock.Anything, mock.Anything).Return("", errors.New("service error"))
	w := performAGRequest(s.h, "ApiGatewayV2.GetInvokeUrl", []byte(`{"apiId":"my-api","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/", "ApiGatewayV2.GetInvokeUrl", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}
