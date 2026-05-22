package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	kinesistypes "github.com/aws/aws-sdk-go-v2/service/kinesis/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerKinesisRoutes(r chi.Router) {
	r.Route("/kinesis", func(r chi.Router) {
		r.Get("/streams", h.listStreams)
		r.Post("/streams", h.createStream)
		r.Get("/streams/{streamName}", h.describeStream)
		r.Get("/streams/{streamName}/summary", h.describeStreamSummary)
		r.Delete("/streams/{streamName}", h.deleteStream)
		r.Put("/streams/{streamName}", h.updateShardCount)

		r.Get("/streams/{streamName}/shards", h.listShards)
		r.Post("/streams/{streamName}/shards/{shardId}/iterator", h.getShardIterator)
		r.Get("/streams/{streamName}/shards/{shardId}/records", h.getRecords)

		r.Post("/streams/{streamName}/records", h.putRecord)
		r.Post("/streams/{streamName}/records/batch", h.putRecords)

		r.Post("/streams/{streamName}/shards/{shardId}/merge", h.mergeShards)
		r.Post("/streams/{streamName}/shards/{shardId}/split", h.splitShard)

		r.Post("/streams/{streamName}/enhanced-monitoring", h.enableEnhancedMonitoring)
		r.Delete("/streams/{streamName}/enhanced-monitoring", h.disableEnhancedMonitoring)
	})
}

func (h *ProxyHandler) listStreams(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kinesis.ListStreamsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().ListStreams(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list streams", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStream(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kinesis.CreateStreamInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().CreateStream(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteStream(w http.ResponseWriter, r *http.Request) {
	input := &kinesis.DeleteStreamInput{
		StreamName: aws.String(chi.URLParam(r, "streamName")),
	}
	result, err := h.Svc.Kinesis().DeleteStream(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStream(w http.ResponseWriter, r *http.Request) {
	input := &kinesis.DescribeStreamInput{
		StreamName: aws.String(chi.URLParam(r, "streamName")),
	}
	result, err := h.Svc.Kinesis().DescribeStream(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStreamSummary(w http.ResponseWriter, r *http.Request) {
	input := &kinesis.DescribeStreamSummaryInput{
		StreamName: aws.String(chi.URLParam(r, "streamName")),
	}
	result, err := h.Svc.Kinesis().DescribeStreamSummary(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe stream summary", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listShards(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kinesis.ListShardsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().ListShards(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list shards", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getShardIterator(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		ShardIteratorType string `json:"ShardIteratorType"`
		StartingSequenceNumber string `json:"StartingSequenceNumber"`
		Timestamp          int64  `json:"Timestamp"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &kinesis.GetShardIteratorInput{
		StreamName: aws.String(chi.URLParam(r, "streamName")),
		ShardId:    aws.String(chi.URLParam(r, "shardId")),
	}
	if body.ShardIteratorType != "" {
		input.ShardIteratorType = kinesistypes.ShardIteratorType(body.ShardIteratorType)
	}
	if body.StartingSequenceNumber != "" {
		input.StartingSequenceNumber = aws.String(body.StartingSequenceNumber)
	}
	result, err := h.Svc.Kinesis().GetShardIterator(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get shard iterator", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRecords(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		ShardIterator string `json:"ShardIterator"`
		Limit         int32  `json:"Limit"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &kinesis.GetRecordsInput{}
	if body.ShardIterator != "" {
		input.ShardIterator = aws.String(body.ShardIterator)
	}
	if body.Limit > 0 {
		input.Limit = aws.Int32(body.Limit)
	}
	result, err := h.Svc.Kinesis().GetRecords(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get records", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putRecord(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kinesis.PutRecordInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.StreamName = aws.String(chi.URLParam(r, "streamName"))
	result, err := h.Svc.Kinesis().PutRecord(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put record", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putRecords(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kinesis.PutRecordsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.StreamARN = aws.String(chi.URLParam(r, "streamName"))
	result, err := h.Svc.Kinesis().PutRecords(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put records", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) mergeShards(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		ShardToMerge    string `json:"ShardToMerge"`
		AdjacentShardToMerge string `json:"AdjacentShardToMerge"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &kinesis.MergeShardsInput{
		StreamName: aws.String(chi.URLParam(r, "streamName")),
	}
	if body.ShardToMerge != "" {
		input.ShardToMerge = aws.String(body.ShardToMerge)
	}
	if body.AdjacentShardToMerge != "" {
		input.AdjacentShardToMerge = aws.String(body.AdjacentShardToMerge)
	}
	result, err := h.Svc.Kinesis().MergeShards(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to merge shards", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) splitShard(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		NewStartingHashKey string `json:"NewStartingHashKey"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &kinesis.SplitShardInput{
		StreamName: aws.String(chi.URLParam(r, "streamName")),
	}
	if body.NewStartingHashKey != "" {
		input.NewStartingHashKey = aws.String(body.NewStartingHashKey)
	}
	result, err := h.Svc.Kinesis().SplitShard(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to split shard", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateShardCount(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		TargetShardCount int32  `json:"TargetShardCount"`
		ScalingType      string `json:"ScalingType"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &kinesis.UpdateShardCountInput{
		StreamName: aws.String(chi.URLParam(r, "streamName")),
	}
	if body.TargetShardCount > 0 {
		input.TargetShardCount = aws.Int32(body.TargetShardCount)
	}
	if body.ScalingType != "" {
		input.ScalingType = kinesistypes.ScalingType(body.ScalingType)
	}
	result, err := h.Svc.Kinesis().UpdateShardCount(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update shard count", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) enableEnhancedMonitoring(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kinesis.EnableEnhancedMonitoringInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.StreamName = aws.String(chi.URLParam(r, "streamName"))
	result, err := h.Svc.Kinesis().EnableEnhancedMonitoring(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to enable enhanced monitoring", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) disableEnhancedMonitoring(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kinesis.DisableEnhancedMonitoringInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.StreamName = aws.String(chi.URLParam(r, "streamName"))
	result, err := h.Svc.Kinesis().DisableEnhancedMonitoring(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to disable enhanced monitoring", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
