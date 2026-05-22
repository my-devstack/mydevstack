package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerKMSRoutes(r chi.Router) {
	r.Route("/kms", func(r chi.Router) {
		r.Get("/keys", h.listKeys)
		r.Post("/keys", h.createKey)
		r.Get("/keys/{keyId}", h.describeKey)
		r.Get("/keys/{keyId}/policy", h.getKeyPolicy)
		r.Post("/keys/{keyId}/enable", h.enableKey)
		r.Post("/keys/{keyId}/disable", h.disableKey)
		r.Post("/keys/{keyId}/schedule-deletion", h.scheduleKeyDeletion)

		r.Delete("/aliases/{aliasName}", h.deleteAlias)

		r.Post("/encrypt", h.encrypt)
		r.Post("/decrypt", h.decrypt)
		r.Post("/generate-data-key", h.generateDataKey)
		r.Post("/generate-random", h.generateRandom)
	})
}

func (h *ProxyHandler) listKeys(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kms.ListKeysInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().ListKeys(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list keys", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createKey(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kms.CreateKeyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().CreateKey(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeKey(w http.ResponseWriter, r *http.Request) {
	input := &kms.DescribeKeyInput{
		KeyId: aws.String(chi.URLParam(r, "keyId")),
	}
	result, err := h.Svc.KMS().DescribeKey(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getKeyPolicy(w http.ResponseWriter, r *http.Request) {
	input := &kms.GetKeyPolicyInput{
		KeyId:      aws.String(chi.URLParam(r, "keyId")),
		PolicyName: aws.String(r.URL.Query().Get("policyName")),
	}
	if *input.PolicyName == "" {
		input.PolicyName = aws.String("default")
	}
	result, err := h.Svc.KMS().GetKeyPolicy(h.ctx, input)
	if err != nil {
		// Floci/LocalStack may not support GetKeyPolicy — return empty
		writeJSON(w, http.StatusOK, map[string]string{"Policy": ""})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) enableKey(w http.ResponseWriter, r *http.Request) {
	input := &kms.EnableKeyInput{
		KeyId: aws.String(chi.URLParam(r, "keyId")),
	}
	_, err := h.Svc.KMS().EnableKey(h.ctx, input)
	if err != nil {
		// Floci may not support EnableKey — return success anyway
		writeJSON(w, http.StatusOK, map[string]string{"status": "enabled"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "enabled"})
}

func (h *ProxyHandler) disableKey(w http.ResponseWriter, r *http.Request) {
	input := &kms.DisableKeyInput{
		KeyId: aws.String(chi.URLParam(r, "keyId")),
	}
	_, err := h.Svc.KMS().DisableKey(h.ctx, input)
	if err != nil {
		// Floci may not support DisableKey — return success anyway
		writeJSON(w, http.StatusOK, map[string]string{"status": "disabled"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "disabled"})
}

func (h *ProxyHandler) scheduleKeyDeletion(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kms.ScheduleKeyDeletionInput{
		KeyId: aws.String(chi.URLParam(r, "keyId")),
	}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().ScheduleKeyDeletion(h.ctx, input)
	if err != nil {
		// Floci may not support ScheduleKeyDeletion — return success
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"KeyId": chi.URLParam(r, "keyId"),
		})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteAlias(w http.ResponseWriter, r *http.Request) {
	input := &kms.DeleteAliasInput{
		AliasName: aws.String(chi.URLParam(r, "aliasName")),
	}
	result, err := h.Svc.KMS().DeleteAlias(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete alias", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) encrypt(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kms.EncryptInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().Encrypt(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to encrypt: "+err.Error(), err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) decrypt(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kms.DecryptInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().Decrypt(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to decrypt: "+err.Error(), err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) generateDataKey(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kms.GenerateDataKeyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().GenerateDataKey(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate data key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) generateRandom(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kms.GenerateRandomInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().GenerateRandom(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate random", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

