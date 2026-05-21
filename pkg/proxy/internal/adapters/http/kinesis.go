package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/kinesis"
)

func (h *ProxyHandler) handleKinesis(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListStreams"):
		h.listStreams(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateStream"):
		h.createStream(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteStream"):
		h.deleteStream(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeStream"):
		h.describeStream(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeStreamSummary"):
		h.describeStreamSummary(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListShards"):
		h.listShards(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetShardIterator"):
		h.getShardIterator(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRecords"):
		h.getRecords(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutRecord"):
		h.putRecord(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutRecords"):
		h.putRecords(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "MergeShards"):
		h.mergeShards(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "SplitShard"):
		h.splitShard(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateShardCount"):
		h.updateShardCount(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "EnableEnhancedMonitoring"):
		h.enableEnhancedMonitoring(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DisableEnhancedMonitoring"):
		h.disableEnhancedMonitoring(ctx, w, r, bodyBytes)
	default:
		sendError(w, http.StatusNotFound, "Kinesis operation not supported: "+xAmzTarget, nil)
	}
}

func (h *ProxyHandler) listStreams(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.ListStreamsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().ListStreams(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list streams", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStream(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.CreateStreamInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().CreateStream(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteStream(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.DeleteStreamInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().DeleteStream(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStream(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.DescribeStreamInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().DescribeStream(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStreamSummary(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.DescribeStreamSummaryInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().DescribeStreamSummary(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe stream summary", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listShards(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.ListShardsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().ListShards(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list shards", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getShardIterator(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.GetShardIteratorInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().GetShardIterator(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get shard iterator", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRecords(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.GetRecordsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().GetRecords(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get records", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putRecord(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.PutRecordInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().PutRecord(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put record", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putRecords(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.PutRecordsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().PutRecords(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put records", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) mergeShards(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.MergeShardsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().MergeShards(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to merge shards", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) splitShard(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.SplitShardInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().SplitShard(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to split shard", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateShardCount(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.UpdateShardCountInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().UpdateShardCount(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update shard count", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) enableEnhancedMonitoring(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.EnableEnhancedMonitoringInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().EnableEnhancedMonitoring(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to enable enhanced monitoring", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) disableEnhancedMonitoring(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kinesis.DisableEnhancedMonitoringInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Kinesis().DisableEnhancedMonitoring(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to disable enhanced monitoring", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
