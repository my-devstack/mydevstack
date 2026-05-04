package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleDynamoDBStreams(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "ListStreams"):
		h.listStreamsStreams(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeStream"):
		h.describeStreamStreams(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetShardIterator"):
		h.getShardIteratorStreams(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRecords"):
		h.getRecordsStreams(ctx, c, bodyBytes)
	default:
		sendError(c, http.StatusNotFound, "DynamoDBStreams operation not supported: "+xAmzTarget, nil)
	}
}

func (h *ProxyHandler) listStreamsStreams(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodbstreams.ListStreamsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDBStreams().ListStreams(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list streams", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeStreamStreams(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodbstreams.DescribeStreamInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDBStreams().DescribeStream(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe stream", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getShardIteratorStreams(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodbstreams.GetShardIteratorInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDBStreams().GetShardIterator(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get shard iterator", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getRecordsStreams(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodbstreams.GetRecordsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDBStreams().GetRecords(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get records", err)
		return
	}
	c.JSON(http.StatusOK, result)
}