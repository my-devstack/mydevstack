package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleStepFunctions(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.HasSuffix(xAmzTarget, "ListStateMachines"):
		h.listStateMachines(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "CreateStateMachine"):
		h.createStateMachine(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DescribeStateMachine"):
		h.describeStateMachine(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "UpdateStateMachine"):
		h.updateStateMachine(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DeleteStateMachine"):
		h.deleteStateMachine(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "StartExecution"):
		h.startExecution(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "ListExecutions"):
		h.listExecutions(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "StopExecution"):
		h.stopExecution(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DescribeExecution"):
		h.describeExecution(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "GetExecutionHistory"):
		h.getExecutionHistory(ctx, c, bodyBytes)
	default:
		sendError(c, http.StatusBadRequest, "Unsupported Step Functions action", nil)
	}
}

func (h *ProxyHandler) listStateMachines(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.ListStateMachinesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().ListStateMachines(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list state machines", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createStateMachine(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.CreateStateMachineInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().CreateStateMachine(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create state machine", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeStateMachine(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.DescribeStateMachineInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().DescribeStateMachine(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe state machine", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateStateMachine(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.UpdateStateMachineInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().UpdateStateMachine(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update state machine", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteStateMachine(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.DeleteStateMachineInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().DeleteStateMachine(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete state machine", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) startExecution(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.StartExecutionInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().StartExecution(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to start execution", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listExecutions(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.ListExecutionsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().ListExecutions(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list executions", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) stopExecution(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.StopExecutionInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().StopExecution(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to stop execution", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeExecution(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.DescribeExecutionInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().DescribeExecution(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe execution", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getExecutionHistory(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sfn.GetExecutionHistoryInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.StepFunctions().GetExecutionHistory(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get execution history", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
