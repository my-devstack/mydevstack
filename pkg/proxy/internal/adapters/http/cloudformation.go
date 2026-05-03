package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleCloudFormation(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")

	bodyBytes := readBody(c)
	ctx := c.Request.Context()

	switch {
	case strings.HasSuffix(xAmzTarget, "ListStacks"):
		h.listStacks(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "CreateStack"):
		h.createStack(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DeleteStack"):
		h.deleteStack(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DescribeStacks"):
		h.describeStacks(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "GetTemplate"):
		h.getTemplate(ctx, c, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "ListStackResources"):
		h.listStackResources(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown CloudFormation action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listStacks(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudformation.ListStacksInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudFormation().ListStacks(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list stacks", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createStack(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudformation.CreateStackInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudFormation().CreateStack(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create stack", err)
		return
	}
	c.JSON(http.StatusCreated, result)
}

func (h *ProxyHandler) deleteStack(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudformation.DeleteStackInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudFormation().DeleteStack(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete stack", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeStacks(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudformation.DescribeStacksInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudFormation().DescribeStacks(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe stacks", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getTemplate(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudformation.GetTemplateInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudFormation().GetTemplate(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get template", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listStackResources(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudformation.ListStackResourcesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudFormation().ListStackResources(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list stack resources", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
