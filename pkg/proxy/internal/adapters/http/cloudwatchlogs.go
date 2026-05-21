package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
)

func (h *ProxyHandler) handleCloudWatchLogs(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "DescribeLogGroups"):
		h.describeLogGroups(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateLogGroup"):
		h.createLogGroup(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteLogGroup"):
		h.deleteLogGroup(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeLogStreams"):
		h.describeLogStreams(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateLogStream"):
		h.createLogStream(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutLogEvents"):
		h.putLogEvents(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetLogEvents"):
		h.getLogEvents(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutMetricFilter"):
		h.putMetricFilter(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeMetricFilters"):
		h.describeMetricFilters(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutRetentionPolicy"):
		h.putRetentionPolicy(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown CloudWatch Logs action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) describeLogGroups(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.DescribeLogGroupsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().DescribeLogGroups(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe log groups", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createLogGroup(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.CreateLogGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().CreateLogGroup(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create log group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteLogGroup(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.DeleteLogGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().DeleteLogGroup(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete log group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeLogStreams(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.DescribeLogStreamsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().DescribeLogStreams(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe log streams", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createLogStream(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.CreateLogStreamInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().CreateLogStream(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create log stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putLogEvents(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.PutLogEventsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().PutLogEvents(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put log events", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getLogEvents(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.GetLogEventsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().GetLogEvents(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get log events", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putMetricFilter(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.PutMetricFilterInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().PutMetricFilter(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put metric filter", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeMetricFilters(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.DescribeMetricFiltersInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().DescribeMetricFilters(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe metric filters", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putRetentionPolicy(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatchlogs.PutRetentionPolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().PutRetentionPolicy(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put retention policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
