package httphandlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/smithy-go"
	"github.com/go-chi/chi/v5"
)

// sesv2ErrorStatus maps SESv2 SDK errors to HTTP status codes.
// Validation errors → 400, unsupported ops → 501, not found → 404, else 500.
func sesv2ErrorStatus(err error) int {
	var apiErr smithy.APIError
	if errors.As(err, &apiErr) {
		code := apiErr.ErrorCode()
		// Validation errors
		if strings.Contains(code, "Validation") || strings.Contains(code, "BadRequest") {
			return http.StatusBadRequest
		}
		// Not found
		if strings.Contains(code, "NotFound") {
			return http.StatusNotFound
		}
		// Unsupported operation
		if strings.Contains(code, "Unsupported") || strings.Contains(code, "NotImplemented") {
			return http.StatusNotImplemented
		}
	}
	// Check error message for validation patterns
	if strings.Contains(err.Error(), "validation error") {
		return http.StatusBadRequest
	}
	return http.StatusInternalServerError
}

// sendSESError sends an error response with status derived from the SESv2 error type.
func sendSESError(w http.ResponseWriter, message string, err error) {
	status := sesv2ErrorStatus(err)
	sendError(w, status, message, err)
}

func (h *ProxyHandler) registerSESRoutes(r chi.Router) {
	r.Route("/sesv2", func(r chi.Router) {
		r.Get("/email-identities", h.listEmailIdentities)
		r.Post("/email-identities", h.createEmailIdentity)
		r.Get("/email-identities/{emailIdentity}", h.getEmailIdentity)
		r.Delete("/email-identities/{emailIdentity}", h.deleteEmailIdentity)

		r.Post("/email/send", h.sendEmail)

		r.Get("/suppressed-destinations", h.listSuppressedDestinations)
		r.Get("/dedicated-ip-pools", h.listDedicatedIpPools)
		r.Get("/dedicated-ip-pools/{poolName}", h.getDedicatedIpPool)
		r.Get("/dedicated-ip-pools/{poolName}/warmup", h.getDedicatedIpWarmupAttributes)
		r.Get("/custom-verification-email-templates", h.listCustomVerificationEmailTemplates)
		r.Get("/custom-verification-email-templates/{templateName}", h.getCustomVerificationEmailTemplate)

		// Email templates (standard)
		r.Get("/email-templates", h.listEmailTemplates)
		r.Post("/email-templates", h.createEmailTemplate)
		r.Get("/email-templates/{templateName}", h.getEmailTemplate)
		r.Put("/email-templates/{templateName}", h.updateEmailTemplate)
		r.Delete("/email-templates/{templateName}", h.deleteEmailTemplate)

		// Bulk email
		r.Post("/email/bulk", h.sendBulkEmail)
	})
}

func (h *ProxyHandler) listEmailIdentities(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sesv2.ListEmailIdentitiesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().ListEmailIdentities(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to list email identities", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getEmailIdentity(w http.ResponseWriter, r *http.Request) {
	input := &sesv2.GetEmailIdentityInput{
		EmailIdentity: aws.String(urlParam(r, "emailIdentity")),
	}
	result, err := h.Svc.SESv2().GetEmailIdentity(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to get email identity", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createEmailIdentity(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sesv2.CreateEmailIdentityInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().CreateEmailIdentity(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to create email identity", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteEmailIdentity(w http.ResponseWriter, r *http.Request) {
	input := &sesv2.DeleteEmailIdentityInput{
		EmailIdentity: aws.String(urlParam(r, "emailIdentity")),
	}
	result, err := h.Svc.SESv2().DeleteEmailIdentity(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to delete email identity", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) sendEmail(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sesv2.SendEmailInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().SendEmail(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to send email", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) sendBulkEmail(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sesv2.SendBulkEmailInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().SendBulkEmail(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to send bulk email", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listEmailTemplates(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sesv2.ListEmailTemplatesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().ListEmailTemplates(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to list email templates", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getEmailTemplate(w http.ResponseWriter, r *http.Request) {
	input := &sesv2.GetEmailTemplateInput{
		TemplateName: aws.String(urlParam(r, "templateName")),
	}
	result, err := h.Svc.SESv2().GetEmailTemplate(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to get email template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createEmailTemplate(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sesv2.CreateEmailTemplateInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SESv2().CreateEmailTemplate(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to create email template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateEmailTemplate(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sesv2.UpdateEmailTemplateInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.TemplateName = aws.String(urlParam(r, "templateName"))
	result, err := h.Svc.SESv2().UpdateEmailTemplate(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to update email template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteEmailTemplate(w http.ResponseWriter, r *http.Request) {
	input := &sesv2.DeleteEmailTemplateInput{
		TemplateName: aws.String(urlParam(r, "templateName")),
	}
	result, err := h.Svc.SESv2().DeleteEmailTemplate(h.ctx, input)
	if err != nil {
		sendSESError(w, "Failed to delete email template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listSuppressedDestinations(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"suppressedDestinations": []interface{}{}})
}

func (h *ProxyHandler) listDedicatedIpPools(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"pools": []interface{}{}})
}

func (h *ProxyHandler) getDedicatedIpPool(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "getDedicatedIpPool not yet implemented"})
}

func (h *ProxyHandler) getDedicatedIpWarmupAttributes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "getDedicatedIpWarmupAttributes not yet implemented"})
}

func (h *ProxyHandler) listCustomVerificationEmailTemplates(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"templates": []interface{}{}})
}

func (h *ProxyHandler) getCustomVerificationEmailTemplate(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "getCustomVerificationEmailTemplate not yet implemented"})
}
