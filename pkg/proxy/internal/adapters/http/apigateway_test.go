package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	apigwTypes "github.com/aws/aws-sdk-go-v2/service/apigateway/types"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
	apigwV2Types "github.com/aws/aws-sdk-go-v2/service/apigatewayv2/types"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

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
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetRestApis(mock.Anything, mock.Anything).
		Return(&apigateway.GetRestApisOutput{Items: []apigwTypes.RestApi{{Id: aws.String("abc")}}}, nil)

	w := performRequest(r, "GET", "/apigateway/rest-apis", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.GetRestApisOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Len(t, resp.Items, 1)
}

func TestAPIGateway_CreateRestApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().CreateRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.CreateRestApiOutput{Id: aws.String("abc"), Name: aws.String("my-api")}, nil)

	w := performRequest(r, "POST", "/apigateway/rest-apis", []byte(`{"name":"my-api"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.CreateRestApiOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "abc", *resp.Id)
	assert.Equal(t, "my-api", *resp.Name)
}

func TestAPIGateway_DeleteRestApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().DeleteRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteRestApiOutput{}, nil)

	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetRestApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.GetRestApiOutput{Id: aws.String("abc"), Name: aws.String("my-api")}, nil)

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.GetRestApiOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "abc", *resp.Id)
}

func TestAPIGateway_UpdateRestApi_SimpleFormat(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().UpdateRestApi(mock.Anything, mock.MatchedBy(func(in *apigateway.UpdateRestApiInput) bool {
		return in.RestApiId != nil && *in.RestApiId == "testid" && len(in.PatchOperations) == 2
	})).Return(&apigateway.UpdateRestApiOutput{Id: aws.String("abc")}, nil)

	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid", []byte(`{"restApiId":"abc","name":"new-name","Description":"new desc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateRestApi_SimpleFormatLowercase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().UpdateRestApi(mock.Anything, mock.MatchedBy(func(in *apigateway.UpdateRestApiInput) bool {
		return in.RestApiId != nil && *in.RestApiId == "testid" && len(in.PatchOperations) == 2
	})).Return(&apigateway.UpdateRestApiOutput{Id: aws.String("abc")}, nil)

	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid", []byte(`{"restApiId":"abc","name":"new-name","description":"lower desc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateRestApi_SDKFormat(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().UpdateRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.UpdateRestApiOutput{Id: aws.String("abc")}, nil)

	body := `{"restApiId":"abc","patchOperations":[{"op":"replace","path":"/name","value":"new-name"}]}`
	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid", []byte(body))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_ImportRestApi_Base64Body(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.ImportRestApiOutput{Id: aws.String("abc")}, nil)

	// Base64 encoded JSON: {"swagger":"2.0"}
	body := `{"body":"eyJzd2FnZ2VyIjoiMi4wIn0="}`
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/import", []byte(body))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.ImportRestApiOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "abc", *resp.Id)
}

func TestAPIGateway_ImportRestApi_Base64DecodeError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.ImportRestApiOutput{Id: aws.String("abc")}, nil)

	// Invalid base64 body: the decode fails, then it falls back to raw string body
	body := `{"body":"not-valid-base64-!!!-invalid"}`
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/import", []byte(body))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.ImportRestApiOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, "abc", *resp.Id)
}

func TestAPIGateway_ImportRestApi_RawJSONBody(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.ImportRestApiOutput{Id: aws.String("abc")}, nil)

	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/import", []byte(`{"swagger":"2.0","info":{"title":"test"}}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_ImportRestApi_RawBody(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).
		Return(&apigateway.ImportRestApiOutput{Id: aws.String("abc")}, nil)

	// Non-JSON raw body (e.g. YAML)
	body := []byte("openapi: 3.0.0\ninfo:\n  title: test\n")
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/import", body)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetResources_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetResources(mock.Anything, mock.Anything).
		Return(&apigateway.GetResourcesOutput{Items: []apigwTypes.Resource{{Id: aws.String("r1")}}}, nil)

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp apigateway.GetResourcesOutput
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Len(t, resp.Items, 1)
}

func TestAPIGateway_GetResources_NotFoundException(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetResources(mock.Anything, mock.Anything).
		Return(nil, errors.New("NotFoundException: API not found"))

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp, "items")
}

