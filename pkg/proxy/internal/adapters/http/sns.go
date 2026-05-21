package httphandlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/sns"
)

func (h *ProxyHandler) handleSNS(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListTopics"):
		h.listTopics(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateTopic"):
		h.createTopic(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteTopic"):
		h.deleteTopic(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "Subscribe"):
		h.subscribe(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "Unsubscribe"):
		h.unsubscribe(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListSubscriptionsByTopic"):
		h.listSubscriptionsByTopic(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListSubscriptions"):
		h.listSubscriptions(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "Publish"):
		h.publish(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown SNS action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listTopics(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sns.ListTopicsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().ListTopics(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list topics", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createTopic(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sns.CreateTopicInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().CreateTopic(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create topic", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteTopic(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sns.DeleteTopicInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().DeleteTopic(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete topic", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) subscribe(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sns.SubscribeInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().Subscribe(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to subscribe", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) unsubscribe(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sns.UnsubscribeInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().Unsubscribe(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to unsubscribe", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listSubscriptions(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sns.ListSubscriptionsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().ListSubscriptions(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list subscriptions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listSubscriptionsByTopic(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	type requestBody struct {
		TopicArn string `json:"TopicArn"`
	}
	var body requestBody
	if err := json.Unmarshal(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &sns.ListSubscriptionsByTopicInput{}
	if body.TopicArn != "" {
		input.TopicArn = &body.TopicArn
	}
	result, err := h.Svc.SNS().ListSubscriptionsByTopic(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list subscriptions by topic", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) publish(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sns.PublishInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().Publish(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to publish", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
