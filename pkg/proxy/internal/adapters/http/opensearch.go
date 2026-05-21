package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/opensearch"
)

func (h *ProxyHandler) handleOpenSearch(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListDomainNames"):
		h.listDomainNames(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeDomainConfig"):
		h.describeDomainConfig(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeDomain"):
		h.describeDomain(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateDomain"):
		h.createDomain(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteDomain"):
		h.deleteDomain(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateDomainConfig"):
		h.updateDomainConfig(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListTags"):
		h.listOpenSearchTags(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UntagResource"):
		h.removeOpenSearchTags(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "TagResource"):
		h.addOpenSearchTags(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "AddTags"):
		h.addOpenSearchTags(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "RemoveTags"):
		h.removeOpenSearchTags(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetCompatibleVersions"):
		h.getCompatibleVersions(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown OpenSearch action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listDomainNames(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.ListDomainNamesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().ListDomainNames(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list domain names", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeDomain(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.DescribeDomainInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().DescribeDomain(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe domain", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createDomain(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.CreateDomainInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().CreateDomain(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create domain", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteDomain(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.DeleteDomainInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().DeleteDomain(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete domain", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateDomainConfig(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.UpdateDomainConfigInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().UpdateDomainConfig(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update domain config", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeDomainConfig(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.DescribeDomainConfigInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().DescribeDomainConfig(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe domain config", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listOpenSearchTags(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.ListTagsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().ListTags(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list tags", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) addOpenSearchTags(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.AddTagsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().AddTags(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to add tags", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) removeOpenSearchTags(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.RemoveTagsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().RemoveTags(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to remove tags", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getCompatibleVersions(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &opensearch.GetCompatibleVersionsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().GetCompatibleVersions(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get compatible versions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
