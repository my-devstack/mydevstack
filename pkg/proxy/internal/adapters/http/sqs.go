package httphandlers

import (
	"fmt"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/aws/aws-sdk-go-v2/service/sqs/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerSQSRoutes(r chi.Router) {
	r.Route("/sqs", func(r chi.Router) {
		r.Get("/queues", h.listQueues)
		r.Post("/queues", h.createQueue)
		r.Get("/queues/{queueName}", h.getQueueUrl)
		r.Get("/queues/{queueName}/attributes", h.getQueueAttributes)
		r.Put("/queues/{queueName}/attributes", h.setQueueAttributes)
		r.Delete("/queues/{queueName}", h.deleteQueue)
		r.Post("/queues/{queueName}/messages", h.sendMessage)
		r.Get("/queues/{queueName}/messages", h.receiveMessage)
		r.Delete("/queues/{queueName}/messages/{receiptHandle}", h.deleteMessage)
		r.Post("/queues/{queueName}/purge", h.purgeQueue)
	})
}

func (h *ProxyHandler) listQueues(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sqs.ListQueuesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().ListQueues(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list queues", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createQueue(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sqs.CreateQueueInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().CreateQueue(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create queue", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteQueue(w http.ResponseWriter, r *http.Request) {
	queueName := chi.URLParam(r, "queueName")

	// Look up the QueueUrl from the queue name
	urlResult, err := h.Svc.SQS().GetQueueUrl(h.ctx, &sqs.GetQueueUrlInput{
		QueueName: aws.String(queueName),
	})
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get queue URL", err)
		return
	}

	input := &sqs.DeleteQueueInput{
		QueueUrl: urlResult.QueueUrl,
	}
	// Also try reading QueueUrl from body for backward compatibility
	if bodyBytes := readBody(r); len(bodyBytes) > 0 {
		var body struct {
			QueueUrl string `json:"QueueUrl"`
		}
		if err := parseBody(bodyBytes, &body); err == nil && body.QueueUrl != "" {
			input.QueueUrl = aws.String(body.QueueUrl)
		}
	}

	result, err := h.Svc.SQS().DeleteQueue(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete queue", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getQueueUrl(w http.ResponseWriter, r *http.Request) {
	input := &sqs.GetQueueUrlInput{
		QueueName: aws.String(chi.URLParam(r, "queueName")),
	}
	result, err := h.Svc.SQS().GetQueueUrl(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get queue URL", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) resolveQueueURL(w http.ResponseWriter, r *http.Request) *string {
	queueName := chi.URLParam(r, "queueName")
	urlResult, err := h.Svc.SQS().GetQueueUrl(h.ctx, &sqs.GetQueueUrlInput{
		QueueName: aws.String(queueName),
	})
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get queue URL", err)
		return nil
	}
	return urlResult.QueueUrl
}

func (h *ProxyHandler) sendMessage(w http.ResponseWriter, r *http.Request) {
	queueURL := h.resolveQueueURL(w, r)
	if queueURL == nil {
		return
	}
	bodyBytes := readBody(r)
	input := &sqs.SendMessageInput{
		QueueUrl: queueURL,
	}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().SendMessage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to send message", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) receiveMessage(w http.ResponseWriter, r *http.Request) {
	queueURL := h.resolveQueueURL(w, r)
	if queueURL == nil {
		return
	}
	input := &sqs.ReceiveMessageInput{
		QueueUrl: queueURL,
	}
	// Read optional params from query string
	if v := r.URL.Query().Get("MaxNumberOfMessages"); v != "" {
		var m int
		if _, err := fmt.Sscanf(v, "%d", &m); err == nil && m > 0 {
			input.MaxNumberOfMessages = int32(m)
		}
	}
	if v := r.URL.Query().Get("WaitTimeSeconds"); v != "" {
		var m int
		if _, err := fmt.Sscanf(v, "%d", &m); err == nil && m > 0 {
			input.WaitTimeSeconds = int32(m)
		}
	}
	if v := r.URL.Query().Get("VisibilityTimeout"); v != "" {
		var m int
		if _, err := fmt.Sscanf(v, "%d", &m); err == nil && m > 0 {
			input.VisibilityTimeout = int32(m)
		}
	}
	// Also try reading from body for backward compatibility
	if bodyBytes := readBody(r); len(bodyBytes) > 0 {
		var body struct {
			MaxNumberOfMessages int32 `json:"MaxNumberOfMessages"`
			WaitTimeSeconds     int32 `json:"WaitTimeSeconds"`
			VisibilityTimeout   int32 `json:"VisibilityTimeout"`
		}
		if err := parseBody(bodyBytes, &body); err == nil {
			if body.MaxNumberOfMessages > 0 {
				input.MaxNumberOfMessages = body.MaxNumberOfMessages
			}
			if body.WaitTimeSeconds > 0 {
				input.WaitTimeSeconds = body.WaitTimeSeconds
			}
			if body.VisibilityTimeout > 0 {
				input.VisibilityTimeout = body.VisibilityTimeout
			}
		}
	}
	result, err := h.Svc.SQS().ReceiveMessage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to receive message", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteMessage(w http.ResponseWriter, r *http.Request) {
	queueURL := h.resolveQueueURL(w, r)
	if queueURL == nil {
		return
	}
	input := &sqs.DeleteMessageInput{
		QueueUrl:      queueURL,
		ReceiptHandle: aws.String(urlParam(r, "receiptHandle")),
	}
	result, err := h.Svc.SQS().DeleteMessage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete message", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) purgeQueue(w http.ResponseWriter, r *http.Request) {
	queueURL := h.resolveQueueURL(w, r)
	if queueURL == nil {
		return
	}
	input := &sqs.PurgeQueueInput{
		QueueUrl: queueURL,
	}
	result, err := h.Svc.SQS().PurgeQueue(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to purge queue", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getQueueAttributes(w http.ResponseWriter, r *http.Request) {
	queueName := chi.URLParam(r, "queueName")

	// Look up the QueueUrl from the queue name
	urlResult, err := h.Svc.SQS().GetQueueUrl(h.ctx, &sqs.GetQueueUrlInput{
		QueueName: aws.String(queueName),
	})
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get queue URL", err)
		return
	}

	input := &sqs.GetQueueAttributesInput{
		QueueUrl: urlResult.QueueUrl,
	}

	// Read optional AttributeNames from query params
	if attrNames := r.URL.Query()["AttributeName"]; len(attrNames) > 0 {
		for _, n := range attrNames {
			input.AttributeNames = append(input.AttributeNames, types.QueueAttributeName(n))
		}
	}

	result, err := h.Svc.SQS().GetQueueAttributes(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get queue attributes", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) setQueueAttributes(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sqs.SetQueueAttributesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SQS().SetQueueAttributes(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to set queue attributes", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
