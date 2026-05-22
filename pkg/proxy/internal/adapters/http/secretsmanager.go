package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerSecretsManagerRoutes(r chi.Router) {
	r.Route("/secrets-manager", func(r chi.Router) {
		r.Get("/secrets", h.listSecrets)
		r.Post("/secrets", h.createSecret)
		r.Get("/secrets/{secretId}", h.describeSecret)
		r.Put("/secrets/{secretId}", h.updateSecret)
		r.Delete("/secrets/{secretId}", h.deleteSecret)
		r.Post("/secrets/{secretId}/restore", h.restoreSecret)
		r.Post("/secrets/{secretId}/rotate", h.rotateSecret)
		r.Put("/secrets/{secretId}/value", h.putSecretValue)
		r.Get("/secrets/{secretId}/value", h.getSecretValue)
		r.Post("/random-password", h.getRandomPassword)
	})
}

func (h *ProxyHandler) listSecrets(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &secretsmanager.ListSecretsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().ListSecrets(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list secrets", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createSecret(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &secretsmanager.CreateSecretInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().CreateSecret(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getSecretValue(w http.ResponseWriter, r *http.Request) {
	input := &secretsmanager.GetSecretValueInput{
		SecretId: aws.String(urlParam(r, "secretId")),
	}
	result, err := h.Svc.SecretsManager().GetSecretValue(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get secret value", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putSecretValue(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &secretsmanager.PutSecretValueInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.SecretId = aws.String(urlParam(r, "secretId"))
	result, err := h.Svc.SecretsManager().PutSecretValue(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put secret value", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteSecret(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		RecoveryWindowInDays        int64 `json:"RecoveryWindowInDays"`
		ForceDeleteWithoutRecovery bool   `json:"ForceDeleteWithoutRecovery"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &secretsmanager.DeleteSecretInput{
		SecretId: aws.String(urlParam(r, "secretId")),
	}
	if body.RecoveryWindowInDays > 0 {
		input.RecoveryWindowInDays = aws.Int64(body.RecoveryWindowInDays)
	}
	input.ForceDeleteWithoutRecovery = aws.Bool(body.ForceDeleteWithoutRecovery)
	result, err := h.Svc.SecretsManager().DeleteSecret(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeSecret(w http.ResponseWriter, r *http.Request) {
	input := &secretsmanager.DescribeSecretInput{
		SecretId: aws.String(urlParam(r, "secretId")),
	}
	result, err := h.Svc.SecretsManager().DescribeSecret(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateSecret(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &secretsmanager.UpdateSecretInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.SecretId = aws.String(urlParam(r, "secretId"))
	result, err := h.Svc.SecretsManager().UpdateSecret(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) restoreSecret(w http.ResponseWriter, r *http.Request) {
	input := &secretsmanager.RestoreSecretInput{
		SecretId: aws.String(urlParam(r, "secretId")),
	}
	result, err := h.Svc.SecretsManager().RestoreSecret(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to restore secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) rotateSecret(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &secretsmanager.RotateSecretInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.SecretId = aws.String(urlParam(r, "secretId"))
	result, err := h.Svc.SecretsManager().RotateSecret(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to rotate secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRandomPassword(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &secretsmanager.GetRandomPasswordInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().GetRandomPassword(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get random password", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
