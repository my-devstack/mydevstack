package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	cwtypes "github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerCloudWatchRoutes(r chi.Router) {
	r.Route("/cloudwatch", func(r chi.Router) {
		r.Get("/alarms", h.describeAlarms)
		r.Post("/alarms", h.putMetricAlarm)
		r.Delete("/alarms/{alarmName}", h.deleteAlarms)
		r.Get("/alarms/{alarmName}/history", h.describeAlarmHistory)
		r.Put("/alarms/{alarmName}", h.setAlarmState)

		r.Post("/metrics", h.putMetricData)
		r.Get("/metrics", h.listMetrics)
		r.Post("/metrics/statistics", h.getMetricStatistics)
		r.Post("/metrics/data", h.getMetricData)
	})
}

func (h *ProxyHandler) describeAlarms(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatch.DescribeAlarmsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().DescribeAlarms(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe alarms", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putMetricAlarm(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatch.PutMetricAlarmInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().PutMetricAlarm(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put metric alarm", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteAlarms(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatch.DeleteAlarmsInput{
		AlarmNames: []string{chi.URLParam(r, "alarmName")},
	}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().DeleteAlarms(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete alarms", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) setAlarmState(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatch.SetAlarmStateInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.AlarmName = aws.String(chi.URLParam(r, "alarmName"))
	result, err := h.Svc.CloudWatch().SetAlarmState(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to set alarm state", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeAlarmHistory(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		HistoryItemType string `json:"HistoryItemType"`
		MaxRecords      int32  `json:"MaxRecords"`
		NextToken       string `json:"NextToken"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &cloudwatch.DescribeAlarmHistoryInput{
		AlarmName: aws.String(chi.URLParam(r, "alarmName")),
	}
	if body.HistoryItemType != "" {
		input.HistoryItemType = cwtypes.HistoryItemType(body.HistoryItemType)
	}
	if body.MaxRecords > 0 {
		input.MaxRecords = aws.Int32(body.MaxRecords)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	result, err := h.Svc.CloudWatch().DescribeAlarmHistory(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe alarm history", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listMetrics(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatch.ListMetricsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().ListMetrics(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list metrics", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getMetricData(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatch.GetMetricDataInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().GetMetricData(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get metric data", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getMetricStatistics(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatch.GetMetricStatisticsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().GetMetricStatistics(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get metric statistics", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putMetricData(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatch.PutMetricDataInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatch().PutMetricData(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put metric data", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
