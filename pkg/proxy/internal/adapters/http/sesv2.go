package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerSESRoutes(r chi.Router) {
	r.Route("/sesv2", func(r chi.Router) {
		r.Get("/email-identities", h.listEmailIdentities)
		r.Post("/email-identities", h.createEmailIdentity)
		r.Get("/email-identities/{emailIdentity}", h.getEmailIdentity)
		r.Delete("/email-identities/{emailIdentity}", h.deleteEmailIdentity)

		r.Post("/email/send", h.sendEmail)

		r.Get("/suppressed-destinations/{email}", h.getSuppressedDestination)
		r.Get("/suppressed-destinations", h.listSuppressedDestinations)
		r.Put("/suppressed-destinations/{email}", h.putSuppressedDestination)
		r.Delete("/suppressed-destinations/{email}", h.deleteSuppressedDestination)

		r.Get("/dedicated-ips", h.getDedicatedIps)
		r.Get("/dedicated-ips/{ip}", h.getDedicatedIp)
		r.Post("/dedicated-ip-pools", h.createDedicatedIpPool)
		r.Get("/dedicated-ip-pools", h.listDedicatedIpPools)
		r.Get("/dedicated-ip-pools/{poolName}", h.getDedicatedIpPool)
		r.Delete("/dedicated-ip-pools/{poolName}", h.deleteDedicatedIpPool)
		r.Put("/dedicated-ip-pools/{poolName}/warmup", h.putDedicatedIpWarmupAttributes)
		r.Get("/dedicated-ip-pools/{poolName}/warmup", h.getDedicatedIpWarmupAttributes)

		r.Get("/account", h.getAccount)
		r.Post("/deliverability-test", h.createDeliverabilityTestReport)
		r.Get("/recommendations", h.listRecommendations)

		r.Post("/custom-verification-email-templates", h.createCustomVerificationEmailTemplate)
		r.Get("/custom-verification-email-templates", h.listCustomVerificationEmailTemplates)
		r.Get("/custom-verification-email-templates/{templateName}", h.getCustomVerificationEmailTemplate)
		r.Put("/custom-verification-email-templates/{templateName}", h.updateCustomVerificationEmailTemplate)
		r.Delete("/custom-verification-email-templates/{templateName}", h.deleteCustomVerificationEmailTemplate)
		r.Post("/custom-verification-email-templates/{templateName}/test", h.testRenderEmailTemplate)

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
		sendError(w, http.StatusInternalServerError, "Failed to list email identities", err)
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
		sendErrorWithStatus(w, "Failed to get email identity", err)
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
		sendError(w, http.StatusInternalServerError, "Failed to create email identity", err)
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
		sendErrorWithStatus(w, "Failed to delete email identity", err)
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
		sendError(w, http.StatusInternalServerError, "Failed to send email", err)
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
		sendError(w, http.StatusInternalServerError, "Failed to send bulk email", err)
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
		sendError(w, http.StatusInternalServerError, "Failed to list email templates", err)
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
		sendErrorWithStatus(w, "Failed to get email template", err)
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
		sendError(w, http.StatusInternalServerError, "Failed to create email template", err)
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
		sendError(w, http.StatusInternalServerError, "Failed to update email template", err)
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
		sendErrorWithStatus(w, "Failed to delete email template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getAccount(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "getAccount not yet implemented"})
}

func (h *ProxyHandler) getSuppressedDestination(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "getSuppressedDestination not yet implemented"})
}

func (h *ProxyHandler) listSuppressedDestinations(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"suppressedDestinations": []interface{}{}})
}

func (h *ProxyHandler) putSuppressedDestination(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "putSuppressedDestination not yet implemented"})
}

func (h *ProxyHandler) deleteSuppressedDestination(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "deleteSuppressedDestination not yet implemented"})
}

func (h *ProxyHandler) getDedicatedIps(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"ips": []interface{}{}})
}

func (h *ProxyHandler) getDedicatedIp(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "getDedicatedIp not yet implemented"})
}

func (h *ProxyHandler) createDedicatedIpPool(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "createDedicatedIpPool not yet implemented"})
}

func (h *ProxyHandler) listDedicatedIpPools(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"pools": []interface{}{}})
}

func (h *ProxyHandler) getDedicatedIpPool(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "getDedicatedIpPool not yet implemented"})
}

func (h *ProxyHandler) deleteDedicatedIpPool(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "deleteDedicatedIpPool not yet implemented"})
}

func (h *ProxyHandler) putDedicatedIpWarmupAttributes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "putDedicatedIpWarmupAttributes not yet implemented"})
}

func (h *ProxyHandler) getDedicatedIpWarmupAttributes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "getDedicatedIpWarmupAttributes not yet implemented"})
}

func (h *ProxyHandler) createDeliverabilityTestReport(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "createDeliverabilityTestReport not yet implemented"})
}

func (h *ProxyHandler) listRecommendations(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"recommendations": []interface{}{}})
}

func (h *ProxyHandler) createCustomVerificationEmailTemplate(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "createCustomVerificationEmailTemplate not yet implemented"})
}

func (h *ProxyHandler) listCustomVerificationEmailTemplates(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"templates": []interface{}{}})
}

func (h *ProxyHandler) getCustomVerificationEmailTemplate(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "getCustomVerificationEmailTemplate not yet implemented"})
}

func (h *ProxyHandler) updateCustomVerificationEmailTemplate(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "updateCustomVerificationEmailTemplate not yet implemented"})
}

func (h *ProxyHandler) deleteCustomVerificationEmailTemplate(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "deleteCustomVerificationEmailTemplate not yet implemented"})
}

func (h *ProxyHandler) testRenderEmailTemplate(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "testRenderEmailTemplate not yet implemented"})
}
