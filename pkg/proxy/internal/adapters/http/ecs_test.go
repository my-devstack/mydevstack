package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/ecs"
	"github.com/aws/aws-sdk-go-v2/service/ecs/types"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// setupECSTest creates a mocked service with a mock ECS port wired in.
// NOTE: ECS() is set with Maybe() so tests where the handler returns early
// (e.g. parse-error) don't fail the mock.
func setupECSTest(t *testing.T) (*mockports.ProxyService, *mockports.ECSPort, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	mp := mockports.NewECSPort(t)
	svc.EXPECT().ECS().Return(mp).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, mp, handler
}

// performECSRequest executes an HTTP request against the /ecs/ service router.
func performECSRequest(handler *ProxyHandler, method, path string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, method, path, body)
}

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

func TestECS_ListClusters_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListClusters(mock.Anything, mock.Anything).Return(&ecs.ListClustersOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/clusters", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_ListClusters_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListClusters(mock.Anything, mock.Anything).Return(nil, errors.New("list clusters error"))

	w := performECSRequest(handler, "GET", "/ecs/clusters", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list clusters")
}

func TestECS_ListClusters_Pagination(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListClusters(mock.Anything, mock.MatchedBy(func(in *ecs.ListClustersInput) bool {
		return in.NextToken != nil && *in.NextToken == "token1" && in.MaxResults != nil && *in.MaxResults == 10
	})).Return(&ecs.ListClustersOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/clusters", []byte(`{"NextToken":"token1","MaxResults":10}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_ListClusters_QueryParams(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListClusters(mock.Anything, mock.MatchedBy(func(in *ecs.ListClustersInput) bool {
		return in.NextToken != nil && *in.NextToken == "token1" && in.MaxResults != nil && *in.MaxResults == 10
	})).Return(&ecs.ListClustersOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/clusters?NextToken=token1&MaxResults=10", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_CreateCluster_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().CreateCluster(mock.Anything, mock.MatchedBy(func(in *ecs.CreateClusterInput) bool {
		return in.ClusterName != nil && *in.ClusterName == "test-cluster"
	})).Return(&ecs.CreateClusterOutput{}, nil)

	w := performECSRequest(handler, "POST", "/ecs/clusters", []byte(`{"ClusterName":"test-cluster"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_CreateCluster_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().CreateCluster(mock.Anything, mock.Anything).Return(nil, errors.New("create cluster error"))

	w := performECSRequest(handler, "POST", "/ecs/clusters", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create cluster")
}

func TestECS_DescribeClusters_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeClusters(mock.Anything, mock.MatchedBy(func(in *ecs.DescribeClustersInput) bool {
		return len(in.Clusters) == 1 && in.Clusters[0] == "test-cluster"
	})).Return(&ecs.DescribeClustersOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/clusters/test-cluster", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DescribeClusters_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeClusters(mock.Anything, mock.Anything).Return(nil, errors.New("describe clusters error"))

	w := performECSRequest(handler, "GET", "/ecs/clusters/test-cluster", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe clusters")
}

func TestECS_DeleteCluster_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DeleteCluster(mock.Anything, mock.MatchedBy(func(in *ecs.DeleteClusterInput) bool {
		return in.Cluster != nil && *in.Cluster == "test-cluster"
	})).Return(&ecs.DeleteClusterOutput{}, nil)

	w := performECSRequest(handler, "DELETE", "/ecs/clusters/test-cluster", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DeleteCluster_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DeleteCluster(mock.Anything, mock.Anything).Return(nil, errors.New("delete cluster error"))

	w := performECSRequest(handler, "DELETE", "/ecs/clusters/test-cluster", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete cluster")
}

// ---------------------------------------------------------------------------
// Task Definitions
// ---------------------------------------------------------------------------

func TestECS_ListTaskDefinitions_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTaskDefinitions(mock.Anything, mock.Anything).Return(&ecs.ListTaskDefinitionsOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/task-definitions", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_ListTaskDefinitions_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTaskDefinitions(mock.Anything, mock.Anything).Return(nil, errors.New("list task definitions error"))

	w := performECSRequest(handler, "GET", "/ecs/task-definitions", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list task definitions")
}

func TestECS_ListTaskDefinitions_Filters(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTaskDefinitions(mock.Anything, mock.MatchedBy(func(in *ecs.ListTaskDefinitionsInput) bool {
		return in.FamilyPrefix != nil && *in.FamilyPrefix == "test" &&
			in.Status == types.TaskDefinitionStatusActive &&
			in.Sort == types.SortOrderDesc
	})).Return(&ecs.ListTaskDefinitionsOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/task-definitions", []byte(`{"FamilyPrefix":"test","Status":"ACTIVE","Sort":"DESC"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_RegisterTaskDefinition_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().RegisterTaskDefinition(mock.Anything, mock.MatchedBy(func(in *ecs.RegisterTaskDefinitionInput) bool {
		return in.Family != nil && *in.Family == "test-task" &&
			len(in.ContainerDefinitions) == 1 &&
			*in.ContainerDefinitions[0].Name == "app"
	})).Return(&ecs.RegisterTaskDefinitionOutput{}, nil)

	w := performECSRequest(handler, "POST", "/ecs/task-definitions", []byte(`{"Family":"test-task","ContainerDefinitions":[{"Name":"app","Image":"nginx:latest"}]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_RegisterTaskDefinition_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().RegisterTaskDefinition(mock.Anything, mock.Anything).Return(nil, errors.New("register task definition error"))

	w := performECSRequest(handler, "POST", "/ecs/task-definitions", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to register task definition")
}

func TestECS_DescribeTaskDefinition_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeTaskDefinition(mock.Anything, mock.MatchedBy(func(in *ecs.DescribeTaskDefinitionInput) bool {
		return in.TaskDefinition != nil && *in.TaskDefinition == "test-task:1"
	})).Return(&ecs.DescribeTaskDefinitionOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/task-definitions/test-task:1", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DescribeTaskDefinition_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeTaskDefinition(mock.Anything, mock.Anything).Return(nil, errors.New("describe task definition error"))

	w := performECSRequest(handler, "GET", "/ecs/task-definitions/test-task:1", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe task definition")
}

func TestECS_DeregisterTaskDefinition_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DeregisterTaskDefinition(mock.Anything, mock.MatchedBy(func(in *ecs.DeregisterTaskDefinitionInput) bool {
		return in.TaskDefinition != nil && *in.TaskDefinition == "test-task:1"
	})).Return(&ecs.DeregisterTaskDefinitionOutput{}, nil)

	w := performECSRequest(handler, "DELETE", "/ecs/task-definitions/test-task:1", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DeregisterTaskDefinition_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DeregisterTaskDefinition(mock.Anything, mock.Anything).Return(nil, errors.New("deregister task definition error"))

	w := performECSRequest(handler, "DELETE", "/ecs/task-definitions/test-task:1", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to deregister task definition")
}

func TestECS_ListTaskDefinitionFamilies_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTaskDefinitionFamilies(mock.Anything, mock.Anything).Return(&ecs.ListTaskDefinitionFamiliesOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/task-definition-families", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_ListTaskDefinitionFamilies_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTaskDefinitionFamilies(mock.Anything, mock.Anything).Return(nil, errors.New("list task definition families error"))

	w := performECSRequest(handler, "GET", "/ecs/task-definition-families", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list task definition families")
}

func TestECS_ListTaskDefinitionFamilies_Filters(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTaskDefinitionFamilies(mock.Anything, mock.MatchedBy(func(in *ecs.ListTaskDefinitionFamiliesInput) bool {
		return in.FamilyPrefix != nil && *in.FamilyPrefix == "test" &&
			in.Status == types.TaskDefinitionFamilyStatusActive
	})).Return(&ecs.ListTaskDefinitionFamiliesOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/task-definition-families", []byte(`{"FamilyPrefix":"test","Status":"ACTIVE"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

func TestECS_RunTask_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().RunTask(mock.Anything, mock.MatchedBy(func(in *ecs.RunTaskInput) bool {
		return in.Cluster != nil && *in.Cluster == "test-cluster" &&
			in.TaskDefinition != nil && *in.TaskDefinition == "test-task"
	})).Return(&ecs.RunTaskOutput{}, nil)

	w := performECSRequest(handler, "POST", "/ecs/tasks", []byte(`{"Cluster":"test-cluster","TaskDefinition":"test-task"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_RunTask_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().RunTask(mock.Anything, mock.Anything).Return(nil, errors.New("run task error"))

	w := performECSRequest(handler, "POST", "/ecs/tasks", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to run task")
}

func TestECS_ListTasks_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTasks(mock.Anything, mock.Anything).Return(&ecs.ListTasksOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/tasks", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_ListTasks_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTasks(mock.Anything, mock.Anything).Return(nil, errors.New("list tasks error"))

	w := performECSRequest(handler, "GET", "/ecs/tasks", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list tasks")
}

func TestECS_ListTasks_Filters(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTasks(mock.Anything, mock.MatchedBy(func(in *ecs.ListTasksInput) bool {
		return in.Cluster != nil && *in.Cluster == "test-cluster" &&
			in.Family != nil && *in.Family == "test-task" &&
			in.ServiceName != nil && *in.ServiceName == "test-svc" &&
			in.DesiredStatus == types.DesiredStatusRunning
	})).Return(&ecs.ListTasksOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/tasks", []byte(`{"Cluster":"test-cluster","Family":"test-task","ServiceName":"test-svc","Status":"RUNNING"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_ListTasks_QueryParams(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListTasks(mock.Anything, mock.MatchedBy(func(in *ecs.ListTasksInput) bool {
		return in.Cluster != nil && *in.Cluster == "test-cluster" &&
			in.Family != nil && *in.Family == "test-task" &&
			in.ServiceName != nil && *in.ServiceName == "test-svc" &&
			in.DesiredStatus == types.DesiredStatusRunning &&
			in.NextToken != nil && *in.NextToken == "token1" &&
			in.MaxResults != nil && *in.MaxResults == 10
	})).Return(&ecs.ListTasksOutput{}, nil)

	// The frontend sends list filters as a query string, not a body.
	w := performECSRequest(handler, "GET", "/ecs/tasks?Cluster=test-cluster&Family=test-task&ServiceName=test-svc&Status=RUNNING&NextToken=token1&MaxResults=10", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DescribeTasks_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeTasks(mock.Anything, mock.MatchedBy(func(in *ecs.DescribeTasksInput) bool {
		return len(in.Tasks) == 1 && in.Tasks[0] == "task-arn-1" &&
			in.Cluster != nil && *in.Cluster == "test-cluster"
	})).Return(&ecs.DescribeTasksOutput{}, nil)

	// The frontend sends the cluster as a query param, not a body.
	w := performECSRequest(handler, "GET", "/ecs/tasks/task-arn-1?Cluster=test-cluster", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DescribeTasks_NoCluster(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeTasks(mock.Anything, mock.MatchedBy(func(in *ecs.DescribeTasksInput) bool {
		return len(in.Tasks) == 1 && in.Tasks[0] == "task-arn-1" && in.Cluster == nil
	})).Return(&ecs.DescribeTasksOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/tasks/task-arn-1", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DescribeTasks_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeTasks(mock.Anything, mock.Anything).Return(nil, errors.New("describe tasks error"))

	w := performECSRequest(handler, "GET", "/ecs/tasks/task-arn-1", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe tasks")
}

func TestECS_StopTask_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().StopTask(mock.Anything, mock.MatchedBy(func(in *ecs.StopTaskInput) bool {
		return in.Task != nil && *in.Task == "task-arn-1" &&
			in.Cluster != nil && *in.Cluster == "test-cluster" &&
			in.Reason != nil && *in.Reason == "test reason"
	})).Return(&ecs.StopTaskOutput{}, nil)

	w := performECSRequest(handler, "POST", "/ecs/tasks/stop", []byte(`{"Task":"task-arn-1","Cluster":"test-cluster","Reason":"test reason"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_StopTask_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().StopTask(mock.Anything, mock.Anything).Return(nil, errors.New("stop task error"))

	w := performECSRequest(handler, "POST", "/ecs/tasks/stop", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to stop task")
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

func TestECS_ListServices_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListServices(mock.Anything, mock.Anything).Return(&ecs.ListServicesOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/services", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_ListServices_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListServices(mock.Anything, mock.Anything).Return(nil, errors.New("list services error"))

	w := performECSRequest(handler, "GET", "/ecs/services", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list services")
}

func TestECS_ListServices_ClusterFilter(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListServices(mock.Anything, mock.MatchedBy(func(in *ecs.ListServicesInput) bool {
		return in.Cluster != nil && *in.Cluster == "test-cluster"
	})).Return(&ecs.ListServicesOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/services", []byte(`{"Cluster":"test-cluster"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_ListServices_QueryParams(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().ListServices(mock.Anything, mock.MatchedBy(func(in *ecs.ListServicesInput) bool {
		return in.Cluster != nil && *in.Cluster == "test-cluster" &&
			in.NextToken != nil && *in.NextToken == "token1" &&
			in.MaxResults != nil && *in.MaxResults == 10
	})).Return(&ecs.ListServicesOutput{}, nil)

	// The frontend sends list filters as a query string, not a body.
	w := performECSRequest(handler, "GET", "/ecs/services?Cluster=test-cluster&NextToken=token1&MaxResults=10", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_CreateService_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().CreateService(mock.Anything, mock.MatchedBy(func(in *ecs.CreateServiceInput) bool {
		return in.ServiceName != nil && *in.ServiceName == "test-svc" &&
			in.TaskDefinition != nil && *in.TaskDefinition == "test-task" &&
			in.DesiredCount != nil && *in.DesiredCount == 1
	})).Return(&ecs.CreateServiceOutput{}, nil)

	w := performECSRequest(handler, "POST", "/ecs/services", []byte(`{"ServiceName":"test-svc","TaskDefinition":"test-task","DesiredCount":1}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_CreateService_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().CreateService(mock.Anything, mock.Anything).Return(nil, errors.New("create service error"))

	w := performECSRequest(handler, "POST", "/ecs/services", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create service")
}

func TestECS_DescribeServices_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeServices(mock.Anything, mock.MatchedBy(func(in *ecs.DescribeServicesInput) bool {
		return len(in.Services) == 1 && in.Services[0] == "test-svc" &&
			in.Cluster != nil && *in.Cluster == "test-cluster"
	})).Return(&ecs.DescribeServicesOutput{}, nil)

	// The frontend sends the cluster as a query param, not a body.
	w := performECSRequest(handler, "GET", "/ecs/services/test-svc?Cluster=test-cluster", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DescribeServices_NoCluster(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeServices(mock.Anything, mock.MatchedBy(func(in *ecs.DescribeServicesInput) bool {
		return len(in.Services) == 1 && in.Services[0] == "test-svc" && in.Cluster == nil
	})).Return(&ecs.DescribeServicesOutput{}, nil)

	w := performECSRequest(handler, "GET", "/ecs/services/test-svc", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DescribeServices_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DescribeServices(mock.Anything, mock.Anything).Return(nil, errors.New("describe services error"))

	w := performECSRequest(handler, "GET", "/ecs/services/test-svc", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe services")
}

func TestECS_DeleteService_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DeleteService(mock.Anything, mock.MatchedBy(func(in *ecs.DeleteServiceInput) bool {
		return in.Service != nil && *in.Service == "test-svc" &&
			in.Cluster != nil && *in.Cluster == "test-cluster" &&
			in.Force != nil && *in.Force
	})).Return(&ecs.DeleteServiceOutput{}, nil)

	w := performECSRequest(handler, "DELETE", "/ecs/services/test-svc", []byte(`{"Cluster":"test-cluster","Force":true}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestECS_DeleteService_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupECSTest(t)
	mp.EXPECT().DeleteService(mock.Anything, mock.Anything).Return(nil, errors.New("delete service error"))

	w := performECSRequest(handler, "DELETE", "/ecs/services/test-svc", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete service")
}

// ---------------------------------------------------------------------------
// Invalid request body → 400
// ---------------------------------------------------------------------------

func TestECS_InvalidBody(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		method string
		path   string
		body   string
	}{
		{name: "CreateCluster", method: "POST", path: "/ecs/clusters", body: `{invalid`},
		{name: "RegisterTaskDefinition", method: "POST", path: "/ecs/task-definitions", body: `{invalid`},
		{name: "RunTask", method: "POST", path: "/ecs/tasks", body: `{invalid`},
		{name: "CreateService", method: "POST", path: "/ecs/services", body: `{invalid`},
		{name: "ListClusters", method: "GET", path: "/ecs/clusters", body: `{invalid`},
		{name: "ListTasks", method: "GET", path: "/ecs/tasks", body: `{invalid`},
		{name: "ListServices", method: "GET", path: "/ecs/services", body: `{invalid`},
		{name: "StopTask", method: "POST", path: "/ecs/tasks/stop", body: `{invalid`},
		{name: "DeleteService", method: "DELETE", path: "/ecs/services/test-svc", body: `{invalid`},
	}
	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupECSTest(t)
			w := performECSRequest(handler, tt.method, tt.path, []byte(tt.body))
			assert.Equal(t, http.StatusBadRequest, w.Code)
			var resp map[string]interface{}
			assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}

// ---------------------------------------------------------------------------
// ResourceNotFoundException → 404
// ---------------------------------------------------------------------------

func TestECS_NotFound(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		body      string
		setupMock func(mp *mockports.ECSPort)
	}{
		{name: "ListClusters", method: "GET", path: "/ecs/clusters", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().ListClusters(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "CreateCluster", method: "POST", path: "/ecs/clusters", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().CreateCluster(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "DescribeClusters", method: "GET", path: "/ecs/clusters/test-cluster", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().DescribeClusters(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "DeleteCluster", method: "DELETE", path: "/ecs/clusters/test-cluster", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().DeleteCluster(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "ListTaskDefinitions", method: "GET", path: "/ecs/task-definitions", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().ListTaskDefinitions(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "RegisterTaskDefinition", method: "POST", path: "/ecs/task-definitions", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().RegisterTaskDefinition(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "DescribeTaskDefinition", method: "GET", path: "/ecs/task-definitions/test-task:1", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().DescribeTaskDefinition(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "DeregisterTaskDefinition", method: "DELETE", path: "/ecs/task-definitions/test-task:1", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().DeregisterTaskDefinition(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "ListTaskDefinitionFamilies", method: "GET", path: "/ecs/task-definition-families", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().ListTaskDefinitionFamilies(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "RunTask", method: "POST", path: "/ecs/tasks", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().RunTask(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "ListTasks", method: "GET", path: "/ecs/tasks", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().ListTasks(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "DescribeTasks", method: "GET", path: "/ecs/tasks/task-arn-1", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().DescribeTasks(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "StopTask", method: "POST", path: "/ecs/tasks/stop", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().StopTask(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "ListServices", method: "GET", path: "/ecs/services", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().ListServices(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "CreateService", method: "POST", path: "/ecs/services", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().CreateService(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "DescribeServices", method: "GET", path: "/ecs/services/test-svc", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().DescribeServices(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
		{name: "DeleteService", method: "DELETE", path: "/ecs/services/test-svc", body: `{}`,
			setupMock: func(mp *mockports.ECSPort) {
				mp.EXPECT().DeleteService(mock.Anything, mock.Anything).Return(nil, &mockNotFoundError{})
			}},
	}
	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			_, mp, handler := setupECSTest(t)
			tt.setupMock(mp)
			w := performECSRequest(handler, tt.method, tt.path, []byte(tt.body))
			assert.Equal(t, http.StatusNotFound, w.Code)
		})
	}
}
