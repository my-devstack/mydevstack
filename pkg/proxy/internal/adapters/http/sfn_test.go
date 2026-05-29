package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/sfn"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestStepFunctionsActions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.StepFunctionsPort)
	}{
		{name: "ListStateMachines", method: "GET", path: "/step-functions/state-machines", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().ListStateMachines(mock.Anything, mock.Anything).Return(&sfn.ListStateMachinesOutput{}, nil)
		}},
		{name: "CreateStateMachine", method: "POST", path: "/step-functions/state-machines", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().CreateStateMachine(mock.Anything, mock.Anything).Return(&sfn.CreateStateMachineOutput{}, nil)
		}},
		{name: "DescribeStateMachine", method: "GET", path: "/step-functions/state-machines/testarn", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().DescribeStateMachine(mock.Anything, mock.Anything).Return(&sfn.DescribeStateMachineOutput{}, nil)
		}},
		{name: "UpdateStateMachine", method: "PUT", path: "/step-functions/state-machines/testarn", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().UpdateStateMachine(mock.Anything, mock.Anything).Return(&sfn.UpdateStateMachineOutput{}, nil)
		}},
		{name: "DeleteStateMachine", method: "DELETE", path: "/step-functions/state-machines/testarn", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().DeleteStateMachine(mock.Anything, mock.Anything).Return(&sfn.DeleteStateMachineOutput{}, nil)
		}},
		{name: "StartExecution", method: "POST", path: "/step-functions/state-machines/testarn/executions", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().StartExecution(mock.Anything, mock.Anything).Return(&sfn.StartExecutionOutput{}, nil)
		}},
		{name: "ListExecutions", method: "GET", path: "/step-functions/state-machines/testarn/executions", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().ListExecutions(mock.Anything, mock.Anything).Return(&sfn.ListExecutionsOutput{}, nil)
		}},
		{name: "StopExecution", method: "POST", path: "/step-functions/executions/testarn/stop", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().StopExecution(mock.Anything, mock.Anything).Return(&sfn.StopExecutionOutput{}, nil)
		}},
		{name: "DescribeExecution", method: "GET", path: "/step-functions/executions/testarn", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().DescribeExecution(mock.Anything, mock.Anything).Return(&sfn.DescribeExecutionOutput{}, nil)
		}},
		{name: "GetExecutionHistory", method: "GET", path: "/step-functions/executions/testarn/history", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().GetExecutionHistory(mock.Anything, mock.Anything).Return(&sfn.GetExecutionHistoryOutput{}, nil)
		}},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewStepFunctionsPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().StepFunctions().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestStepFunctions_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/step-functions/state-machines", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestStepFunctions_ServiceError(t *testing.T) {
	t.Parallel()

	mp := mockports.NewStepFunctionsPort(t)
	mp.EXPECT().ListStateMachines(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().StepFunctions().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/step-functions/state-machines", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestStepFunctions_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/step-functions/unknown", []byte("{}"))
	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestStepFunctions_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.StepFunctionsPort)
	}{
		{
			name: "CreateStateMachine", method: "POST", path: "/step-functions/state-machines",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().CreateStateMachine(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeStateMachine", method: "GET", path: "/step-functions/state-machines/testarn",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().DescribeStateMachine(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "UpdateStateMachine", method: "PUT", path: "/step-functions/state-machines/testarn",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().UpdateStateMachine(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteStateMachine", method: "DELETE", path: "/step-functions/state-machines/testarn",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().DeleteStateMachine(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "StartExecution", method: "POST", path: "/step-functions/state-machines/testarn/executions",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().StartExecution(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "ListExecutions", method: "GET", path: "/step-functions/state-machines/testarn/executions",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().ListExecutions(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "StopExecution", method: "POST", path: "/step-functions/executions/testarn/stop",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().StopExecution(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeExecution", method: "GET", path: "/step-functions/executions/testarn",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().DescribeExecution(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetExecutionHistory", method: "GET", path: "/step-functions/executions/testarn/history",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().GetExecutionHistory(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewStepFunctionsPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().StepFunctions().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusInternalServerError, w.Code, "body=%s", w.Body.String())
		})
	}
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestStepFunctions_ParseErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "ListStateMachines", method: "GET", path: "/step-functions/state-machines"},
		{name: "CreateStateMachine", method: "POST", path: "/step-functions/state-machines"},
		{name: "UpdateStateMachine", method: "PUT", path: "/step-functions/state-machines/testarn"},
		{name: "StartExecution", method: "POST", path: "/step-functions/state-machines/testarn/executions"},
		{name: "ListExecutions", method: "GET", path: "/step-functions/state-machines/testarn/executions"},
		{name: "StopExecution", method: "POST", path: "/step-functions/executions/testarn/stop"},
		{name: "GetExecutionHistory", method: "GET", path: "/step-functions/executions/testarn/history"},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, tt.method, tt.path, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "method=%s path=%s body=%s", tt.method, tt.path, w.Body.String())
		})
	}
}
