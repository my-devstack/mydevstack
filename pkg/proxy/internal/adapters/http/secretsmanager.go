package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleSecretsManager(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "ListSecrets"):
		h.listSecrets(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateSecret"):
		h.createSecret(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetSecretValue"):
		h.getSecretValue(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutSecretValue"):
		h.putSecretValue(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteSecret"):
		h.deleteSecret(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeSecret"):
		h.describeSecret(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateSecret"):
		h.updateSecret(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "RestoreSecret"):
		h.restoreSecret(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "RotateSecret"):
		h.rotateSecret(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRandomPassword"):
		h.getRandomPassword(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown Secrets Manager action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listSecrets(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.ListSecretsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().ListSecrets(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list secrets", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createSecret(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.CreateSecretInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().CreateSecret(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create secret", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getSecretValue(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.GetSecretValueInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().GetSecretValue(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get secret value", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putSecretValue(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.PutSecretValueInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().PutSecretValue(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put secret value", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteSecret(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.DeleteSecretInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().DeleteSecret(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete secret", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeSecret(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.DescribeSecretInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().DescribeSecret(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe secret", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateSecret(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.UpdateSecretInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().UpdateSecret(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update secret", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) restoreSecret(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.RestoreSecretInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().RestoreSecret(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to restore secret", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) rotateSecret(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.RotateSecretInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().RotateSecret(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to rotate secret", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getRandomPassword(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &secretsmanager.GetRandomPasswordInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.SecretsManager().GetRandomPassword(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get random password", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
