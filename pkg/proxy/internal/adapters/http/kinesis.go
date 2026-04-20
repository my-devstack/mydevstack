package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/kinesis"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleKinesis(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "ListStreams"):
		h.listStreams(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateStream"):
		h.createStream(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteStream"):
		h.deleteStream(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeStream"):
		h.describeStream(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeStreamSummary"):
		h.describeStreamSummary(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListShards"):
		h.listShards(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetShardIterator"):
		h.getShardIterator(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRecords"):
		h.getRecords(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutRecord"):
		h.putRecord(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutRecords"):
		h.putRecords(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "MergeShards"):
		h.mergeShards(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "SplitShard"):
		h.splitShard(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateShardCount"):
		h.updateShardCount(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "EnableEnhancedMonitoring"):
		h.enableEnhancedMonitoring(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DisableEnhancedMonitoring"):
		h.disableEnhancedMonitoring(ctx, c, bodyBytes)
	default:
		sendError(c, http.StatusNotFound, "Kinesis operation not supported: "+xAmzTarget, nil)
	}
}

func (h *ProxyHandler) listStreams(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.ListStreamsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().ListStreams(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list streams", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createStream(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.CreateStreamInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().CreateStream(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create stream", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteStream(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.DeleteStreamInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().DeleteStream(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete stream", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeStream(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.DescribeStreamInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().DescribeStream(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe stream", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeStreamSummary(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.DescribeStreamSummaryInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().DescribeStreamSummary(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe stream summary", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listShards(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.ListShardsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().ListShards(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list shards", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getShardIterator(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.GetShardIteratorInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().GetShardIterator(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get shard iterator", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getRecords(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.GetRecordsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().GetRecords(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get records", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putRecord(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.PutRecordInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().PutRecord(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put record", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putRecords(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.PutRecordsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().PutRecords(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put records", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) mergeShards(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.MergeShardsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().MergeShards(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to merge shards", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) splitShard(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.SplitShardInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().SplitShard(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to split shard", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateShardCount(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.UpdateShardCountInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().UpdateShardCount(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update shard count", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) enableEnhancedMonitoring(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.EnableEnhancedMonitoringInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().EnableEnhancedMonitoring(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to enable enhanced monitoring", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) disableEnhancedMonitoring(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kinesis.DisableEnhancedMonitoringInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.Kinesis().DisableEnhancedMonitoring(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to disable enhanced monitoring", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
