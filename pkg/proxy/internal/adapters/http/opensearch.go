package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/opensearch"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerOpenSearchRoutes(r chi.Router) {
	r.Route("/opensearch", func(r chi.Router) {
		r.Get("/domains", h.listDomainNames)
		r.Post("/domains", h.createDomain)
		r.Get("/domains/{domainName}", h.describeDomain)
		r.Put("/domains/{domainName}/config", h.updateDomainConfig)
		r.Get("/domains/{domainName}/config", h.describeDomainConfig)
		r.Delete("/domains/{domainName}", h.deleteDomain)
		r.Post("/tags", h.addOpenSearchTags)
		r.Delete("/tags", h.removeOpenSearchTags)
		r.Get("/tags", h.listOpenSearchTags)

		r.Get("/compatible-versions", h.getCompatibleVersions)

	})
}

func (h *ProxyHandler) listDomainNames(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &opensearch.ListDomainNamesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().ListDomainNames(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list domain names", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeDomain(w http.ResponseWriter, r *http.Request) {
	input := &opensearch.DescribeDomainInput{
		DomainName: aws.String(chi.URLParam(r, "domainName")),
	}
	result, err := h.Svc.OpenSearch().DescribeDomain(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe domain", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createDomain(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &opensearch.CreateDomainInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().CreateDomain(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create domain", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteDomain(w http.ResponseWriter, r *http.Request) {
	input := &opensearch.DeleteDomainInput{
		DomainName: aws.String(chi.URLParam(r, "domainName")),
	}
	result, err := h.Svc.OpenSearch().DeleteDomain(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete domain", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateDomainConfig(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &opensearch.UpdateDomainConfigInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.DomainName = aws.String(chi.URLParam(r, "domainName"))
	result, err := h.Svc.OpenSearch().UpdateDomainConfig(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update domain config", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeDomainConfig(w http.ResponseWriter, r *http.Request) {
	input := &opensearch.DescribeDomainConfigInput{
		DomainName: aws.String(chi.URLParam(r, "domainName")),
	}
	result, err := h.Svc.OpenSearch().DescribeDomainConfig(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe domain config", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listOpenSearchTags(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &opensearch.ListTagsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().ListTags(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list tags", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) addOpenSearchTags(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &opensearch.AddTagsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().AddTags(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to add tags", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) removeOpenSearchTags(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &opensearch.RemoveTagsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().RemoveTags(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to remove tags", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getCompatibleVersions(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &opensearch.GetCompatibleVersionsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.OpenSearch().GetCompatibleVersions(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get compatible versions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}


