package httphandlers

import (
	"bytes"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/ssm"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSSMActions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.SSMPort)
	}{
		{name: "GetParameter", method: "GET", path: "/ssm/parameters/testparam", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().GetParameter(mock.Anything, mock.Anything).Return(&ssm.GetParameterOutput{}, nil)
		}},
		{name: "GetParameters", method: "POST", path: "/ssm/parameters/batch", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().GetParameters(mock.Anything, mock.Anything).Return(&ssm.GetParametersOutput{}, nil)
		}},
		{name: "GetParametersByPath", method: "GET", path: "/ssm/parameters-by-path/testpath", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().GetParametersByPath(mock.Anything, mock.Anything).Return(&ssm.GetParametersByPathOutput{}, nil)
		}},
		{name: "PutParameter", method: "POST", path: "/ssm/parameters", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().PutParameter(mock.Anything, mock.Anything).Return(&ssm.PutParameterOutput{}, nil)
		}},
		{name: "DeleteParameter", method: "DELETE", path: "/ssm/parameters/testparam", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().DeleteParameter(mock.Anything, mock.Anything).Return(&ssm.DeleteParameterOutput{}, nil)
		}},
		{name: "DescribeParameters", method: "GET", path: "/ssm/parameters", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().DescribeParameters(mock.Anything, mock.Anything).Return(&ssm.DescribeParametersOutput{}, nil)
		}},
		{name: "GetParameterHistory", method: "GET", path: "/ssm/parameters/testparam/history", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().GetParameterHistory(mock.Anything, mock.Anything).Return(&ssm.GetParameterHistoryOutput{}, nil)
		}},
		{name: "ListTagsForResource", method: "POST", path: "/ssm/tags/list", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().ListTagsForResource(mock.Anything, mock.Anything).Return(&ssm.ListTagsForResourceOutput{}, nil)
		}},
		{name: "AddTagsToResource", method: "POST", path: "/ssm/tags", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().AddTagsToResource(mock.Anything, mock.Anything).Return(&ssm.AddTagsToResourceOutput{}, nil)
		}},
		{name: "RemoveTagsFromResource", method: "POST", path: "/ssm/tags/delete", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().RemoveTagsFromResource(mock.Anything, mock.Anything).Return(&ssm.RemoveTagsFromResourceOutput{}, nil)
		}},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewSSMPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().SSM().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

// TestSSM_GetParameters_Direct tests the getParameters handler directly.
func TestSSM_GetParameters_Direct(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().GetParameters(mock.Anything, mock.Anything).Return(&ssm.GetParametersOutput{}, nil)
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/ssm", bytes.NewReader([]byte("{}")))

	handler.getParameters(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

// TestSSM_GetParametersByPath_Direct tests the getParametersByPath handler
// directly.
func TestSSM_GetParametersByPath_Direct(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().GetParametersByPath(mock.Anything, mock.Anything).Return(&ssm.GetParametersByPathOutput{}, nil)
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/ssm", bytes.NewReader([]byte("{}")))

	handler.getParametersByPath(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

// TestSSM_GetParameterHistory_Direct tests the getParameterHistory handler
// directly.
func TestSSM_GetParameterHistory_Direct(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().GetParameterHistory(mock.Anything, mock.Anything).Return(&ssm.GetParameterHistoryOutput{}, nil)
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/ssm", bytes.NewReader([]byte("{}")))

	handler.getParameterHistory(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestSSM_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/ssm/parameters", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSSM_ServiceError(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().DescribeParameters(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/ssm/parameters", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests (router-accessible)
// ---------------------------------------------------------------------------

func TestSSM_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.SSMPort)
	}{
		{
			name: "GetParameter", method: "GET", path: "/ssm/parameters/testparam",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().GetParameter(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetParameters", method: "POST", path: "/ssm/parameters/batch",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().GetParameters(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetParametersByPath", method: "GET", path: "/ssm/parameters-by-path/testpath",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().GetParametersByPath(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutParameter", method: "POST", path: "/ssm/parameters",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().PutParameter(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteParameter", method: "DELETE", path: "/ssm/parameters/testparam",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().DeleteParameter(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetParameterHistory", method: "GET", path: "/ssm/parameters/testparam/history",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().GetParameterHistory(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "ListTagsForResource", method: "POST", path: "/ssm/tags/list",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().ListTagsForResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "AddTagsToResource", method: "POST", path: "/ssm/tags",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().AddTagsToResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "RemoveTagsFromResource", method: "POST", path: "/ssm/tags/delete",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().RemoveTagsFromResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewSSMPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().SSM().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusInternalServerError, w.Code, "body=%s", w.Body.String())
		})
	}
}

// ---------------------------------------------------------------------------
// Service error tests for shadowed actions (direct handler calls)
// ---------------------------------------------------------------------------

func TestSSM_GetParameters_ServiceError(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().GetParameters(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/ssm", bytes.NewReader([]byte("{}")))

	handler.getParameters(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestSSM_GetParametersByPath_ServiceError(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().GetParametersByPath(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/ssm", bytes.NewReader([]byte("{}")))

	handler.getParametersByPath(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestSSM_GetParameterHistory_ServiceError(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().GetParameterHistory(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/ssm", bytes.NewReader([]byte("{}")))

	handler.getParameterHistory(w, req)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestSSM_ParseErrors(t *testing.T) {
	t.Parallel()

	// Only include actions whose handlers call parseBody.
	// GetParameter and DeleteParameter use URL params, not body parse.
	type parseCase struct {
		name   string
		method string
		path   string
	}

	targets := []parseCase{
		{name: "GetParameters", method: "POST", path: "/ssm/parameters/batch"},
		{name: "GetParametersByPath", method: "GET", path: "/ssm/parameters-by-path/testpath"},
		{name: "PutParameter", method: "POST", path: "/ssm/parameters"},
		{name: "DescribeParameters", method: "GET", path: "/ssm/parameters"},
		{name: "GetParameterHistory", method: "GET", path: "/ssm/parameters/testparam/history"},
		{name: "ListTagsForResource", method: "POST", path: "/ssm/tags/list"},
		{name: "AddTagsToResource", method: "POST", path: "/ssm/tags"},
		{name: "RemoveTagsFromResource", method: "POST", path: "/ssm/tags/delete"},
	}

	for _, target := range targets {
		target := target
		t.Run(target.name, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, target.method, target.path, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", target.name, w.Body.String())
		})
	}
}
