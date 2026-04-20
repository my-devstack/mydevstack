package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/sqs"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleSQS(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "ListQueues"):
		h.listQueues(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateQueue"):
		h.createQueue(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteQueue"):
		h.deleteQueue(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetQueueUrl"):
		h.getQueueUrl(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "SendMessage"):
		h.sendMessage(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ReceiveMessage"):
		h.receiveMessage(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteMessage"):
		h.deleteMessage(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PurgeQueue"):
		h.purgeQueue(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetQueueAttributes"):
		h.getQueueAttributes(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "SetQueueAttributes"):
		h.setQueueAttributes(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown SQS action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listQueues(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.ListQueuesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().ListQueues(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list queues", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createQueue(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.CreateQueueInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().CreateQueue(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create queue", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteQueue(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.DeleteQueueInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().DeleteQueue(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete queue", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getQueueUrl(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.GetQueueUrlInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().GetQueueUrl(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get queue URL", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) sendMessage(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.SendMessageInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().SendMessage(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to send message", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) receiveMessage(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.ReceiveMessageInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().ReceiveMessage(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to receive message", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteMessage(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.DeleteMessageInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().DeleteMessage(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete message", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) purgeQueue(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.PurgeQueueInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().PurgeQueue(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to purge queue", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getQueueAttributes(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.GetQueueAttributesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().GetQueueAttributes(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get queue attributes", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) setQueueAttributes(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sqs.SetQueueAttributesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SQS().SetQueueAttributes(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to set queue attributes", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
