package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	cwlogstypes "github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerCloudWatchLogsRoutes(r chi.Router) {
	r.Route("/cloudwatch-logs", func(r chi.Router) {
		r.Get("/log-groups", h.describeLogGroups)
		r.Post("/log-groups", h.createLogGroup)
		r.Delete("/log-groups/{logGroupName}", h.deleteLogGroup)
		r.Put("/log-groups/{logGroupName}/retention", h.putRetentionPolicy)

		r.Get("/log-groups/{logGroupName}/log-streams", h.describeLogStreams)
		r.Post("/log-groups/{logGroupName}/log-streams", h.createLogStream)
		r.Post("/log-groups/{logGroupName}/log-streams/{logStreamName}/events", h.putLogEvents)
		r.Get("/log-groups/{logGroupName}/log-streams/{logStreamName}/events", h.getLogEvents)

		r.Post("/metric-filters", h.putMetricFilter)
		r.Get("/metric-filters", h.describeMetricFilters)
	})
}

func (h *ProxyHandler) describeLogGroups(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatchlogs.DescribeLogGroupsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().DescribeLogGroups(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe log groups", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createLogGroup(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatchlogs.CreateLogGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().CreateLogGroup(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create log group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteLogGroup(w http.ResponseWriter, r *http.Request) {
	input := &cloudwatchlogs.DeleteLogGroupInput{
		LogGroupName: aws.String(urlParam(r, "logGroupName")),
	}
	result, err := h.Svc.CloudWatchLogs().DeleteLogGroup(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete log group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeLogStreams(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		OrderBy        string `json:"OrderBy"`
		Descending     bool   `json:"Descending"`
		Limit          int32  `json:"Limit"`
		NextToken      string `json:"NextToken"`
		LogStreamNamePrefix string `json:"LogStreamNamePrefix"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &cloudwatchlogs.DescribeLogStreamsInput{
		LogGroupName: aws.String(urlParam(r, "logGroupName")),
	}
	if body.OrderBy != "" {
		input.OrderBy = cwlogstypes.OrderBy(body.OrderBy)
	}
	if body.Descending {
		input.Descending = aws.Bool(true)
	}
	if body.Limit > 0 {
		input.Limit = aws.Int32(body.Limit)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	result, err := h.Svc.CloudWatchLogs().DescribeLogStreams(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe log streams", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createLogStream(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatchlogs.CreateLogStreamInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.LogGroupName = aws.String(urlParam(r, "logGroupName"))
	result, err := h.Svc.CloudWatchLogs().CreateLogStream(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create log stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putLogEvents(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatchlogs.PutLogEventsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.LogGroupName = aws.String(urlParam(r, "logGroupName"))
	input.LogStreamName = aws.String(urlParam(r, "logStreamName"))
	result, err := h.Svc.CloudWatchLogs().PutLogEvents(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put log events", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getLogEvents(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Limit          int32  `json:"Limit"`
		NextToken      string `json:"NextToken"`
		StartFromHead  bool   `json:"StartFromHead"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &cloudwatchlogs.GetLogEventsInput{
		LogGroupName:  aws.String(urlParam(r, "logGroupName")),
		LogStreamName: aws.String(urlParam(r, "logStreamName")),
	}
	if body.Limit > 0 {
		input.Limit = aws.Int32(body.Limit)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.StartFromHead {
		input.StartFromHead = aws.Bool(true)
	}
	result, err := h.Svc.CloudWatchLogs().GetLogEvents(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get log events", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putMetricFilter(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatchlogs.PutMetricFilterInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().PutMetricFilter(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put metric filter", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeMetricFilters(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatchlogs.DescribeMetricFiltersInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudWatchLogs().DescribeMetricFilters(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe metric filters", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putRetentionPolicy(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudwatchlogs.PutRetentionPolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.LogGroupName = aws.String(urlParam(r, "logGroupName"))
	result, err := h.Svc.CloudWatchLogs().PutRetentionPolicy(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put retention policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
