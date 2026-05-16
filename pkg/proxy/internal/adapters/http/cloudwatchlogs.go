package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleCloudWatchLogs(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "DescribeLogGroups"):
		h.describeLogGroups(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateLogGroup"):
		h.createLogGroup(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteLogGroup"):
		h.deleteLogGroup(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeLogStreams"):
		h.describeLogStreams(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateLogStream"):
		h.createLogStream(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutLogEvents"):
		h.putLogEvents(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetLogEvents"):
		h.getLogEvents(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutMetricFilter"):
		h.putMetricFilter(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeMetricFilters"):
		h.describeMetricFilters(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutRetentionPolicy"):
		h.putRetentionPolicy(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown CloudWatch Logs action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) describeLogGroups(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.DescribeLogGroupsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().DescribeLogGroups(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe log groups", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createLogGroup(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.CreateLogGroupInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().CreateLogGroup(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create log group", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteLogGroup(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.DeleteLogGroupInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().DeleteLogGroup(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete log group", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeLogStreams(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.DescribeLogStreamsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().DescribeLogStreams(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe log streams", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createLogStream(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.CreateLogStreamInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().CreateLogStream(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create log stream", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putLogEvents(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.PutLogEventsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().PutLogEvents(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put log events", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getLogEvents(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.GetLogEventsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().GetLogEvents(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get log events", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putMetricFilter(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.PutMetricFilterInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().PutMetricFilter(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put metric filter", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeMetricFilters(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.DescribeMetricFiltersInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().DescribeMetricFilters(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe metric filters", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putRetentionPolicy(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatchlogs.PutRetentionPolicyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatchLogs().PutRetentionPolicy(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put retention policy", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
