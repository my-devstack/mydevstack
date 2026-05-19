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

	"github.com/aws/aws-sdk-go-v2/service/lambda"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Lambda — ListFunctions
// ---------------------------------------------------------------------------

func TestLambda_ListFunctions(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().ListFunctions(mock.Anything, mock.Anything).Return(&lambda.ListFunctionsOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "ListFunctions", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().ListFunctions(mock.Anything, mock.Anything).Return(nil, errors.New("list error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "ListFunctions", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "ListFunctions", []byte(`{bad json`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — CreateFunction
// ---------------------------------------------------------------------------

func TestLambda_CreateFunction(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().CreateFunction(mock.Anything, mock.Anything).Return(&lambda.CreateFunctionOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "CreateFunction", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().CreateFunction(mock.Anything, mock.Anything).Return(nil, errors.New("create error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "CreateFunction", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "CreateFunction", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — GetFunction
// ---------------------------------------------------------------------------

func TestLambda_GetFunction(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().GetFunction(mock.Anything, mock.Anything).Return(&lambda.GetFunctionOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "GetFunction", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().GetFunction(mock.Anything, mock.Anything).Return(nil, errors.New("get error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "GetFunction", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "GetFunction", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — DeleteFunction
// ---------------------------------------------------------------------------

func TestLambda_DeleteFunction(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().DeleteFunction(mock.Anything, mock.Anything).Return(&lambda.DeleteFunctionOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "DeleteFunction", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().DeleteFunction(mock.Anything, mock.Anything).Return(nil, errors.New("delete error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "DeleteFunction", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "DeleteFunction", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — Invoke
// ---------------------------------------------------------------------------

func TestLambda_Invoke(t *testing.T) {
	t.Parallel()

	t.Run("success with Payload (base64 encoded)", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		payload := []byte(`{"statusCode":200}`)
		mp.EXPECT().Invoke(mock.Anything, mock.Anything).Return(&lambda.InvokeOutput{
			StatusCode: 200,
			Payload:    payload,
		}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "Invoke", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, float64(200), resp["StatusCode"])
		assert.Contains(t, resp, "Payload")
		// Payload should be base64 encoded
		_, ok := resp["Payload"].(string)
		assert.True(t, ok)
	})

	t.Run("success with FunctionError header", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		fnErr := "Unhandled"
		mp.EXPECT().Invoke(mock.Anything, mock.Anything).Return(&lambda.InvokeOutput{
			StatusCode:    200,
			FunctionError: &fnErr,
			Payload:       []byte(`{"errorType":"Error"}`),
		}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "Invoke", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "Unhandled", resp["FunctionError"])
		assert.Equal(t, "Unhandled", w.Header().Get("X-Amz-Function-Error"))
	})

	t.Run("success without payload", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().Invoke(mock.Anything, mock.Anything).Return(&lambda.InvokeOutput{
			StatusCode: 204,
		}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "Invoke", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, float64(204), resp["StatusCode"])
		assert.NotContains(t, resp, "Payload")
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().Invoke(mock.Anything, mock.Anything).Return(nil, errors.New("invoke error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "Invoke", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "Invoke", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — UpdateFunctionConfiguration
// ---------------------------------------------------------------------------

func TestLambda_UpdateFunctionConfiguration(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().UpdateFunctionConfiguration(mock.Anything, mock.Anything).Return(&lambda.UpdateFunctionConfigurationOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "UpdateFunctionConfiguration", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().UpdateFunctionConfiguration(mock.Anything, mock.Anything).Return(nil, errors.New("update error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "UpdateFunctionConfiguration", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "UpdateFunctionConfiguration", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — UpdateFunctionCode
// ---------------------------------------------------------------------------

func TestLambda_UpdateFunctionCode(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().UpdateFunctionCode(mock.Anything, mock.Anything).Return(&lambda.UpdateFunctionCodeOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "UpdateFunctionCode", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().UpdateFunctionCode(mock.Anything, mock.Anything).Return(nil, errors.New("update error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "UpdateFunctionCode", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "UpdateFunctionCode", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — GetFunctionConfiguration
//
// Note: The dispatch for "GetFunctionConfiguration" routes to the
// getFunction handler because strings.Contains("GetFunctionConfiguration",
// "GetFunction") is true and GetFunction is checked first.  These tests
// verify the actual behavior — mocking GetFunction, not
// GetFunctionConfiguration.
// ---------------------------------------------------------------------------

func TestLambda_GetFunctionConfiguration(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		// Dispatch bug: "GetFunctionConfiguration" matches "GetFunction" first.
		mp.EXPECT().GetFunction(mock.Anything, mock.Anything).Return(&lambda.GetFunctionOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "GetFunctionConfiguration", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		// Dispatch bug: "GetFunctionConfiguration" matches "GetFunction" first.
		mp.EXPECT().GetFunction(mock.Anything, mock.Anything).Return(nil, errors.New("get error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "GetFunctionConfiguration", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "GetFunctionConfiguration", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — ListEventSourceMappings
// ---------------------------------------------------------------------------

func TestLambda_ListEventSourceMappings(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().ListEventSourceMappings(mock.Anything, mock.Anything).Return(&lambda.ListEventSourceMappingsOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "ListEventSourceMappings", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().ListEventSourceMappings(mock.Anything, mock.Anything).Return(nil, errors.New("list error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "ListEventSourceMappings", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "ListEventSourceMappings", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — CreateEventSourceMapping
// ---------------------------------------------------------------------------

func TestLambda_CreateEventSourceMapping(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().CreateEventSourceMapping(mock.Anything, mock.Anything).Return(&lambda.CreateEventSourceMappingOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "CreateEventSourceMapping", []byte(`{"FunctionName":"fn","EventSourceArn":"arn:aws:sqs:..."}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().CreateEventSourceMapping(mock.Anything, mock.Anything).Return(nil, errors.New("create error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "CreateEventSourceMapping", []byte(`{"FunctionName":"fn"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "CreateEventSourceMapping", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — GetEventSourceMapping
// ---------------------------------------------------------------------------

func TestLambda_GetEventSourceMapping(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().GetEventSourceMapping(mock.Anything, mock.Anything).Return(&lambda.GetEventSourceMappingOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "GetEventSourceMapping", []byte(`{"UUID":"abc123"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().GetEventSourceMapping(mock.Anything, mock.Anything).Return(nil, errors.New("get error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "GetEventSourceMapping", []byte(`{"UUID":"abc123"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "GetEventSourceMapping", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — DeleteEventSourceMapping
// ---------------------------------------------------------------------------

func TestLambda_DeleteEventSourceMapping(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().DeleteEventSourceMapping(mock.Anything, mock.Anything).Return(&lambda.DeleteEventSourceMappingOutput{}, nil)
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "DeleteEventSourceMapping", []byte(`{"UUID":"abc123"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().DeleteEventSourceMapping(mock.Anything, mock.Anything).Return(nil, errors.New("delete error"))
		svc.EXPECT().Lambda().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "DeleteEventSourceMapping", []byte(`{"UUID":"abc123"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/lambda/", "DeleteEventSourceMapping", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — GetFunctionConfiguration (direct handler test)
//
// These tests call the actual getFunctionConfiguration handler directly
// because "GetFunctionConfiguration" is dispatched to getFunction due to
// the substring match bug in handleLambda.
// ---------------------------------------------------------------------------

func TestLambda_GetFunctionConfiguration_Direct(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().GetFunctionConfiguration(mock.Anything, mock.Anything).Return(&lambda.GetFunctionConfigurationOutput{}, nil)
		svc := createMockSvc(t, nil)
		svc.EXPECT().Lambda().Return(mp)
		handler := createHandler(svc, createTestVersionService(t))

		gin.SetMode(gin.TestMode)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("POST", "/lambda/", bytes.NewReader([]byte("{}")))

		handler.getFunctionConfiguration(context.Background(), c, []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()
		mp := mockports.NewLambdaPort(t)
		mp.EXPECT().GetFunctionConfiguration(mock.Anything, mock.Anything).Return(nil, errors.New("config error"))
		svc := createMockSvc(t, nil)
		svc.EXPECT().Lambda().Return(mp)
		handler := createHandler(svc, createTestVersionService(t))

		gin.SetMode(gin.TestMode)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("POST", "/lambda/", bytes.NewReader([]byte("{}")))

		handler.getFunctionConfiguration(context.Background(), c, []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		gin.SetMode(gin.TestMode)
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		c.Request = httptest.NewRequest("POST", "/lambda/", bytes.NewReader([]byte("{bad")))

		handler.getFunctionConfiguration(context.Background(), c, []byte("{bad"))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Lambda — unknown action
// ---------------------------------------------------------------------------

func TestLambda_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	versionSvc := createTestVersionService(t)
	handler := NewProxyHandler(context.Background(), svc, versionSvc)
	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/lambda/", "UnknownAction", []byte("{}"))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}
