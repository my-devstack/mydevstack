package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/sfn"
)

func (h *ProxyHandler) handleStepFunctions(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.HasSuffix(xAmzTarget, "ListStateMachines"):
		h.listStateMachines(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "CreateStateMachine"):
		h.createStateMachine(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DescribeStateMachine"):
		h.describeStateMachine(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "UpdateStateMachine"):
		h.updateStateMachine(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DeleteStateMachine"):
		h.deleteStateMachine(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "StartExecution"):
		h.startExecution(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "ListExecutions"):
		h.listExecutions(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "StopExecution"):
		h.stopExecution(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DescribeExecution"):
		h.describeExecution(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "GetExecutionHistory"):
		h.getExecutionHistory(ctx, w, r, bodyBytes)
	default:
		sendError(w, http.StatusBadRequest, "Unsupported Step Functions action", nil)
	}
}

func (h *ProxyHandler) listStateMachines(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.ListStateMachinesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().ListStateMachines(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list state machines", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStateMachine(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.CreateStateMachineInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().CreateStateMachine(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create state machine", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStateMachine(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.DescribeStateMachineInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().DescribeStateMachine(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe state machine", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateStateMachine(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.UpdateStateMachineInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().UpdateStateMachine(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update state machine", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteStateMachine(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.DeleteStateMachineInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().DeleteStateMachine(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete state machine", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) startExecution(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.StartExecutionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().StartExecution(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to start execution", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listExecutions(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.ListExecutionsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().ListExecutions(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list executions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) stopExecution(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.StopExecutionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().StopExecution(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to stop execution", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeExecution(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.DescribeExecutionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().DescribeExecution(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe execution", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getExecutionHistory(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sfn.GetExecutionHistoryInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().GetExecutionHistory(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get execution history", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
