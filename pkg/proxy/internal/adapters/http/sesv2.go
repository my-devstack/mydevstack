package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleSES(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "ListEmailIdentities"):
		h.listEmailIdentities(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetEmailIdentity"):
		h.getEmailIdentity(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateEmailIdentity"):
		h.createEmailIdentity(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteEmailIdentity"):
		h.deleteEmailIdentity(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "SendEmail"):
		h.sendEmail(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "SendBulkEmail"):
		h.sendBulkEmail(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListEmailTemplates"):
		h.listEmailTemplates(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetEmailTemplate"):
		h.getEmailTemplate(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateEmailTemplate"):
		h.createEmailTemplate(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateEmailTemplate"):
		h.updateEmailTemplate(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteEmailTemplate"):
		h.deleteEmailTemplate(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetAccount"):
		h.getAccount(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown SES action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listEmailIdentities(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.ListEmailIdentitiesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().ListEmailIdentities(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list email identities", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getEmailIdentity(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.GetEmailIdentityInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().GetEmailIdentity(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get email identity", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createEmailIdentity(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.CreateEmailIdentityInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().CreateEmailIdentity(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create email identity", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteEmailIdentity(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.DeleteEmailIdentityInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().DeleteEmailIdentity(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete email identity", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) sendEmail(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.SendEmailInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().SendEmail(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to send email", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) sendBulkEmail(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.SendBulkEmailInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().SendBulkEmail(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to send bulk email", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listEmailTemplates(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.ListEmailTemplatesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().ListEmailTemplates(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list email templates", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getEmailTemplate(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.GetEmailTemplateInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().GetEmailTemplate(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get email template", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createEmailTemplate(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.CreateEmailTemplateInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().CreateEmailTemplate(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create email template", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateEmailTemplate(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.UpdateEmailTemplateInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().UpdateEmailTemplate(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update email template", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteEmailTemplate(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.DeleteEmailTemplateInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().DeleteEmailTemplate(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete email template", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getAccount(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &sesv2.GetAccountInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SESv2().GetAccount(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get account", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
