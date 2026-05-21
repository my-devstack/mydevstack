package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
)

func (h *ProxyHandler) handleCloudWatch(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "DescribeAlarms"):
		h.describeAlarms(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutMetricAlarm"):
		h.putMetricAlarm(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteAlarms"):
		h.deleteAlarms(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "SetAlarmState"):
		h.setAlarmState(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeAlarmHistory"):
		h.describeAlarmHistory(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListMetrics"):
		h.listMetrics(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetMetricData"):
		h.getMetricData(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetMetricStatistics"):
		h.getMetricStatistics(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutMetricData"):
		h.putMetricData(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown CloudWatch action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) describeAlarms(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatch.DescribeAlarmsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().DescribeAlarms(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe alarms", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putMetricAlarm(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatch.PutMetricAlarmInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().PutMetricAlarm(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put metric alarm", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteAlarms(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatch.DeleteAlarmsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().DeleteAlarms(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete alarms", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) setAlarmState(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatch.SetAlarmStateInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().SetAlarmState(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to set alarm state", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeAlarmHistory(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatch.DescribeAlarmHistoryInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().DescribeAlarmHistory(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe alarm history", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listMetrics(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatch.ListMetricsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().ListMetrics(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list metrics", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getMetricData(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatch.GetMetricDataInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().GetMetricData(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get metric data", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getMetricStatistics(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatch.GetMetricStatisticsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().GetMetricStatistics(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get metric statistics", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putMetricData(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudwatch.PutMetricDataInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().PutMetricData(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put metric data", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
