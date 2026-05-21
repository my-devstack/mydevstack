package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

func (h *ProxyHandler) handleSecretsManager(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListSecrets"):
		h.listSecrets(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateSecret"):
		h.createSecret(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetSecretValue"):
		h.getSecretValue(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutSecretValue"):
		h.putSecretValue(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteSecret"):
		h.deleteSecret(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeSecret"):
		h.describeSecret(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateSecret"):
		h.updateSecret(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "RestoreSecret"):
		h.restoreSecret(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "RotateSecret"):
		h.rotateSecret(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRandomPassword"):
		h.getRandomPassword(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown Secrets Manager action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listSecrets(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.ListSecretsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().ListSecrets(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list secrets", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createSecret(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.CreateSecretInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().CreateSecret(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getSecretValue(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.GetSecretValueInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().GetSecretValue(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get secret value", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putSecretValue(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.PutSecretValueInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().PutSecretValue(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put secret value", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteSecret(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.DeleteSecretInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().DeleteSecret(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeSecret(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.DescribeSecretInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().DescribeSecret(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateSecret(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.UpdateSecretInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().UpdateSecret(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) restoreSecret(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.RestoreSecretInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().RestoreSecret(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to restore secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) rotateSecret(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.RotateSecretInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().RotateSecret(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to rotate secret", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRandomPassword(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &secretsmanager.GetRandomPasswordInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SecretsManager().GetRandomPassword(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get random password", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