func TestAPIGateway_GetResources_InvalidAPI(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetResources(mock.Anything, mock.Anything).
		Return(nil, errors.New("Invalid API identifier specified"))

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources", nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp, "items")
}

func TestAPIGateway_GetResources_OtherError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetResources(mock.Anything, mock.Anything).
		Return(nil, errors.New("some other error"))

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetResource(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetResource(mock.Anything, mock.Anything).
		Return(&apigateway.GetResourceOutput{Id: aws.String("r1")}, nil)

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources/testresource", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateResource(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().CreateResource(mock.Anything, mock.Anything).
		Return(&apigateway.CreateResourceOutput{Id: aws.String("new-res")}, nil)

	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/resources", []byte(`{"restApiId":"abc","parentId":"root","pathPart":"items"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteResource(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().DeleteResource(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteResourceOutput{}, nil)

	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid/resources/testresource", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_PutMethod(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().PutMethod(mock.Anything, mock.Anything).
		Return(&apigateway.PutMethodOutput{HttpMethod: aws.String("GET")}, nil)

	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid/resources/testresource/methods/GET", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET","authorizationType":"NONE"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetMethod_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetMethod(mock.Anything, mock.Anything).
		Return(&apigateway.GetMethodOutput{HttpMethod: aws.String("GET")}, nil)

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources/testresource/methods/GET", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetMethod_NotFound(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetMethod(mock.Anything, mock.Anything).
		Return(nil, errors.New("NotFound"))

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources/testresource/methods/GET", nil)
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestAPIGateway_GetMethod_OtherError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetMethod(mock.Anything, mock.Anything).
		Return(nil, errors.New("some error"))

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources/testresource/methods/GET", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteMethod(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().DeleteMethod(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteMethodOutput{}, nil)

	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid/resources/testresource/methods/GET", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_PutIntegration(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().PutIntegration(mock.Anything, mock.Anything).
		Return(&apigateway.PutIntegrationOutput{}, nil)

	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid/resources/testresource/methods/GET/integrations", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET","type":"HTTP"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetIntegration_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetIntegration(mock.Anything, mock.Anything).
		Return(&apigateway.GetIntegrationOutput{}, nil)

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources/testresource/methods/GET/integrations", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetIntegration_NotFound(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetIntegration(mock.Anything, mock.Anything).
		Return(nil, errors.New("NotFound"))

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources/testresource/methods/GET/integrations", nil)
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestAPIGateway_GetIntegration_InvalidIntegration(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetIntegration(mock.Anything, mock.Anything).
		Return(nil, errors.New("Invalid integration"))

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources/testresource/methods/GET/integrations", nil)
	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestAPIGateway_GetIntegration_OtherError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetIntegration(mock.Anything, mock.Anything).
		Return(nil, errors.New("some error"))

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources/testresource/methods/GET/integrations", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateDeployment(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().CreateDeployment(mock.Anything, mock.Anything).
		Return(&apigateway.CreateDeploymentOutput{Id: aws.String("d1")}, nil)

	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/deployments", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteDeployment(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().DeleteDeployment(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteDeploymentOutput{}, nil)

	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid/deployments/testdep", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetDeployments(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetDeployments(mock.Anything, mock.Anything).
		Return(&apigateway.GetDeploymentsOutput{Items: []apigwTypes.Deployment{{Id: aws.String("d1")}}}, nil)

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/deployments", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

// ---------------------------------------------------------------------------
// REST API v1: dual-routed methods with "APIGateway." prefix
// ---------------------------------------------------------------------------

func TestAPIGateway_CreateStage_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().CreateStage(mock.Anything, mock.Anything).
		Return(&apigateway.CreateStageOutput{StageName: aws.String("prod")}, nil)

	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/stages", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetStages_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetStages(mock.Anything, mock.Anything).
		Return(&apigateway.GetStagesOutput{Item: []apigwTypes.Stage{{StageName: aws.String("prod")}}}, nil)

	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/stages", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateStage_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().UpdateStage(mock.Anything, mock.Anything).
		Return(&apigateway.UpdateStageOutput{StageName: aws.String("prod")}, nil)

	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid/stages/teststage", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteStage_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().DeleteStage(mock.Anything, mock.Anything).
		Return(&apigateway.DeleteStageOutput{}, nil)

	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid/stages/teststage", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V1(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetInvokeUrl(mock.Anything, "my-api", "prod").
		Return("https://my-api.execute-api.us-east-1.amazonaws.com/prod", nil)

	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/invoke-url", []byte(`{"apiId":"my-api","stageName":"prod"}`))
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
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetApis(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetApisOutput{Items: []apigwV2Types.Api{{ApiId: aws.String("abc")}}}, nil)

	w := performRequest(r, "GET", "/apigateway/apis", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateApi_Lowercase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateApi(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateApiInput) bool {
		return in.Name != nil && *in.Name == "my-api" &&
			in.Description != nil && *in.Description == "desc" &&
			in.ProtocolType == apigwV2Types.ProtocolTypeHttp &&
			in.RouteSelectionExpression == nil
	})).Return(&apigatewayv2.CreateApiOutput{ApiId: aws.String("abc")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis", []byte(`{"name":"my-api","description":"desc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateApi_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateApi(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateApiInput) bool {
		return in.Name != nil && *in.Name == "my-api" &&
			in.Description != nil && *in.Description == "desc" &&
			in.ProtocolType == apigwV2Types.ProtocolTypeHttp &&
			in.RouteSelectionExpression == nil
	})).Return(&apigatewayv2.CreateApiOutput{ApiId: aws.String("abc")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis", []byte(`{"Name":"my-api","Description":"desc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateApi_WebSocketProtocol(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateApi(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateApiInput) bool {
		return in.Name != nil && *in.Name == "ws-api" &&
			in.ProtocolType == apigwV2Types.ProtocolType("WEBSOCKET") &&
			in.RouteSelectionExpression != nil &&
			*in.RouteSelectionExpression == "$request.body.action"
	})).Return(&apigatewayv2.CreateApiOutput{ApiId: aws.String("ws-1")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis", []byte(`{"protocolType":"WEBSOCKET","name":"ws-api"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateApi_WebSocketProtocolWithCustomRSE(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateApi(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateApiInput) bool {
		return in.Name != nil && *in.Name == "ws-custom-rse" &&
			in.ProtocolType == apigwV2Types.ProtocolType("WEBSOCKET") &&
			in.RouteSelectionExpression != nil &&
			*in.RouteSelectionExpression == "$request.body.customPath"
	})).Return(&apigatewayv2.CreateApiOutput{ApiId: aws.String("ws-2")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis", []byte(`{"protocolType":"WEBSOCKET","name":"ws-custom-rse","routeSelectionExpression":"$request.body.customPath"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateApi_MissingProtocol(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateApi(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateApiInput) bool {
		return in.Name != nil && *in.Name == "default-http" &&
			in.ProtocolType == apigwV2Types.ProtocolTypeHttp &&
			in.RouteSelectionExpression == nil
	})).Return(&apigatewayv2.CreateApiOutput{ApiId: aws.String("def-1")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis", []byte(`{"name":"default-http"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().DeleteApi(mock.Anything, mock.Anything).
		Return(&apigatewayv2.DeleteApiOutput{}, nil)

	w := performRequest(r, "DELETE", "/apigateway/apis/testid", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetApi(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetApi(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetApiOutput{ApiId: aws.String("abc"), Name: aws.String("my-api")}, nil)

	w := performRequest(r, "GET", "/apigateway/apis/testid", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetRoutes(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetRoutes(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetRoutesOutput{Items: []apigwV2Types.Route{{RouteId: aws.String("r1")}}}, nil)

	w := performRequest(r, "GET", "/apigateway/apis/testid/routes", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateRoute_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateRoute(mock.Anything, mock.Anything).
		Return(&apigatewayv2.CreateRouteOutput{RouteId: aws.String("new-route")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/routes", []byte(`{"apiId":"abc","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateRoute_TitleCaseKeys(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateRoute(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateRouteInput) bool {
		return in.ApiId != nil && *in.ApiId == "testid" &&
			in.RouteKey != nil && *in.RouteKey == "GET /items" &&
			in.Target != nil && *in.Target == "integrations/def" &&
			in.AuthorizerId != nil && *in.AuthorizerId == "authorizer-1"
	})).Return(&apigatewayv2.CreateRouteOutput{RouteId: aws.String("new-route")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/routes", []byte(`{"ApiId":"abc","RouteKey":"GET /items","Target":"integrations/def","AuthorizationType":"CUSTOM","AuthorizerId":"authorizer-1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateRoute_Success(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().UpdateRoute(mock.Anything, mock.Anything).
		Return(&apigatewayv2.UpdateRouteOutput{RouteId: aws.String("r1")}, nil)

	w := performRequest(r, "PUT", "/apigateway/apis/testid/routes/testroute", []byte(`{"apiId":"abc","routeId":"r1","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateRoute_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().UpdateRoute(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.UpdateRouteInput) bool {
		// ApiId and RouteId come from URL params (testid, testroute)
		return in.ApiId != nil && *in.ApiId == "testid" &&
			in.RouteId != nil && *in.RouteId == "testroute" &&
			in.RouteKey != nil && *in.RouteKey == "POST /items" &&
			in.AuthorizerId != nil && *in.AuthorizerId == "auth-1"
	})).Return(&apigatewayv2.UpdateRouteOutput{RouteId: aws.String("r1")}, nil)

	w := performRequest(r, "PUT", "/apigateway/apis/testid/routes/testroute", []byte(`{"RouteKey":"POST /items","AuthorizationType":"CUSTOM","AuthorizerId":"auth-1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteRoute(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().DeleteRoute(mock.Anything, mock.Anything).
		Return(&apigatewayv2.DeleteRouteOutput{}, nil)

	w := performRequest(r, "DELETE", "/apigateway/apis/testid/routes/testroute", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetIntegrationsV2(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetIntegrations(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetIntegrationsOutput{Items: []apigwV2Types.Integration{{IntegrationId: aws.String("i1")}}}, nil)

	w := performRequest(r, "GET", "/apigateway/apis/testid/integrations", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateIntegrationV2(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateIntegration(mock.Anything, mock.Anything).
		Return(&apigatewayv2.CreateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/integrations", []byte(`{"apiId":"abc","integrationType":"HTTP"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_AllFields(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateIntegration(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateIntegrationInput) bool {
		return in.ApiId != nil && *in.ApiId == "testid" &&
			in.IntegrationType == apigwV2Types.IntegrationType("HTTP_PROXY") &&
			in.IntegrationUri != nil && *in.IntegrationUri == "https://example.com" &&
			in.Description != nil && *in.Description == "my integration"
	})).Return(&apigatewayv2.CreateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/integrations", []byte(`{"ApiId":"abc","IntegrationType":"HTTP_PROXY","IntegrationUri":"https://example.com","Description":"my integration","IntegrationMethod":"ANY","PayloadFormatVersion":"2.0","ConnectionType":"INTERNET","TimeoutInMillis":30000}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_LowercaseAll(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateIntegration(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateIntegrationInput) bool {
		return in.ApiId != nil && *in.ApiId == "testid" &&
			in.IntegrationType == apigwV2Types.IntegrationType("AWS_PROXY") &&
			in.Description != nil && *in.Description == "lower integration"
	})).Return(&apigatewayv2.CreateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/integrations", []byte(`{"apiId":"abc","integrationType":"AWS_PROXY","description":"lower integration"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().UpdateIntegration(mock.Anything, mock.Anything).
		Return(&apigatewayv2.UpdateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performRequest(r, "PUT", "/apigateway/apis/testid/integrations/testint", []byte(`{"apiId":"abc","integrationId":"i1","description":"updated"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().UpdateIntegration(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.UpdateIntegrationInput) bool {
		// ApiId and IntegrationId come from URL params (testid, testint)
		return in.ApiId != nil && *in.ApiId == "testid" &&
			in.IntegrationId != nil && *in.IntegrationId == "testint" &&
			in.IntegrationType == apigwV2Types.IntegrationType("HTTP_PROXY")
	})).Return(&apigatewayv2.UpdateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performRequest(r, "PUT", "/apigateway/apis/testid/integrations/testint", []byte(`{"IntegrationType":"HTTP_PROXY","IntegrationUri":"https://example.com"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_WithRequestTemplates(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateIntegration(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateIntegrationInput) bool {
		return in.ApiId != nil && *in.ApiId == "testid" &&
			in.IntegrationType == apigwV2Types.IntegrationType("AWS") &&
			in.RequestTemplates != nil &&
			in.RequestTemplates["application/json"] == `{"statusCode":200}`
	})).Return(&apigatewayv2.CreateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/integrations", []byte(`{"ApiId":"abc","IntegrationType":"AWS","IntegrationUri":"arn:aws:lambda:us-east-1:1:function:my-func","RequestTemplates":{"application/json":"{\"statusCode\":200}"}}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2_WithRequestTemplates(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().UpdateIntegration(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.UpdateIntegrationInput) bool {
		// ApiId and IntegrationId come from URL params (testid, testint)
		return in.ApiId != nil && *in.ApiId == "testid" &&
			in.IntegrationId != nil && *in.IntegrationId == "testint" &&
			in.RequestTemplates != nil &&
			in.RequestTemplates["application/json"] == `{"statusCode":200}`
	})).Return(&apigatewayv2.UpdateIntegrationOutput{IntegrationId: aws.String("i1")}, nil)

	w := performRequest(r, "PUT", "/apigateway/apis/testid/integrations/testint", []byte(`{"IntegrationType":"HTTP","RequestTemplates":{"application/json":"{\"statusCode\":200}"}}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteIntegration_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().DeleteIntegration(mock.Anything, mock.Anything).
		Return(&apigatewayv2.DeleteIntegrationOutput{}, nil)

	w := performRequest(r, "DELETE", "/apigateway/apis/testid/integrations/testint", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

// ---------------------------------------------------------------------------
// HTTP API v2 Stage operations
// ---------------------------------------------------------------------------

func TestAPIGateway_GetStages_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetStages(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetStagesOutput{Items: []apigwV2Types.Stage{{StageName: aws.String("prod")}}}, nil)

	w := performRequest(r, "GET", "/apigateway/apis/testid/stages", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetStages_V2_Default(t *testing.T) {
	t.Parallel()
	// No prefix (neither ApiGatewayV2. nor APIGateway.) -> defaults to v2
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetStages(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetStagesOutput{Items: []apigwV2Types.Stage{{StageName: aws.String("prod")}}}, nil)

	w := performRequest(r, "GET", "/apigateway/apis/testid/stages", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetStageV2(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetStage(mock.Anything, mock.Anything).
		Return(&apigatewayv2.GetStageOutput{StageName: aws.String("prod")}, nil)

	w := performRequest(r, "GET", "/apigateway/apis/testid/stages/teststage", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateStage_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateStage(mock.Anything, mock.Anything).
		Return(&apigatewayv2.CreateStageOutput{StageName: aws.String("prod")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/stages", []byte(`{"apiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_CreateStage_V2_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().CreateStage(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.CreateStageInput) bool {
		return in.ApiId != nil && *in.ApiId == "testid" &&
			in.StageName != nil && *in.StageName == "prod" &&
			in.Description != nil && *in.Description == "my desc" &&
			in.AutoDeploy != nil && *in.AutoDeploy == true
	})).Return(&apigatewayv2.CreateStageOutput{StageName: aws.String("prod")}, nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/stages", []byte(`{"ApiId":"abc","StageName":"prod","Description":"my desc","AutoDeploy":true}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateStage_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().UpdateStage(mock.Anything, mock.Anything).
		Return(&apigatewayv2.UpdateStageOutput{StageName: aws.String("prod")}, nil)

	w := performRequest(r, "PUT", "/apigateway/apis/testid/stages/teststage", []byte(`{"apiId":"abc","stageName":"prod","description":"updated"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_UpdateStage_V2_TitleCase(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().UpdateStage(mock.Anything, mock.MatchedBy(func(in *apigatewayv2.UpdateStageInput) bool {
		// ApiId and StageName come from URL params (testid, teststage)
		return in.ApiId != nil && *in.ApiId == "testid" &&
			in.StageName != nil && *in.StageName == "teststage" &&
			in.Description != nil && *in.Description == "title stage" &&
			in.AutoDeploy != nil && *in.AutoDeploy == true
	})).Return(&apigatewayv2.UpdateStageOutput{StageName: aws.String("prod")}, nil)

	w := performRequest(r, "PUT", "/apigateway/apis/testid/stages/teststage", []byte(`{"Description":"title stage","AutoDeploy":true}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteStage_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().DeleteStage(mock.Anything, mock.Anything).
		Return(&apigatewayv2.DeleteStageOutput{}, nil)

	w := performRequest(r, "DELETE", "/apigateway/apis/testid/stages/teststage", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V2(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetInvokeUrl(mock.Anything, "my-api", "prod", "HTTP").
		Return("https://my-api.execute-api.us-east-1.amazonaws.com/prod", nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/invoke-url", []byte(`{"apiId":"my-api","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["invokeUrl"], "execute-api")
}

func TestAPIGateway_GetInvokeUrl_V2_WebSocket(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetInvokeUrl(mock.Anything, "ws-api", "prod", "WEBSOCKET").
		Return("wss://ws-api.execute-api.us-east-1.amazonaws.com/prod", nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/invoke-url", []byte(`{"apiId":"ws-api","stageName":"prod","protocolType":"WEBSOCKET"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["invokeUrl"], "wss://")
}

func TestAPIGateway_GetInvokeUrl_V2_Default(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)

	s.mpV2.EXPECT().GetInvokeUrl(mock.Anything, "my-api", "prod", "HTTP").
		Return("https://my-api.execute-api.us-east-1.amazonaws.com/prod", nil)

	w := performRequest(r, "POST", "/apigateway/apis/testid/invoke-url", []byte(`{"apiId":"my-api","stageName":"prod"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["invokeUrl"], "execute-api")
}

// ---------------------------------------------------------------------------
// Unknown action
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Error cases - parse errors in body
// ---------------------------------------------------------------------------

func TestAPIGateway_GetRestApis_InvalidBody(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	w := performRequest(r, "GET", "/apigateway/rest-apis", []byte(`{invalid}`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)

	s.mp.EXPECT().GetRestApis(mock.Anything, mock.Anything).
		Return(nil, errors.New("service error"))

	w := performRequest(r, "GET", "/apigateway/rest-apis", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// Error path tests – REST API v1
// ---------------------------------------------------------------------------

func TestAPIGateway_CreateRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().CreateRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/rest-apis", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateRestApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/rest-apis", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_ImportRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/import", []byte(`{"swagger":"2.0"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_ImportRestApi_JSONBodyServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("json body error"))
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/import", []byte(`{"body":"eyJzd2FnZ2VyIjoiMi4wIn0="}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_ImportRestApi_RawBodyServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().ImportRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("raw body error"))
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/import", []byte("openapi: 3.0.0\ninfo:\n  title: test\n"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().DeleteRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().GetRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/rest-apis/testid", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateRestApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().UpdateRestApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid", []byte(`{"restApiId":"abc","name":"new-name"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateRestApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetResource_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().GetResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/resources/testresource", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateResource_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().CreateResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/resources", []byte(`{"restApiId":"abc","parentId":"root","pathPart":"items"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateResource_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/resources", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteResource_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().DeleteResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid/resources/testresource", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_PutMethod_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().PutMethod(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid/resources/testresource/methods/GET", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET","authorizationType":"NONE"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_PutMethod_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid/resources/testresource/methods/GET", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteMethod_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().DeleteMethod(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid/resources/testresource/methods/GET", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_PutIntegration_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().PutIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid/resources/testresource/methods/GET/integrations", []byte(`{"restApiId":"abc","resourceId":"r1","httpMethod":"GET","type":"HTTP"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_PutIntegration_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid/resources/testresource/methods/GET/integrations", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteIntegration_RestApiV1(t *testing.T) {
	t.Parallel()
	mp := mockports.NewAPIGatewayPort(t)
	mp.EXPECT().DeleteIntegration(mock.Anything, mock.Anything).Return(&apigateway.DeleteIntegrationOutput{}, nil)
	svc := createMockSvc(t, nil)
	svc.EXPECT().APIGateway().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/apigateway/rest-apis/testid/resources/testresource/methods/GET/integrations", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestAPIGateway_DeleteIntegration_RestApiV1_ServiceError(t *testing.T) {
	t.Parallel()
	mp := mockports.NewAPIGatewayPort(t)
	mp.EXPECT().DeleteIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().APIGateway().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)
	w := httptest.NewRecorder()
	req := httptest.NewRequest("DELETE", "/apigateway/rest-apis/testid/resources/testresource/methods/GET/integrations", nil)
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateDeployment_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().CreateDeployment(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/deployments", []byte(`{"restApiId":"abc"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateDeployment_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/deployments", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteDeployment_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().DeleteDeployment(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid/deployments/testdep", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetDeployments_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().GetDeployments(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/deployments", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateStage_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().CreateStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/stages", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateStage_V1_ParseError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().CreateStage(mock.Anything, mock.Anything).Return(nil, errors.New("should not reach here")).Maybe()
	r := setupTestRouter(s.h)
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/stages", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_GetStages_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().GetStages(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/rest-apis/testid/stages", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateStage_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().UpdateStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid/stages/teststage", []byte(`{"restApiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateStage_V1_ParseError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	s.mp.EXPECT().UpdateStage(mock.Anything, mock.Anything).Return(nil, errors.New("should not reach here")).Maybe()
	r := setupTestRouter(s.h)
	w := performRequest(r, "PUT", "/apigateway/rest-apis/testid/stages/teststage", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteStage_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV1(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().DeleteStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "DELETE", "/apigateway/rest-apis/testid/stages/teststage", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V1_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)
	s.mp.EXPECT().GetInvokeUrl(mock.Anything, mock.Anything, mock.Anything).Return("", errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/invoke-url", []byte(`{"apiId":"my-api","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V1_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/rest-apis/testid/invoke-url", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ---------------------------------------------------------------------------
// Error path tests – HTTP API v2
// ---------------------------------------------------------------------------

func TestAPIGateway_GetApis_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().GetApis(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/apis", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetApis_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "GET", "/apigateway/apis", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_CreateApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().CreateApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/apis", []byte(`{"name":"my-api"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateApi_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/apis", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().DeleteApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "DELETE", "/apigateway/apis/testid", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetApi_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().GetApi(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/apis/testid", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetRoutes_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().GetRoutes(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/apis/testid/routes", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateRoute_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().CreateRoute(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/apis/testid/routes", []byte(`{"apiId":"abc","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateRoute_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/apis/testid/routes", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateRoute_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().UpdateRoute(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "PUT", "/apigateway/apis/testid/routes/testroute", []byte(`{"apiId":"abc","routeId":"r1","routeKey":"GET /items"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateRoute_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "PUT", "/apigateway/apis/testid/routes/testroute", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteRoute_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().DeleteRoute(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "DELETE", "/apigateway/apis/testid/routes/testroute", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetIntegrationsV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().GetIntegrations(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/apis/testid/integrations", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().CreateIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/apis/testid/integrations", []byte(`{"apiId":"abc","integrationType":"HTTP"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateIntegrationV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "POST", "/apigateway/apis/testid/integrations", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().UpdateIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "PUT", "/apigateway/apis/testid/integrations/testint", []byte(`{"apiId":"abc","integrationId":"i1","description":"updated"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateIntegrationV2_ParseError(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	h := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(h)
	w := performRequest(r, "PUT", "/apigateway/apis/testid/integrations/testint", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAPIGateway_DeleteIntegrationV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().DeleteIntegration(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "DELETE", "/apigateway/apis/testid/integrations/testint", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetStagesV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().GetStages(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/apis/testid/stages", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetStageV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestV2(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().GetStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "GET", "/apigateway/apis/testid/stages/teststage", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_CreateStageV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().CreateStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/apis/testid/stages", []byte(`{"apiId":"abc","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_UpdateStageV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().UpdateStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "PUT", "/apigateway/apis/testid/stages/teststage", []byte(`{"apiId":"abc","stageName":"prod","description":"updated"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_DeleteStageV2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().DeleteStage(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	w := performRequest(r, "DELETE", "/apigateway/apis/testid/stages/teststage", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestAPIGateway_GetInvokeUrl_V2_ServiceError(t *testing.T) {
	t.Parallel()
	s := setupAGTestDual(t)
	r := setupTestRouter(s.h)
	s.mpV2.EXPECT().GetInvokeUrl(mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return("", errors.New("service error"))
	w := performRequest(r, "POST", "/apigateway/apis/testid/invoke-url", []byte(`{"apiId":"my-api","stageName":"prod"}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

