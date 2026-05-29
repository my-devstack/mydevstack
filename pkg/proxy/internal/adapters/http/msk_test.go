package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kafka"
	"github.com/aws/aws-sdk-go-v2/service/kafka/types"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func setupMSKTest(t *testing.T) (*mockports.ProxyService, *mockports.MSKPort, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	mp := mockports.NewMSKPort(t)
	svc.EXPECT().MSK().Return(mp).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, mp, handler
}

// ---------------------------------------------------------------------------
// ListClustersV2
// ---------------------------------------------------------------------------

func TestMSK_ListClustersV2_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	expected := &kafka.ListClustersV2Output{
		ClusterInfoList: []types.Cluster{
			{
				ClusterName: aws.String("test-cluster"),
				State:       types.ClusterStateActive,
			},
		},
	}
	mp.EXPECT().ListClustersV2(mock.Anything, mock.Anything).Return(expected, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/msk/clusters", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp kafka.ListClustersV2Output
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Len(t, resp.ClusterInfoList, 1)
	assert.Equal(t, "test-cluster", *resp.ClusterInfoList[0].ClusterName)
}

func TestMSK_ListClustersV2_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	mp.EXPECT().ListClustersV2(mock.Anything, mock.Anything).Return(nil, errors.New("list clusters error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/msk/clusters", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to list clusters")
}

// ---------------------------------------------------------------------------
// DescribeClusterV2
// ---------------------------------------------------------------------------

func TestMSK_DescribeClusterV2_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	mp.EXPECT().DescribeClusterV2(mock.Anything, mock.Anything).Return(&kafka.DescribeClusterV2Output{
		ClusterInfo: &types.Cluster{
			ClusterName: aws.String("test-cluster"),
		},
	}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/msk/clusters/testarn", []byte(`{"ClusterArn":"arn:aws:kafka:us-east-1:123:cluster/test"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp kafka.DescribeClusterV2Output
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotNil(t, resp.ClusterInfo)
}

func TestMSK_DescribeClusterV2_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	mp.EXPECT().DescribeClusterV2(mock.Anything, mock.Anything).Return(nil, errors.New("describe cluster error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/msk/clusters/testarn", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to describe cluster")
}

// ---------------------------------------------------------------------------
// CreateClusterV2
// ---------------------------------------------------------------------------

func TestMSK_CreateClusterV2_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	mp.EXPECT().CreateClusterV2(mock.Anything, mock.Anything).Return(&kafka.CreateClusterV2Output{
		ClusterArn: aws.String("arn:aws:kafka:us-east-1:123:cluster/new-cluster"),
	}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/msk/clusters", []byte(`{"ClusterName":"new-cluster"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp kafka.CreateClusterV2Output
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotNil(t, resp.ClusterArn)
}

func TestMSK_CreateClusterV2_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	mp.EXPECT().CreateClusterV2(mock.Anything, mock.Anything).Return(nil, errors.New("create cluster error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/msk/clusters", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to create cluster")
}

// ---------------------------------------------------------------------------
// DeleteCluster
// ---------------------------------------------------------------------------

func TestMSK_DeleteCluster_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	mp.EXPECT().DeleteCluster(mock.Anything, mock.Anything).Return(&kafka.DeleteClusterOutput{
		ClusterArn: aws.String("arn:aws:kafka:us-east-1:123:cluster/test"),
	}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "DELETE", "/msk/clusters/testarn", []byte(`{"ClusterArn":"arn:aws:kafka:us-east-1:123:cluster/test"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp kafka.DeleteClusterOutput
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotNil(t, resp.ClusterArn)
}

func TestMSK_DeleteCluster_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	mp.EXPECT().DeleteCluster(mock.Anything, mock.Anything).Return(nil, errors.New("delete cluster error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "DELETE", "/msk/clusters/testarn", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to delete cluster")
}

// ---------------------------------------------------------------------------
// GetBootstrapBrokers
// ---------------------------------------------------------------------------

func TestMSK_GetBootstrapBrokers_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	mp.EXPECT().GetBootstrapBrokers(mock.Anything, mock.Anything).Return(&kafka.GetBootstrapBrokersOutput{
		BootstrapBrokerString: aws.String("b-1.test.kafka.us-east-1.amazonaws.com:9092"),
	}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/msk/clusters/testarn/bootstrap-brokers", []byte(`{"ClusterArn":"arn:aws:kafka:us-east-1:123:cluster/test"}`))
	assert.Equal(t, http.StatusOK, w.Code)

	var resp kafka.GetBootstrapBrokersOutput
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotNil(t, resp.BootstrapBrokerString)
}

func TestMSK_GetBootstrapBrokers_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupMSKTest(t)

	mp.EXPECT().GetBootstrapBrokers(mock.Anything, mock.Anything).Return(nil, errors.New("get bootstrap brokers error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/msk/clusters/testarn/bootstrap-brokers", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Failed to get bootstrap brokers")
}

// ---------------------------------------------------------------------------
// Parse error – invalid JSON body returns 400 for every action
// ---------------------------------------------------------------------------

func TestMSK_ParseError(t *testing.T) {
	t.Parallel()

	// Only include actions whose handlers call parseBody.
	// DescribeClusterV2, DeleteCluster, GetBootstrapBrokers use URL params.
	type parseCase struct {
		name   string
		method string
		path   string
	}

	actions := []parseCase{
		{name: "ListClustersV2", method: "GET", path: "/msk/clusters"},
		{name: "CreateClusterV2", method: "POST", path: "/msk/clusters"},
	}

	for _, action := range actions {
		action := action
		t.Run(action.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupMSKTest(t)

			r := setupTestRouter(handler)
			w := performRequest(r, action.method, action.path, []byte(`{bad json`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "action=%s body=%s", action.name, w.Body.String())

			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}
