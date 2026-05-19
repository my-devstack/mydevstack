package httphandlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/gin-gonic/gin"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func setupKinesisTest(t *testing.T) (*mockports.ProxyService, *mockports.KinesisPort, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	mp := mockports.NewKinesisPort(t)
	svc.EXPECT().Kinesis().Return(mp).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, mp, handler
}

func performKinesisRequest(handler *ProxyHandler, target string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, "POST", "/kinesis/", target, body)
}

// ---------------------------------------------------------------------------
// Unknown action – returns 404
// ---------------------------------------------------------------------------

func TestKinesis_UnknownAction(t *testing.T) {
	t.Parallel()
	_, _, handler := setupKinesisTest(t)

	w := performKinesisRequest(handler, "UnknownKinesisAction", []byte(`{}`))
	assert.Equal(t, http.StatusNotFound, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Kinesis operation not supported")
}

// ---------------------------------------------------------------------------
// ListStreams
// ---------------------------------------------------------------------------

func TestKinesis_ListStreams_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().ListStreams(mock.Anything, mock.Anything).Return(&kinesis.ListStreamsOutput{}, nil)

	w := performKinesisRequest(handler, "ListStreams", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_ListStreams_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().ListStreams(mock.Anything, mock.Anything).Return(nil, errors.New("list streams error"))

	w := performKinesisRequest(handler, "ListStreams", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to list streams")
}

// ---------------------------------------------------------------------------
// CreateStream
// ---------------------------------------------------------------------------

func TestKinesis_CreateStream_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().CreateStream(mock.Anything, mock.Anything).Return(&kinesis.CreateStreamOutput{}, nil)

	w := performKinesisRequest(handler, "CreateStream", []byte(`{"StreamName":"test-stream","ShardCount":1}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_CreateStream_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().CreateStream(mock.Anything, mock.Anything).Return(nil, errors.New("create stream error"))

	w := performKinesisRequest(handler, "CreateStream", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to create stream")
}

// ---------------------------------------------------------------------------
// DeleteStream
// ---------------------------------------------------------------------------

func TestKinesis_DeleteStream_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DeleteStream(mock.Anything, mock.Anything).Return(&kinesis.DeleteStreamOutput{}, nil)

	w := performKinesisRequest(handler, "DeleteStream", []byte(`{"StreamName":"test-stream"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_DeleteStream_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DeleteStream(mock.Anything, mock.Anything).Return(nil, errors.New("delete stream error"))

	w := performKinesisRequest(handler, "DeleteStream", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to delete stream")
}

// ---------------------------------------------------------------------------
// DescribeStream (also receives DescribeStreamSummary due to dispatch ordering)
// ---------------------------------------------------------------------------

func TestKinesis_DescribeStream_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DescribeStream(mock.Anything, mock.Anything).Return(&kinesis.DescribeStreamOutput{}, nil)

	w := performKinesisRequest(handler, "DescribeStream", []byte(`{"StreamName":"test-stream"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_DescribeStream_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DescribeStream(mock.Anything, mock.Anything).Return(nil, errors.New("describe stream error"))

	w := performKinesisRequest(handler, "DescribeStream", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to describe stream")
}

// ---------------------------------------------------------------------------
// DescribeStreamSummary – through the router this hits "DescribeStream"
// first.  Test the actual handler directly.
// ---------------------------------------------------------------------------

func TestKinesis_DescribeStreamSummary_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DescribeStreamSummary(mock.Anything, mock.Anything).Return(
		&kinesis.DescribeStreamSummaryOutput{}, nil,
	)

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.describeStreamSummary(context.Background(), c, []byte(`{"StreamName":"test-stream"}`))

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_DescribeStreamSummary_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DescribeStreamSummary(mock.Anything, mock.Anything).Return(nil, errors.New("describe stream summary error"))

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.describeStreamSummary(context.Background(), c, []byte(`{}`))

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to describe stream summary")
}

// ---------------------------------------------------------------------------
// ListShards
// ---------------------------------------------------------------------------

func TestKinesis_ListShards_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().ListShards(mock.Anything, mock.Anything).Return(&kinesis.ListShardsOutput{}, nil)

	w := performKinesisRequest(handler, "ListShards", []byte(`{"StreamName":"test-stream"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_ListShards_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().ListShards(mock.Anything, mock.Anything).Return(nil, errors.New("list shards error"))

	w := performKinesisRequest(handler, "ListShards", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to list shards")
}

// ---------------------------------------------------------------------------
// GetShardIterator
// ---------------------------------------------------------------------------

func TestKinesis_GetShardIterator_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().GetShardIterator(mock.Anything, mock.Anything).Return(&kinesis.GetShardIteratorOutput{}, nil)

	w := performKinesisRequest(handler, "GetShardIterator", []byte(`{"StreamName":"test-stream","ShardId":"shard-000000","ShardIteratorType":"TRIM_HORIZON"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_GetShardIterator_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().GetShardIterator(mock.Anything, mock.Anything).Return(nil, errors.New("get shard iterator error"))

	w := performKinesisRequest(handler, "GetShardIterator", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to get shard iterator")
}

// ---------------------------------------------------------------------------
// GetRecords
// ---------------------------------------------------------------------------

func TestKinesis_GetRecords_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().GetRecords(mock.Anything, mock.Anything).Return(&kinesis.GetRecordsOutput{}, nil)

	w := performKinesisRequest(handler, "GetRecords", []byte(`{"ShardIterator":"AAAA...iterator"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_GetRecords_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().GetRecords(mock.Anything, mock.Anything).Return(nil, errors.New("get records error"))

	w := performKinesisRequest(handler, "GetRecords", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to get records")
}

// ---------------------------------------------------------------------------
// PutRecord (also receives PutRecords due to dispatch ordering)
// ---------------------------------------------------------------------------

func TestKinesis_PutRecord_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().PutRecord(mock.Anything, mock.Anything).Return(&kinesis.PutRecordOutput{}, nil)

	w := performKinesisRequest(handler, "PutRecord", []byte(`{"StreamName":"test-stream","Data":"dGVzdA==","PartitionKey":"pk-1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_PutRecord_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().PutRecord(mock.Anything, mock.Anything).Return(nil, errors.New("put record error"))

	w := performKinesisRequest(handler, "PutRecord", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to put record")
}

// ---------------------------------------------------------------------------
// PutRecords – through the router this hits "PutRecord" first.
// Test the actual handler directly.
// ---------------------------------------------------------------------------

func TestKinesis_PutRecords_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().PutRecords(mock.Anything, mock.Anything).Return(&kinesis.PutRecordsOutput{}, nil)

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.putRecords(context.Background(), c, []byte(`{"StreamName":"test-stream","Records":[{"Data":"dGVzdA==","PartitionKey":"pk-1"}]}`))

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_PutRecords_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().PutRecords(mock.Anything, mock.Anything).Return(nil, errors.New("put records error"))

	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest("POST", "/", nil)
	handler.putRecords(context.Background(), c, []byte(`{}`))

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to put records")
}

// ---------------------------------------------------------------------------
// MergeShards
// ---------------------------------------------------------------------------

func TestKinesis_MergeShards_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().MergeShards(mock.Anything, mock.Anything).Return(&kinesis.MergeShardsOutput{}, nil)

	w := performKinesisRequest(handler, "MergeShards", []byte(`{"StreamName":"test-stream","ShardToMerge":"shard-000000","AdjacentShardToMerge":"shard-000001"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_MergeShards_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().MergeShards(mock.Anything, mock.Anything).Return(nil, errors.New("merge shards error"))

	w := performKinesisRequest(handler, "MergeShards", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to merge shards")
}

// ---------------------------------------------------------------------------
// SplitShard
// ---------------------------------------------------------------------------

func TestKinesis_SplitShard_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().SplitShard(mock.Anything, mock.Anything).Return(&kinesis.SplitShardOutput{}, nil)

	w := performKinesisRequest(handler, "SplitShard", []byte(`{"StreamName":"test-stream","ShardToSplit":"shard-000000","NewStartingHashKey":"0"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_SplitShard_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().SplitShard(mock.Anything, mock.Anything).Return(nil, errors.New("split shard error"))

	w := performKinesisRequest(handler, "SplitShard", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to split shard")
}

// ---------------------------------------------------------------------------
// UpdateShardCount
// ---------------------------------------------------------------------------

func TestKinesis_UpdateShardCount_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().UpdateShardCount(mock.Anything, mock.Anything).Return(&kinesis.UpdateShardCountOutput{}, nil)

	w := performKinesisRequest(handler, "UpdateShardCount", []byte(`{"StreamName":"test-stream","TargetShardCount":2,"ScalingType":"UNIFORM_SCALING"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_UpdateShardCount_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().UpdateShardCount(mock.Anything, mock.Anything).Return(nil, errors.New("update shard count error"))

	w := performKinesisRequest(handler, "UpdateShardCount", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to update shard count")
}

// ---------------------------------------------------------------------------
// EnableEnhancedMonitoring
// ---------------------------------------------------------------------------

func TestKinesis_EnableEnhancedMonitoring_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().EnableEnhancedMonitoring(mock.Anything, mock.Anything).Return(&kinesis.EnableEnhancedMonitoringOutput{}, nil)

	w := performKinesisRequest(handler, "EnableEnhancedMonitoring", []byte(`{"StreamName":"test-stream","ShardLevelMetrics":["IncomingBytes"]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_EnableEnhancedMonitoring_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().EnableEnhancedMonitoring(mock.Anything, mock.Anything).Return(nil, errors.New("enable enhanced monitoring error"))

	w := performKinesisRequest(handler, "EnableEnhancedMonitoring", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to enable enhanced monitoring")
}

// ---------------------------------------------------------------------------
// DisableEnhancedMonitoring
// ---------------------------------------------------------------------------

func TestKinesis_DisableEnhancedMonitoring_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DisableEnhancedMonitoring(mock.Anything, mock.Anything).Return(&kinesis.DisableEnhancedMonitoringOutput{}, nil)

	w := performKinesisRequest(handler, "DisableEnhancedMonitoring", []byte(`{"StreamName":"test-stream","ShardLevelMetrics":["IncomingBytes"]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_DisableEnhancedMonitoring_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DisableEnhancedMonitoring(mock.Anything, mock.Anything).Return(nil, errors.New("disable enhanced monitoring error"))

	w := performKinesisRequest(handler, "DisableEnhancedMonitoring", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Contains(t, resp["error"], "Failed to disable enhanced monitoring")
}

// ---------------------------------------------------------------------------
// Parse error – router-reachable actions
// ---------------------------------------------------------------------------

func TestKinesis_ParseError(t *testing.T) {
	t.Parallel()

	actions := []string{
		"ListStreams", "CreateStream", "DeleteStream",
		"DescribeStream",
		"ListShards", "GetShardIterator", "GetRecords",
		"PutRecord",
		"MergeShards", "SplitShard", "UpdateShardCount",
		"EnableEnhancedMonitoring", "DisableEnhancedMonitoring",
	}

	for _, action := range actions {
		action := action
		t.Run(action, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupKinesisTest(t)
			w := performKinesisRequest(handler, action, []byte(`{bad json`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "action=%s body=%s", action, w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}

// ---------------------------------------------------------------------------
// Parse error – actions shadowed by router dispatch
// ---------------------------------------------------------------------------

func TestKinesis_ParseError_Direct(t *testing.T) {
	t.Parallel()

	type directCase struct {
		name    string
		handler func(*ProxyHandler, *gin.Context, []byte)
	}

	cases := []directCase{
		{
			name: "DescribeStreamSummary",
			handler: func(h *ProxyHandler, c *gin.Context, body []byte) {
				h.describeStreamSummary(context.Background(), c, body)
			},
		},
		{
			name: "PutRecords",
			handler: func(h *ProxyHandler, c *gin.Context, body []byte) {
				h.putRecords(context.Background(), c, body)
			},
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupKinesisTest(t)

			gin.SetMode(gin.TestMode)
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)
			c.Request = httptest.NewRequest("POST", "/", nil)

			tc.handler(handler, c, []byte(`{bad json`))

			assert.Equal(t, http.StatusBadRequest, w.Code, "body=%s", w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}
