package httphandlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodbstreams"
	dstypes "github.com/aws/aws-sdk-go-v2/service/dynamodbstreams/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerDynamoDBStreamsRoutes(r chi.Router) {
	r.Route("/dynamodb-streams", func(r chi.Router) {
		r.Get("/streams", h.listStreamsStreams)
		r.Get("/streams/{streamArn}", h.describeStreamStreams)
		// GET variants for read operations (read-only-mode friendly).
		r.Get("/streams/{streamArn}/shards/{shardId}/iterator", h.getShardIteratorStreams)
		r.Get("/streams/{streamArn}/shards/{shardId}/records", h.getRecordsStreams)
		// Deprecated POST twins (kept one release for backward compatibility).
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

// getShardIteratorStreams serves both GET (query params) and POST (JSON body).
// GET contract: shardIteratorType, startingSequenceNumber, startingTimestamp.
// POST contract (deprecated): ShardIteratorType, SequenceNumber.
func (h *ProxyHandler) getShardIteratorStreams(w http.ResponseWriter, r *http.Request) {
	input := &dynamodbstreams.GetShardIteratorInput{
		StreamArn: aws.String(urlParam(r, "streamArn")),
		ShardId:   aws.String(urlParam(r, "shardId")),
	}
	if r.Method == http.MethodGet {
		q := r.URL.Query()
		if v := q.Get("shardIteratorType"); v != "" {
			input.ShardIteratorType = dstypes.ShardIteratorType(v)
		}
		if v := q.Get("startingSequenceNumber"); v != "" {
			input.SequenceNumber = aws.String(v)
		}
		if v := q.Get("startingTimestamp"); v != "" {
			ts, err := parseTimestamp(v)
			if err != nil {
				sendError(w, http.StatusBadRequest, "Invalid startingTimestamp", err)
				return
			}
			input.Timestamp = aws.Time(ts)
		}
	} else {
		bodyBytes := readBody(r)
		var body struct {
			ShardIteratorType string `json:"ShardIteratorType"`
			SequenceNumber    string `json:"SequenceNumber"`
		}
		if err := parseBody(bodyBytes, &body); err != nil {
			sendError(w, http.StatusBadRequest, "Invalid request body", err)
			return
		}
		if body.ShardIteratorType != "" {
			input.ShardIteratorType = dstypes.ShardIteratorType(body.ShardIteratorType)
		}
		if body.SequenceNumber != "" {
			input.SequenceNumber = aws.String(body.SequenceNumber)
		}
	}
	result, err := h.Svc.DynamoDBStreams().GetShardIterator(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get shard iterator", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// getRecordsStreams serves both GET (query params) and POST (JSON body).
// GET contract: shardIterator, limit.
func (h *ProxyHandler) getRecordsStreams(w http.ResponseWriter, r *http.Request) {
	input := &dynamodbstreams.GetRecordsInput{}
	if r.Method == http.MethodGet {
		q := r.URL.Query()
		if v := q.Get("shardIterator"); v != "" {
			input.ShardIterator = aws.String(v)
		}
		if v := q.Get("limit"); v != "" {
			n, err := strconv.Atoi(v)
			if err != nil || n < 0 {
				sendError(w, http.StatusBadRequest, "Invalid limit", err)
				return
			}
			input.Limit = aws.Int32(int32(n))
		}
	} else {
		bodyBytes := readBody(r)
		var body struct {
			ShardIterator string `json:"ShardIterator"`
			Limit         int32  `json:"Limit"`
		}
		if err := parseBody(bodyBytes, &body); err != nil {
			sendError(w, http.StatusBadRequest, "Invalid request body", err)
			return
		}
		if body.ShardIterator != "" {
			input.ShardIterator = aws.String(body.ShardIterator)
		}
		if body.Limit > 0 {
			input.Limit = aws.Int32(body.Limit)
		}
	}
	result, err := h.Svc.DynamoDBStreams().GetRecords(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get records", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// parseTimestamp parses a timestamp query value. Accepts RFC3339 or Unix
// seconds (integer or float) or Unix milliseconds (integer).
func parseTimestamp(v string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, v); err == nil {
		return t, nil
	}
	if f, err := strconv.ParseFloat(v, 64); err == nil {
		sec := int64(f)
		nsec := int64((f - float64(sec)) * 1e9)
		// Heuristic: if value is huge, treat as milliseconds.
		if sec > 1e12 {
			return time.UnixMilli(sec), nil
		}
		return time.Unix(sec, nsec), nil
	}
	return time.Time{}, strconv.ErrSyntax
}


