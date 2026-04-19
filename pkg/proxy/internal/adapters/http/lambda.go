package httphandlers

import (
	"context"
	"encoding/base64"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleLambda(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "ListFunctions"):
		h.listFunctions(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateFunction"):
		h.createFunction(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetFunction"):
		h.getFunction(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteFunction"):
		h.deleteFunction(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "Invoke"):
		h.invokeFunction(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateFunctionConfiguration"):
		h.updateFunctionConfiguration(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateFunctionCode"):
		h.updateFunctionCode(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetFunctionConfiguration"):
		h.getFunctionConfiguration(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown Lambda action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listFunctions(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &lambda.ListFunctionsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Lambda().ListFunctions(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list functions", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createFunction(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &lambda.CreateFunctionInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Lambda().CreateFunction(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create function", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getFunction(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &lambda.GetFunctionInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Lambda().GetFunction(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get function", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteFunction(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &lambda.DeleteFunctionInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Lambda().DeleteFunction(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete function", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) invokeFunction(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &lambda.InvokeInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Lambda().Invoke(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to invoke function", err)
		return
	}

	response := map[string]interface{}{
		"StatusCode": result.StatusCode,
	}
	if result.FunctionError != nil {
		response["FunctionError"] = *result.FunctionError
		c.Header("X-Amz-Function-Error", *result.FunctionError)
	}
	if len(result.Payload) > 0 {
		encoded := base64.StdEncoding.EncodeToString(result.Payload)
		response["Payload"] = encoded
	}
	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, response)
}

func (h *ProxyHandler) updateFunctionConfiguration(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &lambda.UpdateFunctionConfigurationInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Lambda().UpdateFunctionConfiguration(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update function configuration", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateFunctionCode(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &lambda.UpdateFunctionCodeInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Lambda().UpdateFunctionCode(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update function code", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getFunctionConfiguration(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &lambda.GetFunctionConfigurationInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Lambda().GetFunctionConfiguration(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get function configuration", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
