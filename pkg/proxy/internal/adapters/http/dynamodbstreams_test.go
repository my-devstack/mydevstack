package httphandlers

import (
	"context"
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
)

// ---------------------------------------------------------------------------
// TestHandleDynamoDBStreams – success and error paths
// ---------------------------------------------------------------------------

func TestHandleDynamoDBStreams_ListStreams(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().ListStreams(mock.Anything, mock.Anything).Return(&dynamodbstreams.ListStreamsOutput{}, nil)
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/dynamodb-streams/streams", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().ListStreams(mock.Anything, mock.Anything).Return(nil, errors.New("list streams error"))
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/dynamodb-streams/streams", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestHandleDynamoDBStreams_DescribeStream(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().DescribeStream(mock.Anything, mock.Anything).Return(&dynamodbstreams.DescribeStreamOutput{}, nil)
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/dynamodb-streams/streams/myStreamArn", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().DescribeStream(mock.Anything, mock.Anything).Return(nil, errors.New("describe stream error"))
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/dynamodb-streams/streams/myStreamArn", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestHandleDynamoDBStreams_GetShardIterator(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().GetShardIterator(mock.Anything, mock.Anything).Return(&dynamodbstreams.GetShardIteratorOutput{}, nil)
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/iterator", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().GetShardIterator(mock.Anything, mock.Anything).Return(nil, errors.New("shard iterator error"))
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/iterator", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("GET success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().GetShardIterator(mock.Anything, mock.Anything).Return(&dynamodbstreams.GetShardIteratorOutput{}, nil)
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/iterator?shardIteratorType=TRIM_HORIZON", nil)
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("GET success with optional params", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().GetShardIterator(mock.Anything, mock.Anything).Return(&dynamodbstreams.GetShardIteratorOutput{}, nil)
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/iterator?shardIteratorType=AT_SEQUENCE_NUMBER&startingSequenceNumber=12345", nil)
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("GET invalid startingTimestamp", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/iterator?shardIteratorType=AT_TIMESTAMP&startingTimestamp=not-a-timestamp", nil)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestHandleDynamoDBStreams_GetRecords(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().GetRecords(mock.Anything, mock.Anything).Return(&dynamodbstreams.GetRecordsOutput{}, nil)
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/records", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().GetRecords(mock.Anything, mock.Anything).Return(nil, errors.New("get records error"))
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/records", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("GET success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBStreamsPort(t)
		mp.EXPECT().GetRecords(mock.Anything, mock.Anything).Return(&dynamodbstreams.GetRecordsOutput{}, nil)
		svc.EXPECT().DynamoDBStreams().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/records?shardIterator=abc123&limit=10", nil)
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("GET invalid limit", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/records?shardIterator=abc123&limit=not-a-number", nil)
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Parse error tests – handlers return before calling DynamoDBStreams()
// ---------------------------------------------------------------------------

func TestHandleDynamoDBStreams_ParseErrors(t *testing.T) {
	t.Parallel()

	type parseCase struct {
		name   string
		path   string
		method string
	}

	// Only include actions whose handlers call parseBody.
	// DescribeStream handler uses URL param (streamArn) and does not parse body.
	cases := []parseCase{
		{name: "ListStreams", path: "/dynamodb-streams/streams", method: "GET"},
		{name: "GetShardIterator", path: "/dynamodb-streams/streams/myStreamArn/shards/myShardId/iterator", method: "POST"},
		{name: "GetRecords", path: "/dynamodb-streams/streams/myStreamArn/shards/myShardId/records", method: "POST"},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			// No DynamoDBStreams() expectation – handler returns before calling it.
			versionSvc := createTestVersionService(t)
			handler := NewProxyHandler(context.Background(), svc, versionSvc)
			r := setupTestRouter(handler)
			w := performRequest(r, tc.method, tc.path, []byte("{bad json}"))
			assert.Equal(t, http.StatusBadRequest, w.Code, "path=%s", tc.path)
		})
	}
}

func TestHandleDynamoDBStreams_DeprecatedPOST_Shards(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	mp := mockports.NewDynamoDBStreamsPort(t)
	mp.EXPECT().GetShardIterator(mock.Anything, mock.Anything).Return(&dynamodbstreams.GetShardIteratorOutput{}, nil).Times(2)
	mp.EXPECT().GetRecords(mock.Anything, mock.Anything).Return(&dynamodbstreams.GetRecordsOutput{}, nil).Times(2)
	svc.EXPECT().DynamoDBStreams().Return(mp).Times(4)
	versionSvc := createTestVersionService(t)
	handler := NewProxyHandler(context.Background(), svc, versionSvc)
	r := setupTestRouter(handler)
	// POST twin for iterator must carry Deprecation: true + Warning header.
	w := performRequest(r, "POST", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/iterator", []byte(`{"ShardIteratorType":"TRIM_HORIZON"}`))
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "true", w.Header().Get("Deprecation"))
	assert.Contains(t, w.Header().Get("Warning"), "Deprecated endpoint")
	// POST twin for records must also carry Deprecation: true.
	w2 := performRequest(r, "POST", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/records", []byte(`{"ShardIterator":"abc"}`))
	assert.Equal(t, http.StatusOK, w2.Code)
	assert.Equal(t, "true", w2.Header().Get("Deprecation"))
	assert.Contains(t, w2.Header().Get("Warning"), "Deprecated endpoint")
	// GET twins must NOT carry Deprecation header.
	w3 := performRequest(r, "GET", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/iterator?shardIteratorType=TRIM_HORIZON", nil)
	assert.Equal(t, http.StatusOK, w3.Code)
	assert.Empty(t, w3.Header().Get("Deprecation"))
	w4 := performRequest(r, "GET", "/dynamodb-streams/streams/myStreamArn/shards/myShardId/records?shardIterator=abc&limit=10", nil)
	assert.Equal(t, http.StatusOK, w4.Code)
	assert.Empty(t, w4.Header().Get("Deprecation"))
}


