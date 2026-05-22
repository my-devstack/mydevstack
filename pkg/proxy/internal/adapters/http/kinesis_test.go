package httphandlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/kinesis"
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

// ---------------------------------------------------------------------------
// ListStreams
// ---------------------------------------------------------------------------

func TestKinesis_ListStreams_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().ListStreams(mock.Anything, mock.Anything).Return(&kinesis.ListStreamsOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/kinesis/streams", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_ListStreams_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().ListStreams(mock.Anything, mock.Anything).Return(nil, errors.New("list streams error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/kinesis/streams", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list streams")
}

// ---------------------------------------------------------------------------
// CreateStream
// ---------------------------------------------------------------------------

func TestKinesis_CreateStream_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().CreateStream(mock.Anything, mock.Anything).Return(&kinesis.CreateStreamOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams", []byte(`{"StreamName":"test-stream","ShardCount":1}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_CreateStream_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().CreateStream(mock.Anything, mock.Anything).Return(nil, errors.New("create stream error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create stream")
}

// ---------------------------------------------------------------------------
// DeleteStream
// ---------------------------------------------------------------------------

func TestKinesis_DeleteStream_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DeleteStream(mock.Anything, mock.Anything).Return(&kinesis.DeleteStreamOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "DELETE", "/kinesis/streams/teststream", []byte(`{"StreamName":"test-stream"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_DeleteStream_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DeleteStream(mock.Anything, mock.Anything).Return(nil, errors.New("delete stream error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "DELETE", "/kinesis/streams/teststream", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete stream")
}

// ---------------------------------------------------------------------------
// DescribeStream (also receives DescribeStreamSummary due to dispatch ordering)
// ---------------------------------------------------------------------------

func TestKinesis_DescribeStream_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DescribeStream(mock.Anything, mock.Anything).Return(&kinesis.DescribeStreamOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/kinesis/streams/teststream", []byte(`{"StreamName":"test-stream"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_DescribeStream_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DescribeStream(mock.Anything, mock.Anything).Return(nil, errors.New("describe stream error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/kinesis/streams/teststream", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
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

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.describeStreamSummary(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_DescribeStreamSummary_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DescribeStreamSummary(mock.Anything, mock.Anything).Return(nil, errors.New("describe stream summary error"))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.describeStreamSummary(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to describe stream summary")
}

// ---------------------------------------------------------------------------
// ListShards
// ---------------------------------------------------------------------------

func TestKinesis_ListShards_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().ListShards(mock.Anything, mock.Anything).Return(&kinesis.ListShardsOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/kinesis/streams/teststream/shards", []byte(`{"StreamName":"test-stream"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_ListShards_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().ListShards(mock.Anything, mock.Anything).Return(nil, errors.New("list shards error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/kinesis/streams/teststream/shards", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list shards")
}

// ---------------------------------------------------------------------------
// GetShardIterator
// ---------------------------------------------------------------------------

func TestKinesis_GetShardIterator_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().GetShardIterator(mock.Anything, mock.Anything).Return(&kinesis.GetShardIteratorOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/shards/testshard/iterator", []byte(`{"StreamName":"test-stream","ShardId":"shard-000000","ShardIteratorType":"TRIM_HORIZON"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_GetShardIterator_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().GetShardIterator(mock.Anything, mock.Anything).Return(nil, errors.New("get shard iterator error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/shards/testshard/iterator", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get shard iterator")
}

// ---------------------------------------------------------------------------
// GetRecords
// ---------------------------------------------------------------------------

func TestKinesis_GetRecords_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().GetRecords(mock.Anything, mock.Anything).Return(&kinesis.GetRecordsOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/kinesis/streams/teststream/shards/testshard/records", []byte(`{"ShardIterator":"AAAA...iterator"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_GetRecords_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().GetRecords(mock.Anything, mock.Anything).Return(nil, errors.New("get records error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/kinesis/streams/teststream/shards/testshard/records", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get records")
}

// ---------------------------------------------------------------------------
// PutRecord (also receives PutRecords due to dispatch ordering)
// ---------------------------------------------------------------------------

func TestKinesis_PutRecord_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().PutRecord(mock.Anything, mock.Anything).Return(&kinesis.PutRecordOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/records", []byte(`{"StreamName":"test-stream","Data":"dGVzdA==","PartitionKey":"pk-1"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_PutRecord_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().PutRecord(mock.Anything, mock.Anything).Return(nil, errors.New("put record error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/records", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
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

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.putRecords(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_PutRecords_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().PutRecords(mock.Anything, mock.Anything).Return(nil, errors.New("put records error"))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/", nil)
	handler.putRecords(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to put records")
}

// ---------------------------------------------------------------------------
// MergeShards
// ---------------------------------------------------------------------------

func TestKinesis_MergeShards_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().MergeShards(mock.Anything, mock.Anything).Return(&kinesis.MergeShardsOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/shards/testshard/merge", []byte(`{"StreamName":"test-stream","ShardToMerge":"shard-000000","AdjacentShardToMerge":"shard-000001"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_MergeShards_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().MergeShards(mock.Anything, mock.Anything).Return(nil, errors.New("merge shards error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/shards/testshard/merge", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to merge shards")
}

// ---------------------------------------------------------------------------
// SplitShard
// ---------------------------------------------------------------------------

func TestKinesis_SplitShard_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().SplitShard(mock.Anything, mock.Anything).Return(&kinesis.SplitShardOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/shards/testshard/split", []byte(`{"StreamName":"test-stream","ShardToSplit":"shard-000000","NewStartingHashKey":"0"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_SplitShard_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().SplitShard(mock.Anything, mock.Anything).Return(nil, errors.New("split shard error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/shards/testshard/split", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to split shard")
}

// ---------------------------------------------------------------------------
// UpdateShardCount
// ---------------------------------------------------------------------------

func TestKinesis_UpdateShardCount_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().UpdateShardCount(mock.Anything, mock.Anything).Return(&kinesis.UpdateShardCountOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "PUT", "/kinesis/streams/teststream", []byte(`{"StreamName":"test-stream","TargetShardCount":2,"ScalingType":"UNIFORM_SCALING"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_UpdateShardCount_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().UpdateShardCount(mock.Anything, mock.Anything).Return(nil, errors.New("update shard count error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "PUT", "/kinesis/streams/teststream", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to update shard count")
}

// ---------------------------------------------------------------------------
// EnableEnhancedMonitoring
// ---------------------------------------------------------------------------

func TestKinesis_EnableEnhancedMonitoring_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().EnableEnhancedMonitoring(mock.Anything, mock.Anything).Return(&kinesis.EnableEnhancedMonitoringOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/enhanced-monitoring", []byte(`{"StreamName":"test-stream","ShardLevelMetrics":["IncomingBytes"]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_EnableEnhancedMonitoring_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().EnableEnhancedMonitoring(mock.Anything, mock.Anything).Return(nil, errors.New("enable enhanced monitoring error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/kinesis/streams/teststream/enhanced-monitoring", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to enable enhanced monitoring")
}

// ---------------------------------------------------------------------------
// DisableEnhancedMonitoring
// ---------------------------------------------------------------------------

func TestKinesis_DisableEnhancedMonitoring_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DisableEnhancedMonitoring(mock.Anything, mock.Anything).Return(&kinesis.DisableEnhancedMonitoringOutput{}, nil)

	r := setupTestRouter(handler)
	w := performRequest(r, "DELETE", "/kinesis/streams/teststream/enhanced-monitoring", []byte(`{"StreamName":"test-stream","ShardLevelMetrics":["IncomingBytes"]}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestKinesis_DisableEnhancedMonitoring_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupKinesisTest(t)
	mp.EXPECT().DisableEnhancedMonitoring(mock.Anything, mock.Anything).Return(nil, errors.New("disable enhanced monitoring error"))

	r := setupTestRouter(handler)
	w := performRequest(r, "DELETE", "/kinesis/streams/teststream/enhanced-monitoring", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to disable enhanced monitoring")
}

// ---------------------------------------------------------------------------
// Parse error – router-reachable actions
// ---------------------------------------------------------------------------

func TestKinesis_ParseError(t *testing.T) {
	t.Parallel()

	// Only include actions whose handlers call parseBody.
	// DeleteStream and DescribeStream handlers use URL params, not body parse.
	type parseCase struct {
		name   string
		method string
		path   string
	}

	actions := []parseCase{
		{name: "ListStreams", method: "GET", path: "/kinesis/streams"},
		{name: "CreateStream", method: "POST", path: "/kinesis/streams"},
		{name: "ListShards", method: "GET", path: "/kinesis/streams/teststream/shards"},
		{name: "GetShardIterator", method: "POST", path: "/kinesis/streams/teststream/shards/testshard/iterator"},
		{name: "GetRecords", method: "GET", path: "/kinesis/streams/teststream/shards/testshard/records"},
		{name: "PutRecord", method: "POST", path: "/kinesis/streams/teststream/records"},
		{name: "MergeShards", method: "POST", path: "/kinesis/streams/teststream/shards/testshard/merge"},
		{name: "SplitShard", method: "POST", path: "/kinesis/streams/teststream/shards/testshard/split"},
		{name: "UpdateShardCount", method: "PUT", path: "/kinesis/streams/teststream"},
		{name: "EnableEnhancedMonitoring", method: "POST", path: "/kinesis/streams/teststream/enhanced-monitoring"},
		{name: "DisableEnhancedMonitoring", method: "DELETE", path: "/kinesis/streams/teststream/enhanced-monitoring"},
	}

	for _, action := range actions {
		action := action
		t.Run(action.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupKinesisTest(t)
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

// ---------------------------------------------------------------------------
// Parse error – actions shadowed by router dispatch
// ---------------------------------------------------------------------------

func TestKinesis_ParseError_Direct(t *testing.T) {
	t.Parallel()

	type directCase struct {
		name    string
		handler func(*ProxyHandler, http.ResponseWriter, *http.Request)
	}

	// Only include handlers that parse the request body.
	// DescribeStreamSummary uses URL params only and is excluded.
	cases := []directCase{
		{
			name: "PutRecords",
			handler: func(h *ProxyHandler, w http.ResponseWriter, r *http.Request) {
				h.putRecords(w, r)
			},
		},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupKinesisTest(t)

			w := httptest.NewRecorder()
			req := httptest.NewRequest("POST", "/", bytes.NewReader([]byte(`{bad json`)))

			tc.handler(handler, w, req)

			assert.Equal(t, http.StatusBadRequest, w.Code, "body=%s", w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}
