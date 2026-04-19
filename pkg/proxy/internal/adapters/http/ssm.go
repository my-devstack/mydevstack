package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleSSM(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "GetParameter"):
		h.getParameter(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetParameters"):
		h.getParameters(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetParametersByPath"):
		h.getParametersByPath(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutParameter"):
		h.putParameter(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteParameter"):
		h.deleteParameter(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeParameters"):
		h.describeParameters(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetParameterHistory"):
		h.getParameterHistory(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListTagsForResource"):
		h.listTagsForResource(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "AddTagsToResource"):
		h.addTagsToResource(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "RemoveTagsFromResource"):
		h.removeTagsFromResource(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown SSM action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) getParameter(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.GetParameterInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().GetParameter(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get parameter", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getParameters(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.GetParametersInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().GetParameters(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get parameters", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getParametersByPath(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.GetParametersByPathInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().GetParametersByPath(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get parameters by path", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putParameter(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.PutParameterInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().PutParameter(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put parameter", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteParameter(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.DeleteParameterInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().DeleteParameter(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete parameter", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeParameters(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.DescribeParametersInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().DescribeParameters(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe parameters", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getParameterHistory(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.GetParameterHistoryInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().GetParameterHistory(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get parameter history", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listTagsForResource(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.ListTagsForResourceInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().ListTagsForResource(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list tags for resource", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) addTagsToResource(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.AddTagsToResourceInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().AddTagsToResource(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to add tags to resource", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) removeTagsFromResource(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &ssm.RemoveTagsFromResourceInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SSM().RemoveTagsFromResource(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to remove tags from resource", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
