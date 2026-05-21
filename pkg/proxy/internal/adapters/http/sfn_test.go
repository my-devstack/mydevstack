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
		target    string
		setupMock func(mp *mockports.StepFunctionsPort)
	}{
		{name: "ListStateMachines", target: "ListStateMachines", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().ListStateMachines(mock.Anything, mock.Anything).Return(&sfn.ListStateMachinesOutput{}, nil)
		}},
		{name: "CreateStateMachine", target: "CreateStateMachine", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().CreateStateMachine(mock.Anything, mock.Anything).Return(&sfn.CreateStateMachineOutput{}, nil)
		}},
		{name: "DescribeStateMachine", target: "DescribeStateMachine", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().DescribeStateMachine(mock.Anything, mock.Anything).Return(&sfn.DescribeStateMachineOutput{}, nil)
		}},
		{name: "UpdateStateMachine", target: "UpdateStateMachine", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().UpdateStateMachine(mock.Anything, mock.Anything).Return(&sfn.UpdateStateMachineOutput{}, nil)
		}},
		{name: "DeleteStateMachine", target: "DeleteStateMachine", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().DeleteStateMachine(mock.Anything, mock.Anything).Return(&sfn.DeleteStateMachineOutput{}, nil)
		}},
		{name: "StartExecution", target: "StartExecution", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().StartExecution(mock.Anything, mock.Anything).Return(&sfn.StartExecutionOutput{}, nil)
		}},
		{name: "ListExecutions", target: "ListExecutions", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().ListExecutions(mock.Anything, mock.Anything).Return(&sfn.ListExecutionsOutput{}, nil)
		}},
		{name: "StopExecution", target: "StopExecution", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().StopExecution(mock.Anything, mock.Anything).Return(&sfn.StopExecutionOutput{}, nil)
		}},
		{name: "DescribeExecution", target: "DescribeExecution", setupMock: func(mp *mockports.StepFunctionsPort) {
			mp.EXPECT().DescribeExecution(mock.Anything, mock.Anything).Return(&sfn.DescribeExecutionOutput{}, nil)
		}},
		{name: "GetExecutionHistory", target: "GetExecutionHistory", setupMock: func(mp *mockports.StepFunctionsPort) {
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
			w := performRequest(r, "POST", "/stepfunctions", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestStepFunctions_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/stepfunctions", "ListStateMachines", []byte(`{bad`))
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

	w := performRequest(r, "POST", "/stepfunctions", "ListStateMachines", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestStepFunctions_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	// SFN uses sendError for unknown actions (different from c.JSON).
	w := performRequest(r, "POST", "/stepfunctions", "UnknownSFNAction", []byte("{}"))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestStepFunctions_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		target    string
		setupMock func(mp *mockports.StepFunctionsPort)
	}{
		{
			name: "CreateStateMachine", target: "CreateStateMachine",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().CreateStateMachine(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeStateMachine", target: "DescribeStateMachine",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().DescribeStateMachine(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "UpdateStateMachine", target: "UpdateStateMachine",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().UpdateStateMachine(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteStateMachine", target: "DeleteStateMachine",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().DeleteStateMachine(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "StartExecution", target: "StartExecution",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().StartExecution(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "ListExecutions", target: "ListExecutions",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().ListExecutions(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "StopExecution", target: "StopExecution",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().StopExecution(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeExecution", target: "DescribeExecution",
			setupMock: func(mp *mockports.StepFunctionsPort) {
				mp.EXPECT().DescribeExecution(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetExecutionHistory", target: "GetExecutionHistory",
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
			w := performRequest(r, "POST", "/stepfunctions", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusInternalServerError, w.Code, "body=%s", w.Body.String())
		})
	}
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestStepFunctions_ParseErrors(t *testing.T) {
	t.Parallel()

	targets := []string{
		"ListStateMachines", "CreateStateMachine", "DescribeStateMachine",
		"UpdateStateMachine", "DeleteStateMachine", "StartExecution",
		"ListExecutions", "StopExecution", "DescribeExecution", "GetExecutionHistory",
	}

	for _, target := range targets {
		target := target
		t.Run(target, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/stepfunctions", target, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", target, w.Body.String())
		})
	}
}
