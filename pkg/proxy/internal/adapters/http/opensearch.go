package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/opensearch"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleOpenSearch(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListDomainNames"):
		h.listDomainNames(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeDomainConfig"):
		h.describeDomainConfig(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeDomain"):
		h.describeDomain(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateDomain"):
		h.createDomain(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteDomain"):
		h.deleteDomain(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateDomainConfig"):
		h.updateDomainConfig(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ListTags"):
		h.listOpenSearchTags(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UntagResource"):
		h.removeOpenSearchTags(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "TagResource"):
		h.addOpenSearchTags(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "AddTags"):
		h.addOpenSearchTags(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "RemoveTags"):
		h.removeOpenSearchTags(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetCompatibleVersions"):
		h.getCompatibleVersions(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown OpenSearch action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listDomainNames(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.ListDomainNamesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().ListDomainNames(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list domain names", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeDomain(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.DescribeDomainInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().DescribeDomain(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe domain", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createDomain(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.CreateDomainInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().CreateDomain(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create domain", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteDomain(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.DeleteDomainInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().DeleteDomain(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete domain", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateDomainConfig(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.UpdateDomainConfigInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().UpdateDomainConfig(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update domain config", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeDomainConfig(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.DescribeDomainConfigInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().DescribeDomainConfig(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe domain config", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) listOpenSearchTags(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.ListTagsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().ListTags(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list tags", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) addOpenSearchTags(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.AddTagsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().AddTags(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to add tags", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) removeOpenSearchTags(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.RemoveTagsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().RemoveTags(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to remove tags", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getCompatibleVersions(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &opensearch.GetCompatibleVersionsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().GetCompatibleVersions(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get compatible versions", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
