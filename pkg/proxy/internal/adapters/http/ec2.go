package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	ec2types "github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerEC2Routes(r chi.Router) {
	r.Route("/ec2", func(r chi.Router) {
		// Instances
		r.Get("/instances", h.listInstances)
		r.Post("/instances", h.runInstance)
		r.Get("/instances/{instanceId}", h.getInstance)
		r.Delete("/instances/{instanceId}", h.terminateInstance)
		r.Post("/instances/{instanceId}/start", h.startInstance)
		r.Post("/instances/{instanceId}/stop", h.stopInstance)
		// Key Pairs
		r.Get("/key-pairs", h.listKeyPairs)
		r.Post("/key-pairs", h.createKeyPair)
		r.Post("/key-pairs/import", h.importKeyPair)
		r.Delete("/key-pairs/{keyName}", h.deleteKeyPair)
		// Security Groups
		r.Get("/security-groups", h.listSecurityGroups)
		r.Post("/security-groups", h.createSecurityGroup)
		r.Delete("/security-groups/{groupId}", h.deleteSecurityGroup)
		r.Post("/security-groups/{groupId}/ingress", h.authorizeIngress)
		// VPCs / Subnets
		r.Get("/vpcs", h.listVpcs)
		r.Get("/subnets", h.listSubnets)
	})
}

// ---------------------------------------------------------------------------
// Instances
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listInstances(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeInstancesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.EC2().DescribeInstances(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list instances", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) runInstance(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.RunInstancesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.EC2().RunInstances(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to run instance", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getInstance(w http.ResponseWriter, r *http.Request) {
	instanceID := urlParam(r, "instanceId")
	input := &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	}
	result, err := h.Svc.EC2().DescribeInstances(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get instance", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) terminateInstance(w http.ResponseWriter, r *http.Request) {
	instanceID := urlParam(r, "instanceId")
	input := &ec2.TerminateInstancesInput{
		InstanceIds: []string{instanceID},
	}
	result, err := h.Svc.EC2().TerminateInstances(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to terminate instance", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) startInstance(w http.ResponseWriter, r *http.Request) {
	instanceID := urlParam(r, "instanceId")
	input := &ec2.StartInstancesInput{
		InstanceIds: []string{instanceID},
	}
	result, err := h.Svc.EC2().StartInstances(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to start instance", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) stopInstance(w http.ResponseWriter, r *http.Request) {
	instanceID := urlParam(r, "instanceId")
	input := &ec2.StopInstancesInput{
		InstanceIds: []string{instanceID},
	}
	result, err := h.Svc.EC2().StopInstances(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to stop instance", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Key Pairs
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listKeyPairs(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeKeyPairsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.EC2().DescribeKeyPairs(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list key pairs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createKeyPair(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.CreateKeyPairInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.EC2().CreateKeyPair(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create key pair", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) importKeyPair(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.ImportKeyPairInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.EC2().ImportKeyPair(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to import key pair", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteKeyPair(w http.ResponseWriter, r *http.Request) {
	keyName := urlParam(r, "keyName")
	input := &ec2.DeleteKeyPairInput{
		KeyName: aws.String(keyName),
	}
	result, err := h.Svc.EC2().DeleteKeyPair(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete key pair", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Security Groups
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listSecurityGroups(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeSecurityGroupsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.EC2().DescribeSecurityGroups(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list security groups", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createSecurityGroup(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.CreateSecurityGroupInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.EC2().CreateSecurityGroup(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create security group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteSecurityGroup(w http.ResponseWriter, r *http.Request) {
	groupID := urlParam(r, "groupId")
	input := &ec2.DeleteSecurityGroupInput{
		GroupId: aws.String(groupID),
	}
	result, err := h.Svc.EC2().DeleteSecurityGroup(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete security group", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) authorizeIngress(w http.ResponseWriter, r *http.Request) {
	groupID := urlParam(r, "groupId")
	bodyBytes := readBody(r)
	var body struct {
		IpPermissions []ec2types.IpPermission `json:"IpPermissions"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ec2.AuthorizeSecurityGroupIngressInput{
		GroupId:       aws.String(groupID),
		IpPermissions: body.IpPermissions,
	}
	result, err := h.Svc.EC2().AuthorizeSecurityGroupIngress(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to authorize ingress", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// VPCs / Subnets
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listVpcs(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeVpcsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.EC2().DescribeVpcs(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list VPCs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listSubnets(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeSubnetsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.EC2().DescribeSubnets(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list subnets", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
