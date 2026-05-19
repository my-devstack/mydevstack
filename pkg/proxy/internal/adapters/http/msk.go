package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/kafka"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleMSK(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListClustersV2"):
		h.listClustersV2(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeClusterV2"):
		h.describeClusterV2(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateClusterV2"):
		h.createClusterV2(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteCluster"):
		h.deleteCluster(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetBootstrapBrokers"):
		h.getBootstrapBrokers(ctx, c, bodyBytes)

	default:
		sendError(c, http.StatusNotFound, "MSK operation not supported: "+xAmzTarget, nil)
	}
}

func (h *ProxyHandler) listClustersV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kafka.ListClustersV2Input{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.MSK().ListClustersV2(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list clusters", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeClusterV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kafka.DescribeClusterV2Input{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.MSK().DescribeClusterV2(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe cluster", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createClusterV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kafka.CreateClusterV2Input{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.MSK().CreateClusterV2(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create cluster", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteCluster(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kafka.DeleteClusterInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.MSK().DeleteCluster(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete cluster", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getBootstrapBrokers(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kafka.GetBootstrapBrokersInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.MSK().GetBootstrapBrokers(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get bootstrap brokers", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
