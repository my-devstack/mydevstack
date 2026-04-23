package httphandlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/kms"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleKMS(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "ListKeys"):
		h.listKeys(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateKey"):
		h.createKey(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteAlias"):
		h.deleteAlias(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeKey"):
		h.describeKey(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "Encrypt"):
		h.encrypt(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "Decrypt"):
		h.decrypt(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GenerateDataKey"):
		h.generateDataKey(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GenerateRandom"):
		h.generateRandom(ctx, c, bodyBytes)
	default:
		h.genericKMS(ctx, c, xAmzTarget, bodyBytes)
	}
}

func (h *ProxyHandler) genericKMS(ctx context.Context, c *gin.Context, action string, bodyBytes []byte) {
	input := &struct{}{}
	if err := json.Unmarshal(bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Action " + action + " handled"})
}

func (h *ProxyHandler) listKeys(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kms.ListKeysInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.KMS().ListKeys(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list keys", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createKey(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kms.CreateKeyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.KMS().CreateKey(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create key", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteAlias(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kms.DeleteAliasInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.KMS().DeleteAlias(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete alias", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeKey(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kms.DescribeKeyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.KMS().DescribeKey(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe key", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) encrypt(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kms.EncryptInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.KMS().Encrypt(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to encrypt: "+err.Error(), err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) decrypt(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kms.DecryptInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.KMS().Decrypt(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to decrypt: "+err.Error(), err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) generateDataKey(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kms.GenerateDataKeyInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.KMS().GenerateDataKey(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to generate data key", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) generateRandom(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &kms.GenerateRandomInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.KMS().GenerateRandom(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to generate random", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
