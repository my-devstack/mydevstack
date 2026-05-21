package httphandlers

import (
	"context"
	"encoding/json"
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
		w := performRequest(r, "POST", "/dynamodbstreams", "ListStreams", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodbstreams", "ListStreams", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodbstreams", "DescribeStream", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodbstreams", "DescribeStream", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodbstreams", "GetShardIterator", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodbstreams", "GetShardIterator", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
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
		w := performRequest(r, "POST", "/dynamodbstreams", "GetRecords", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodbstreams", "GetRecords", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Parse error tests – handlers return before calling DynamoDBStreams()
// ---------------------------------------------------------------------------

func TestHandleDynamoDBStreams_ParseErrors(t *testing.T) {
	t.Parallel()

	type parseCase struct {
		name   string
		target string
	}

	cases := []parseCase{
		{name: "ListStreams", target: "ListStreams"},
		{name: "DescribeStream", target: "DescribeStream"},
		{name: "GetShardIterator", target: "GetShardIterator"},
		{name: "GetRecords", target: "GetRecords"},
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
			w := performRequest(r, "POST", "/dynamodbstreams", tc.target, []byte("{bad json}"))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s", tc.target)
		})
	}
}

// ---------------------------------------------------------------------------
// Unknown DynamoDBStreams action → 404
// ---------------------------------------------------------------------------

func TestHandleDynamoDBStreams_UnknownAction(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	versionSvc := createTestVersionService(t)
	handler := NewProxyHandler(context.Background(), svc, versionSvc)
	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/dynamodbstreams", "UnknownStreamAction", []byte("{}"))
	assert.Equal(t, http.StatusNotFound, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "DynamoDBStreams operation not supported")
}
