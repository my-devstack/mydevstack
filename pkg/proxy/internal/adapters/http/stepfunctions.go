package httphandlers

import (
	"context"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) HandleListStateMachines(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
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

func (h *ProxyHandler) HandleCreateStateMachine(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
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
	c.JSON(http.StatusCreated, result)
}

func (h *ProxyHandler) HandleDescribeStateMachine(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
	input := &sfn.DescribeStateMachineInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	// Allow ARN from path param if not in body
	if input.StateMachineArn == nil || *input.StateMachineArn == "" {
		arn := c.Param("arn")
		if arn != "" {
			input.StateMachineArn = &arn
		}
	}
	result, err := h.svc.StepFunctions().DescribeStateMachine(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe state machine", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) HandleUpdateStateMachine(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
	input := &sfn.UpdateStateMachineInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.StateMachineArn == nil || *input.StateMachineArn == "" {
		arn := c.Param("arn")
		if arn != "" {
			input.StateMachineArn = &arn
		}
	}
	result, err := h.svc.StepFunctions().UpdateStateMachine(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update state machine", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) HandleDeleteStateMachine(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
	input := &sfn.DeleteStateMachineInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.StateMachineArn == nil || *input.StateMachineArn == "" {
		arn := c.Param("arn")
		if arn != "" {
			input.StateMachineArn = &arn
		}
	}
	result, err := h.svc.StepFunctions().DeleteStateMachine(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete state machine", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) HandleStartExecution(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
	input := &sfn.StartExecutionInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.StateMachineArn == nil || *input.StateMachineArn == "" {
		arn := c.Param("arn")
		if arn != "" {
			input.StateMachineArn = &arn
		}
	}
	result, err := h.svc.StepFunctions().StartExecution(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to start execution", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) HandleListExecutions(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
	input := &sfn.ListExecutionsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.StateMachineArn == nil || *input.StateMachineArn == "" {
		arn := c.Param("arn")
		if arn != "" {
			input.StateMachineArn = &arn
		}
	}
	result, err := h.svc.StepFunctions().ListExecutions(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list executions", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) HandleStopExecution(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
	input := &sfn.StopExecutionInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.ExecutionArn == nil || *input.ExecutionArn == "" {
		executionArn := c.Param("executionArn")
		if executionArn != "" {
			input.ExecutionArn = &executionArn
		}
	}
	result, err := h.svc.StepFunctions().StopExecution(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to stop execution", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) HandleDescribeExecution(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
	input := &sfn.DescribeExecutionInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.ExecutionArn == nil || *input.ExecutionArn == "" {
		executionArn := c.Param("executionArn")
		if executionArn != "" {
			input.ExecutionArn = &executionArn
		}
	}
	result, err := h.svc.StepFunctions().DescribeExecution(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe execution", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) HandleGetExecutionHistory(c *gin.Context) {
	bodyBytes := readBody(c)
	ctx := context.Background()
	input := &sfn.GetExecutionHistoryInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.ExecutionArn == nil || *input.ExecutionArn == "" {
		executionArn := c.Param("executionArn")
		if executionArn != "" {
			input.ExecutionArn = &executionArn
		}
	}
	result, err := h.svc.StepFunctions().GetExecutionHistory(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get execution history", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
