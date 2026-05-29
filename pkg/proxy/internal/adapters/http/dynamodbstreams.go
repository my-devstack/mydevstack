package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
	dstypes "github.com/aws/aws-sdk-go-v2/service/dynamodbstreams/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerDynamoDBStreamsRoutes(r chi.Router) {
	r.Route("/dynamodb-streams", func(r chi.Router) {
		r.Get("/streams", h.listStreamsStreams)
		r.Get("/streams/{streamArn}", h.describeStreamStreams)
		r.Post("/streams/{streamArn}/shards/{shardId}/iterator", h.getShardIteratorStreams)
		r.Post("/streams/{streamArn}/shards/{shardId}/records", h.getRecordsStreams)
	})
}

func (h *ProxyHandler) listStreamsStreams(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &dynamodbstreams.ListStreamsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.DynamoDBStreams().ListStreams(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list streams", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStreamStreams(w http.ResponseWriter, r *http.Request) {
	input := &dynamodbstreams.DescribeStreamInput{
		StreamArn: aws.String(urlParam(r, "streamArn")),
	}
	result, err := h.Svc.DynamoDBStreams().DescribeStream(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe stream", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getShardIteratorStreams(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		ShardIteratorType string `json:"ShardIteratorType"`
		SequenceNumber    string `json:"SequenceNumber"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &dynamodbstreams.GetShardIteratorInput{
		StreamArn: aws.String(urlParam(r, "streamArn")),
		ShardId:   aws.String(urlParam(r, "shardId")),
	}
	if body.ShardIteratorType != "" {
		input.ShardIteratorType = dstypes.ShardIteratorType(body.ShardIteratorType)
	}
	if body.SequenceNumber != "" {
		input.SequenceNumber = aws.String(body.SequenceNumber)
	}
	result, err := h.Svc.DynamoDBStreams().GetShardIterator(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get shard iterator", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRecordsStreams(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		ShardIterator string `json:"ShardIterator"`
		Limit         int32  `json:"Limit"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &dynamodbstreams.GetRecordsInput{}
	if body.ShardIterator != "" {
		input.ShardIterator = aws.String(body.ShardIterator)
	}
	if body.Limit > 0 {
		input.Limit = aws.Int32(body.Limit)
	}
	result, err := h.Svc.DynamoDBStreams().GetRecords(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get records", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
