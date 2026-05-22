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
		r.Get("/clusters/{clusterArn}/operations", h.listClusterOperations)
		r.Get("/clusters/{clusterArn}/operations/{operationArn}", h.describeClusterOperation)
		r.Get("/clusters/{clusterArn}/nodes", h.listNodes)
		r.Put("/clusters/{clusterArn}/broker-count", h.updateBrokerCount)
		r.Put("/clusters/{clusterArn}/broker-storage", h.updateBrokerStorage)
		r.Put("/clusters/{clusterArn}/broker-type", h.updateBrokerType)
		r.Put("/clusters/{clusterArn}/connectivity", h.updateConnectivity)
		r.Put("/clusters/{clusterArn}/monitoring", h.updateMonitoring)
		r.Put("/clusters/{clusterArn}/security", h.updateSecurity)
		r.Post("/clusters/{clusterArn}/reboot", h.rebootBroker)

		r.Get("/configurations", h.listConfigurations)
		r.Get("/configurations/{configArn}", h.describeConfiguration)

		r.Get("/replicators", h.listReplicators)
		r.Post("/replicators", h.createReplicator)
		r.Get("/replicators/{replicatorArn}", h.describeReplicator)
		r.Put("/replicators/{replicatorArn}", h.updateReplicationInfo)
		r.Delete("/replicators/{replicatorArn}", h.deleteReplicator)

		r.Get("/vpc-connections", h.listVpcConnections)
		r.Post("/vpc-connections", h.createVpcConnection)
		r.Get("/vpc-connections/{vpcArn}", h.describeVpcConnection)
		r.Delete("/vpc-connections/{vpcArn}", h.deleteVpcConnection)
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

// Stub functions for MSK routes not yet implemented.

func (h *ProxyHandler) listClusterOperations(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"clusterOperationInfoList": []interface{}{}})
}

func (h *ProxyHandler) describeClusterOperation(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "describeClusterOperation not yet implemented"})
}

func (h *ProxyHandler) listNodes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"nodeInfoList": []interface{}{}})
}

func (h *ProxyHandler) updateBrokerCount(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "updateBrokerCount not yet implemented"})
}

func (h *ProxyHandler) updateBrokerStorage(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "updateBrokerStorage not yet implemented"})
}

func (h *ProxyHandler) updateBrokerType(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "updateBrokerType not yet implemented"})
}

func (h *ProxyHandler) updateConnectivity(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "updateConnectivity not yet implemented"})
}

func (h *ProxyHandler) updateMonitoring(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "updateMonitoring not yet implemented"})
}

func (h *ProxyHandler) updateSecurity(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "updateSecurity not yet implemented"})
}

func (h *ProxyHandler) rebootBroker(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "rebootBroker not yet implemented"})
}

func (h *ProxyHandler) listConfigurations(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"configurations": []interface{}{}})
}

func (h *ProxyHandler) describeConfiguration(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "describeConfiguration not yet implemented"})
}

func (h *ProxyHandler) listReplicators(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"replicators": []interface{}{}})
}

func (h *ProxyHandler) createReplicator(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "createReplicator not yet implemented"})
}

func (h *ProxyHandler) describeReplicator(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "describeReplicator not yet implemented"})
}

func (h *ProxyHandler) updateReplicationInfo(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "updateReplicationInfo not yet implemented"})
}

func (h *ProxyHandler) deleteReplicator(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "deleteReplicator not yet implemented"})
}

func (h *ProxyHandler) listVpcConnections(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"vpcConnections": []interface{}{}})
}

func (h *ProxyHandler) createVpcConnection(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "createVpcConnection not yet implemented"})
}

func (h *ProxyHandler) describeVpcConnection(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "describeVpcConnection not yet implemented"})
}

func (h *ProxyHandler) deleteVpcConnection(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "deleteVpcConnection not yet implemented"})
}
