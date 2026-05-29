package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/kafka"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerMSKRoutes(r chi.Router) {
	r.Route("/msk", func(r chi.Router) {
		r.Get("/clusters", h.listClustersV2)
		r.Post("/clusters", h.createClusterV2)
		r.Get("/clusters/{clusterArn}/bootstrap-brokers", h.getBootstrapBrokers)
		r.Get("/clusters/{clusterArn}", h.describeClusterV2)
		r.Delete("/clusters/{clusterArn}", h.deleteCluster)

	})
}

func (h *ProxyHandler) listClustersV2(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kafka.ListClustersV2Input{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.MSK().ListClustersV2(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list clusters", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeClusterV2(w http.ResponseWriter, r *http.Request) {
	input := &kafka.DescribeClusterV2Input{
		ClusterArn: aws.String(urlParam(r, "clusterArn")),
	}
	result, err := h.Svc.MSK().DescribeClusterV2(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe cluster", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createClusterV2(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &kafka.CreateClusterV2Input{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.MSK().CreateClusterV2(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create cluster", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteCluster(w http.ResponseWriter, r *http.Request) {
	input := &kafka.DeleteClusterInput{
		ClusterArn: aws.String(urlParam(r, "clusterArn")),
	}
	result, err := h.Svc.MSK().DeleteCluster(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete cluster", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBootstrapBrokers(w http.ResponseWriter, r *http.Request) {
	input := &kafka.GetBootstrapBrokersInput{
		ClusterArn: aws.String(urlParam(r, "clusterArn")),
	}
	result, err := h.Svc.MSK().GetBootstrapBrokers(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to get bootstrap brokers", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}


