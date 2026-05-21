package httphandlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/kms"
)

func (h *ProxyHandler) handleKMS(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListKeys"):
		h.listKeys(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateKey"):
		h.createKey(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteAlias"):
		h.deleteAlias(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeKey"):
		h.describeKey(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "Encrypt"):
		h.encrypt(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "Decrypt"):
		h.decrypt(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GenerateDataKey"):
		h.generateDataKey(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GenerateRandom"):
		h.generateRandom(ctx, w, r, bodyBytes)
	default:
		h.genericKMS(ctx, w, r, xAmzTarget, bodyBytes)
	}
}

func (h *ProxyHandler) genericKMS(ctx context.Context, w http.ResponseWriter, r *http.Request, action string, bodyBytes []byte) {
	input := &struct{}{}
	if err := json.Unmarshal(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Action " + action + " handled"})
}

func (h *ProxyHandler) listKeys(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kms.ListKeysInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().ListKeys(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list keys", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createKey(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kms.CreateKeyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().CreateKey(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteAlias(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kms.DeleteAliasInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().DeleteAlias(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete alias", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeKey(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kms.DescribeKeyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().DescribeKey(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) encrypt(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kms.EncryptInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().Encrypt(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to encrypt: "+err.Error(), err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) decrypt(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kms.DecryptInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().Decrypt(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to decrypt: "+err.Error(), err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) generateDataKey(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kms.GenerateDataKeyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().GenerateDataKey(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate data key", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) generateRandom(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &kms.GenerateRandomInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.KMS().GenerateRandom(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate random", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
