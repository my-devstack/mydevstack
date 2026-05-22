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
		r.Post("/domains/{domainName}/upgrade", h.upgradeDomain)
		r.Get("/domains/{domainName}/auto-tones", h.describeDomainAutoTunes)

		r.Post("/tags", h.addOpenSearchTags)
		r.Delete("/tags", h.removeOpenSearchTags)
		r.Get("/tags", h.listOpenSearchTags)

		r.Get("/compatible-versions", h.getCompatibleVersions)
		r.Get("/versions", h.listVersions)

		r.Get("/reserved-instances", h.describeReservedInstances)
		r.Get("/reserved-instance-offerings", h.describeReservedInstanceOfferings)
		r.Post("/reserved-instance-offerings/{offeringId}/purchase", h.purchaseReservedInstanceOffering)

		r.Get("/instance-type-details", h.listInstanceTypeDetails)

		r.Get("/packages", h.listPackages)
		r.Post("/packages", h.associatePackage)
		r.Delete("/packages/{packageId}", h.dissociatePackage)
		r.Get("/packages/{packageId}", h.describePackages)
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

// Stub functions for OpenSearch routes not yet implemented.

func (h *ProxyHandler) upgradeDomain(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "upgradeDomain not yet implemented"})
}

func (h *ProxyHandler) describeDomainAutoTunes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"autoTunes": []interface{}{}})
}

func (h *ProxyHandler) listVersions(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"versions": []string{}})
}

func (h *ProxyHandler) describeReservedInstances(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"reservedInstances": []interface{}{}})
}

func (h *ProxyHandler) describeReservedInstanceOfferings(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"offerings": []interface{}{}})
}

func (h *ProxyHandler) purchaseReservedInstanceOffering(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "purchaseReservedInstanceOffering not yet implemented"})
}

func (h *ProxyHandler) listInstanceTypeDetails(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"instanceTypeDetails": []interface{}{}})
}

func (h *ProxyHandler) listPackages(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"packages": []interface{}{}})
}

func (h *ProxyHandler) associatePackage(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "associatePackage not yet implemented"})
}

func (h *ProxyHandler) dissociatePackage(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "dissociatePackage not yet implemented"})
}

func (h *ProxyHandler) describePackages(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "describePackages not yet implemented"})
}
