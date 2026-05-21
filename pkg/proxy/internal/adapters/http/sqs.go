package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

func (h *ProxyHandler) handleSQS(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListQueues"):
		h.listQueues(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateQueue"):
		h.createQueue(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteQueue"):
		h.deleteQueue(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetQueueUrl"):
		h.getQueueUrl(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "SendMessage"):
		h.sendMessage(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ReceiveMessage"):
		h.receiveMessage(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteMessage"):
		h.deleteMessage(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PurgeQueue"):
		h.purgeQueue(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetQueueAttributes"):
		h.getQueueAttributes(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "SetQueueAttributes"):
		h.setQueueAttributes(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown SQS action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listQueues(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.ListQueuesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().ListQueues(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list queues", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createQueue(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.CreateQueueInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().CreateQueue(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create queue", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteQueue(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.DeleteQueueInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().DeleteQueue(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete queue", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getQueueUrl(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.GetQueueUrlInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().GetQueueUrl(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get queue URL", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) sendMessage(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.SendMessageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().SendMessage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to send message", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) receiveMessage(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.ReceiveMessageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().ReceiveMessage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to receive message", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteMessage(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.DeleteMessageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().DeleteMessage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete message", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) purgeQueue(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.PurgeQueueInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().PurgeQueue(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to purge queue", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getQueueAttributes(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.GetQueueAttributesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().GetQueueAttributes(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get queue attributes", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) setQueueAttributes(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sqs.SetQueueAttributesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().SetQueueAttributes(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to set queue attributes", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
