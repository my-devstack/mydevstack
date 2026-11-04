package httphandlers

import (
	"net/http"
	"strconv"

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
		// GET variants for read operations (read-only-mode friendly).
		r.Get("/metrics/statistics", h.getMetricStatistics)
		r.Get("/metrics/data", h.getMetricData)
		// Deprecated POST twins (kept one release for backward compatibility).
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

// getMetricData serves both GET (query param `params`=url-encoded JSON) and
// POST (JSON body). Both paths build a GetMetricDataInput and share the core call.
//
// Deprecated: use GET /cloudwatch/metrics/data?params=... instead.
// This POST twin is kept for one release and will be removed in the next minor version.
func (h *ProxyHandler) getMetricData(w http.ResponseWriter, r *http.Request) {
	input := &cloudwatch.GetMetricDataInput{}
	if r.Method == http.MethodGet {
		raw := r.URL.Query().Get("params")
		if raw == "" {
			sendError(w, http.StatusBadRequest, "Missing required query parameter: params", nil)
			return
		}
		if err := parseBody([]byte(raw), input); err != nil {
			sendError(w, http.StatusBadRequest, "Invalid params JSON", err)
			return
		}
	} else {
		markDeprecated(w, "GET /cloudwatch/metrics/data?params=...")
		bodyBytes := readBody(r)
		if err := parseBody(bodyBytes, input); err != nil {
			sendError(w, http.StatusBadRequest, "Invalid request body", err)
			return
		}
	}
	result, err := h.Svc.CloudWatch().GetMetricData(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get metric data", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// getMetricStatistics serves both GET (query params) and POST (JSON body).
// GET contract: namespace, metricName, startTime, endTime, period (int seconds),
// statistics (csv), dimensions (url-encoded JSON array), unit.
//
// Deprecated: use GET /cloudwatch/metrics/statistics instead.
// This POST twin is kept for one release and will be removed in the next minor version.
func (h *ProxyHandler) getMetricStatistics(w http.ResponseWriter, r *http.Request) {
	input := &cloudwatch.GetMetricStatisticsInput{}
	if r.Method == http.MethodGet {
		q := r.URL.Query()
		if v := q.Get("namespace"); v != "" {
			input.Namespace = aws.String(v)
		}
		if v := q.Get("metricName"); v != "" {
			input.MetricName = aws.String(v)
		}
		if v := q.Get("startTime"); v != "" {
			ts, err := parseTimestamp(v)
			if err != nil {
				sendError(w, http.StatusBadRequest, "Invalid startTime", err)
				return
			}
			input.StartTime = aws.Time(ts)
		}
		if v := q.Get("endTime"); v != "" {
			ts, err := parseTimestamp(v)
			if err != nil {
				sendError(w, http.StatusBadRequest, "Invalid endTime", err)
				return
			}
			input.EndTime = aws.Time(ts)
		}
		if v := q.Get("period"); v != "" {
			n, err := strconv.Atoi(v)
			if err != nil || n <= 0 {
				sendError(w, http.StatusBadRequest, "Invalid period", err)
				return
			}
			input.Period = aws.Int32(int32(n))
		}
		if v := q.Get("statistics"); v != "" {
			parts := splitCSV(v)
			for _, s := range parts {
				input.Statistics = append(input.Statistics, cwtypes.Statistic(s))
			}
		}
		if v := q.Get("dimensions"); v != "" {
			var dims []cwtypes.Dimension
			if err := parseBody([]byte(v), &dims); err != nil {
				sendError(w, http.StatusBadRequest, "Invalid dimensions JSON", err)
				return
			}
			input.Dimensions = dims
		}
		if v := q.Get("unit"); v != "" {
			input.Unit = cwtypes.StandardUnit(v)
		}
	} else {
		markDeprecated(w, "GET /cloudwatch/metrics/statistics")
		bodyBytes := readBody(r)
		if err := parseBody(bodyBytes, input); err != nil {
			sendError(w, http.StatusBadRequest, "Invalid request body", err)
			return
		}
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
