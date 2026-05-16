package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleCloudWatch(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "DescribeAlarms"):
		h.describeAlarms(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutMetricAlarm"):
		h.putMetricAlarm(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteAlarms"):
		h.deleteAlarms(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "SetAlarmState"):
		h.setAlarmState(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeAlarmHistory"):
		h.describeAlarmHistory(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListMetrics"):
		h.listMetrics(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetMetricData"):
		h.getMetricData(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetMetricStatistics"):
		h.getMetricStatistics(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutMetricData"):
		h.putMetricData(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown CloudWatch action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) describeAlarms(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatch.DescribeAlarmsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatch().DescribeAlarms(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe alarms", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putMetricAlarm(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatch.PutMetricAlarmInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatch().PutMetricAlarm(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put metric alarm", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteAlarms(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatch.DeleteAlarmsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatch().DeleteAlarms(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete alarms", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) setAlarmState(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatch.SetAlarmStateInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatch().SetAlarmState(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to set alarm state", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeAlarmHistory(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatch.DescribeAlarmHistoryInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatch().DescribeAlarmHistory(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe alarm history", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listMetrics(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatch.ListMetricsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatch().ListMetrics(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list metrics", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getMetricData(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatch.GetMetricDataInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatch().GetMetricData(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get metric data", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getMetricStatistics(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatch.GetMetricStatisticsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatch().GetMetricStatistics(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get metric statistics", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putMetricData(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &cloudwatch.PutMetricDataInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.CloudWatch().PutMetricData(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put metric data", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
