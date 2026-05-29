package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerSNSRoutes(r chi.Router) {
	r.Route("/sns", func(r chi.Router) {
		r.Get("/topics", h.listTopics)
		r.Post("/topics", h.createTopic)
		r.Delete("/topics/{topicArn}", h.deleteTopic)

		r.Post("/subscriptions", h.subscribe)
		r.Delete("/subscriptions/{subscriptionArn}", h.unsubscribe)
		r.Get("/subscriptions", h.listSubscriptions)
		r.Get("/subscriptions/by-topic/{topicArn}", h.listSubscriptionsByTopic)

		r.Post("/publish", h.publish)
	})
}

func (h *ProxyHandler) listTopics(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sns.ListTopicsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().ListTopics(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list topics", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createTopic(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sns.CreateTopicInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().CreateTopic(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create topic", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteTopic(w http.ResponseWriter, r *http.Request) {
	input := &sns.DeleteTopicInput{
		TopicArn: aws.String(urlParam(r, "topicArn")),
	}
	result, err := h.Svc.SNS().DeleteTopic(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete topic", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) subscribe(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sns.SubscribeInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().Subscribe(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to subscribe", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) unsubscribe(w http.ResponseWriter, r *http.Request) {
	input := &sns.UnsubscribeInput{
		SubscriptionArn: aws.String(urlParam(r, "subscriptionArn")),
	}
	result, err := h.Svc.SNS().Unsubscribe(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to unsubscribe", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listSubscriptions(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sns.ListSubscriptionsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().ListSubscriptions(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list subscriptions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listSubscriptionsByTopic(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		NextToken string `json:"NextToken"`
	}
	// parseBody handles nil/empty body gracefully (returns nil for empty).
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &sns.ListSubscriptionsByTopicInput{
		TopicArn: aws.String(urlParam(r, "topicArn")),
	}
	if body.NextToken != "" {
		input.NextToken = &body.NextToken
	}
	result, err := h.Svc.SNS().ListSubscriptionsByTopic(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list subscriptions by topic", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) publish(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sns.PublishInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SNS().Publish(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to publish", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}


