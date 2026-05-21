package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
)

func (h *ProxyHandler) handleDynamoDBStreams(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListStreams"):
		h.listStreamsStreams(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeStream"):
		h.describeStreamStreams(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetShardIterator"):
		h.getShardIteratorStreams(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRecords"):
		h.getRecordsStreams(ctx, w, r, bodyBytes)
	default:
		sendError(w, http.StatusNotFound, "DynamoDBStreams operation not supported: "+xAmzTarget, nil)
	}
}

func (h *ProxyHandler) listStreamsStreams(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &dynamodbstreams.ListStreamsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.DynamoDBStreams().ListStreams(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list streams", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStreamStreams(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &dynamodbstreams.DescribeStreamInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.DynamoDBStreams().DescribeStream(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getShardIteratorStreams(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &dynamodbstreams.GetShardIteratorInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.DynamoDBStreams().GetShardIterator(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get shard iterator", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRecordsStreams(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &dynamodbstreams.GetRecordsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.DynamoDBStreams().GetRecords(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get records", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
