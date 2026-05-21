package httphandlers

import (
	"bytes"
	"context"
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

	// NOTE: "GetParameter" is a substring of "GetParameters",
	// "GetParametersByPath", and "GetParameterHistory", so the switch always
	// routes them to the getParameter handler. Unreachable handlers are tested
	// separately.
	tests := []struct {
		name      string
		target    string
		setupMock func(mp *mockports.SSMPort)
	}{
		{name: "GetParameter", target: "GetParameter", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().GetParameter(mock.Anything, mock.Anything).Return(&ssm.GetParameterOutput{}, nil)
		}},
		{name: "PutParameter", target: "PutParameter", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().PutParameter(mock.Anything, mock.Anything).Return(&ssm.PutParameterOutput{}, nil)
		}},
		{name: "DeleteParameter", target: "DeleteParameter", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().DeleteParameter(mock.Anything, mock.Anything).Return(&ssm.DeleteParameterOutput{}, nil)
		}},
		{name: "DescribeParameters", target: "DescribeParameters", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().DescribeParameters(mock.Anything, mock.Anything).Return(&ssm.DescribeParametersOutput{}, nil)
		}},
		// "GetParameterHistory" routes to getParameter handler because
		// "GetParameter" is a substring of "GetParameterHistory".
		{name: "GetParameterHistory_routes_to_GetParameter", target: "GetParameterHistory", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().GetParameter(mock.Anything, mock.Anything).Return(&ssm.GetParameterOutput{}, nil)
		}},
		{name: "ListTagsForResource", target: "ListTagsForResource", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().ListTagsForResource(mock.Anything, mock.Anything).Return(&ssm.ListTagsForResourceOutput{}, nil)
		}},
		{name: "AddTagsToResource", target: "AddTagsToResource", setupMock: func(mp *mockports.SSMPort) {
			mp.EXPECT().AddTagsToResource(mock.Anything, mock.Anything).Return(&ssm.AddTagsToResourceOutput{}, nil)
		}},
		{name: "RemoveTagsFromResource", target: "RemoveTagsFromResource", setupMock: func(mp *mockports.SSMPort) {
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
			w := performRequest(r, "POST", "/ssm", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

// TestSSM_GetParameters_Direct tests the getParameters handler directly.
// Unreachable through normal router because "GetParameter" is a substring of
// "GetParameters".
func TestSSM_GetParameters_Direct(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().GetParameters(mock.Anything, mock.Anything).Return(&ssm.GetParametersOutput{}, nil)
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/ssm", bytes.NewReader([]byte("{}")))

	handler.getParameters(context.Background(), w, req, []byte("{}"))
	assert.Equal(t, http.StatusOK, w.Code)
}

// TestSSM_GetParametersByPath_Direct tests the getParametersByPath handler
// directly (unreachable via router).
func TestSSM_GetParametersByPath_Direct(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().GetParametersByPath(mock.Anything, mock.Anything).Return(&ssm.GetParametersByPathOutput{}, nil)
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/ssm", bytes.NewReader([]byte("{}")))

	handler.getParametersByPath(context.Background(), w, req, []byte("{}"))
	assert.Equal(t, http.StatusOK, w.Code)
}

// TestSSM_GetParameterHistory_Direct tests the getParameterHistory handler
// directly (unreachable via router because "GetParameter" is a substring).
func TestSSM_GetParameterHistory_Direct(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSSMPort(t)
	mp.EXPECT().GetParameterHistory(mock.Anything, mock.Anything).Return(&ssm.GetParameterHistoryOutput{}, nil)
	svc := createMockSvc(t, nil)
	svc.EXPECT().SSM().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))

	w := httptest.NewRecorder()
	req := httptest.NewRequest("POST", "/ssm", bytes.NewReader([]byte("{}")))

	handler.getParameterHistory(context.Background(), w, req, []byte("{}"))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestSSM_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/ssm", "PutParameter", []byte(`{bad`))
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

	w := performRequest(r, "POST", "/ssm", "DescribeParameters", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestSSM_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/ssm", "UnknownSSMAction", []byte("{}"))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests (router-accessible)
// ---------------------------------------------------------------------------

func TestSSM_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		target    string
		setupMock func(mp *mockports.SSMPort)
	}{
		{
			name: "GetParameter", target: "GetParameter",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().GetParameter(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutParameter", target: "PutParameter",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().PutParameter(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteParameter", target: "DeleteParameter",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().DeleteParameter(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetParameterHistory_routes_to_GetParameter", target: "GetParameterHistory",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().GetParameter(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "ListTagsForResource", target: "ListTagsForResource",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().ListTagsForResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "AddTagsToResource", target: "AddTagsToResource",
			setupMock: func(mp *mockports.SSMPort) {
				mp.EXPECT().AddTagsToResource(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "RemoveTagsFromResource", target: "RemoveTagsFromResource",
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
			w := performRequest(r, "POST", "/ssm", tt.target, []byte("{}"))
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

	handler.getParameters(context.Background(), w, req, []byte("{}"))
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

	handler.getParametersByPath(context.Background(), w, req, []byte("{}"))
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

	handler.getParameterHistory(context.Background(), w, req, []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestSSM_ParseErrors(t *testing.T) {
	t.Parallel()

	// All actions are reachable through the router for parse errors because
	// parseBody fails before any port dispatch happens.
	targets := []string{
		"GetParameter", "GetParameters", "GetParametersByPath",
		"PutParameter", "DeleteParameter", "DescribeParameters",
		"GetParameterHistory", "ListTagsForResource",
		"AddTagsToResource", "RemoveTagsFromResource",
	}

	for _, target := range targets {
		target := target
		t.Run(target, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/ssm", target, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", target, w.Body.String())
		})
	}
}
