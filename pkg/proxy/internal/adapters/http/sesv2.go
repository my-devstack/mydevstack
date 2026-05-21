package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/sesv2"
)

func (h *ProxyHandler) handleSES(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListEmailIdentities"):
		h.listEmailIdentities(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetEmailIdentity"):
		h.getEmailIdentity(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateEmailIdentity"):
		h.createEmailIdentity(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteEmailIdentity"):
		h.deleteEmailIdentity(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "SendEmail"):
		h.sendEmail(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "SendBulkEmail"):
		h.sendBulkEmail(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListEmailTemplates"):
		h.listEmailTemplates(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetEmailTemplate"):
		h.getEmailTemplate(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateEmailTemplate"):
		h.createEmailTemplate(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateEmailTemplate"):
		h.updateEmailTemplate(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteEmailTemplate"):
		h.deleteEmailTemplate(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetAccount"):
		h.getAccount(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown SES action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listEmailIdentities(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.ListEmailIdentitiesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().ListEmailIdentities(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list email identities", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getEmailIdentity(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.GetEmailIdentityInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().GetEmailIdentity(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get email identity", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createEmailIdentity(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.CreateEmailIdentityInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().CreateEmailIdentity(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create email identity", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteEmailIdentity(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.DeleteEmailIdentityInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().DeleteEmailIdentity(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete email identity", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) sendEmail(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.SendEmailInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().SendEmail(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to send email", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) sendBulkEmail(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.SendBulkEmailInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().SendBulkEmail(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to send bulk email", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listEmailTemplates(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.ListEmailTemplatesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().ListEmailTemplates(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list email templates", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getEmailTemplate(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.GetEmailTemplateInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().GetEmailTemplate(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get email template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createEmailTemplate(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.CreateEmailTemplateInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().CreateEmailTemplate(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create email template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateEmailTemplate(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.UpdateEmailTemplateInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().UpdateEmailTemplate(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update email template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteEmailTemplate(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.DeleteEmailTemplateInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().DeleteEmailTemplate(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete email template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getAccount(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &sesv2.GetAccountInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().GetAccount(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get account", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
