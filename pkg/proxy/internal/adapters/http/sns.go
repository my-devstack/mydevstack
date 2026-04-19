package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/sns"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleSNS(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "ListTopics"):
		h.listTopics(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateTopic"):
		h.createTopic(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteTopic"):
		h.deleteTopic(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "Subscribe"):
		h.subscribe(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "Unsubscribe"):
		h.unsubscribe(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListSubscriptions"):
		h.listSubscriptions(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListSubscriptionsByTopic"):
		h.listSubscriptionsByTopic(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "Publish"):
		h.publish(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown SNS action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listTopics(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sns.ListTopicsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SNS().ListTopics(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list topics", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createTopic(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sns.CreateTopicInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SNS().CreateTopic(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create topic", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteTopic(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sns.DeleteTopicInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SNS().DeleteTopic(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete topic", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) subscribe(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sns.SubscribeInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SNS().Subscribe(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to subscribe", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) unsubscribe(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sns.UnsubscribeInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SNS().Unsubscribe(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to unsubscribe", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listSubscriptions(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sns.ListSubscriptionsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SNS().ListSubscriptions(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list subscriptions", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listSubscriptionsByTopic(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sns.ListSubscriptionsByTopicInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SNS().ListSubscriptionsByTopic(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list subscriptions by topic", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) publish(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sns.PublishInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SNS().Publish(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to publish", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
