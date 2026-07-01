package httphandlers

import (
	"log"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerVpcRoutes(r chi.Router) {
	r.Route("/vpc", func(r chi.Router) {
		// VPCs
		r.Get("/vpcs", h.listVpcs)
		r.Post("/vpcs", h.createVpc)
		r.Delete("/vpcs/{vpcId}", h.deleteVpc)
		// Subnets
		r.Get("/subnets", h.listSubnets)
		r.Post("/subnets", h.createSubnet)
		r.Delete("/subnets/{subnetId}", h.deleteSubnet)
		// Route Tables
		r.Get("/route-tables", h.listRouteTables)
		r.Post("/route-tables", h.createRouteTable)
		r.Delete("/route-tables/{rtbId}", h.deleteRouteTable)
		r.Post("/route-tables/{rtbId}/routes", h.createVpcRoute)
		r.Delete("/route-tables/{rtbId}/routes/{cidr}", h.deleteVpcRoute)
		r.Post("/route-tables/{rtbId}/associate", h.associateRouteTable)
		r.Post("/route-tables/{rtbId}/disassociate", h.disassociateRouteTable)
		// Internet Gateways
		r.Get("/internet-gateways", h.listInternetGateways)
		r.Post("/internet-gateways", h.createInternetGateway)
		r.Delete("/internet-gateways/{igwId}", h.deleteInternetGateway)
		r.Post("/internet-gateways/{igwId}/attach", h.attachInternetGateway)
		r.Post("/internet-gateways/{igwId}/detach", h.detachInternetGateway)
		// NAT Gateways
		r.Get("/nat-gateways", h.listNatGateways)
		r.Post("/nat-gateways", h.createNatGateway)
		r.Delete("/nat-gateways/{natGwId}", h.deleteNatGateway)
		// Network ACLs
		r.Get("/network-acls", h.listNetworkAcls)
		r.Post("/network-acls", h.createNetworkAcl)
		r.Delete("/network-acls/{naclId}", h.deleteNetworkAcl)
		r.Post("/network-acls/{naclId}/entries", h.createNetworkAclEntry)
		r.Delete("/network-acls/{naclId}/entries/{ruleNumber}", h.deleteNetworkAclEntry)
		// VPC Flow Logs
		r.Get("/flow-logs", h.listFlowLogs)
		r.Post("/flow-logs", h.createFlowLogs)
		r.Delete("/flow-logs/{flowLogId}", h.deleteFlowLogs)
		// Elastic IPs
		r.Get("/elastic-ips", h.listElasticIps)
		r.Post("/elastic-ips", h.allocateElasticIp)
		r.Delete("/elastic-ips/{allocationId}", h.releaseElasticIp)
	})
}

// ---------------------------------------------------------------------------
// VPCs
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listVpcs(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeVpcsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().DescribeVpcs(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list VPCs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createVpc(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.CreateVpcInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().CreateVpc(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create VPC", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteVpc(w http.ResponseWriter, r *http.Request) {
	vpcID := urlParam(r, "vpcId")
	input := &ec2.DeleteVpcInput{
		VpcId: aws.String(vpcID),
	}
	result, err := h.Svc.Vpc().DeleteVpc(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete VPC", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Subnets
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listSubnets(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeSubnetsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().DescribeSubnets(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list subnets", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createSubnet(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.CreateSubnetInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().CreateSubnet(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create subnet", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteSubnet(w http.ResponseWriter, r *http.Request) {
	subnetID := urlParam(r, "subnetId")
	input := &ec2.DeleteSubnetInput{
		SubnetId: aws.String(subnetID),
	}
	result, err := h.Svc.Vpc().DeleteSubnet(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete subnet", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Route Tables
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listRouteTables(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeRouteTablesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().DescribeRouteTables(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list route tables", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createRouteTable(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.CreateRouteTableInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().CreateRouteTable(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create route table", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteRouteTable(w http.ResponseWriter, r *http.Request) {
	rtbID := urlParam(r, "rtbId")
	input := &ec2.DeleteRouteTableInput{
		RouteTableId: aws.String(rtbID),
	}
	result, err := h.Svc.Vpc().DeleteRouteTable(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete route table", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createVpcRoute(w http.ResponseWriter, r *http.Request) {
	rtbID := urlParam(r, "rtbId")
	bodyBytes := readBody(r)
	var body struct {
		DestinationCidrBlock    *string `json:"DestinationCidrBlock"`
		GatewayId               *string `json:"GatewayId"`
		NatGatewayId            *string `json:"NatGatewayId"`
		NetworkInterfaceId      *string `json:"NetworkInterfaceId"`
		VpcPeeringConnectionId  *string `json:"VpcPeeringConnectionId"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ec2.CreateRouteInput{
		RouteTableId:            aws.String(rtbID),
		DestinationCidrBlock:    body.DestinationCidrBlock,
		GatewayId:               body.GatewayId,
		NatGatewayId:            body.NatGatewayId,
		NetworkInterfaceId:      body.NetworkInterfaceId,
		VpcPeeringConnectionId:  body.VpcPeeringConnectionId,
	}
	result, err := h.Svc.Vpc().CreateRoute(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create route", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteVpcRoute(w http.ResponseWriter, r *http.Request) {
	rtbID := urlParam(r, "rtbId")
	cidr := urlParam(r, "cidr")
	input := &ec2.DeleteRouteInput{
		RouteTableId:         aws.String(rtbID),
		DestinationCidrBlock: aws.String(cidr),
	}
	result, err := h.Svc.Vpc().DeleteRoute(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete route", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) associateRouteTable(w http.ResponseWriter, r *http.Request) {
	rtbID := urlParam(r, "rtbId")
	bodyBytes := readBody(r)
	var body struct {
		SubnetId *string `json:"SubnetId"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ec2.AssociateRouteTableInput{
		RouteTableId: aws.String(rtbID),
		SubnetId:     body.SubnetId,
	}
	result, err := h.Svc.Vpc().AssociateRouteTable(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to associate route table", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) disassociateRouteTable(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		AssociationId *string `json:"AssociationId"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ec2.DisassociateRouteTableInput{
		AssociationId: body.AssociationId,
	}
	result, err := h.Svc.Vpc().DisassociateRouteTable(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to disassociate route table", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Internet Gateways
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listInternetGateways(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeInternetGatewaysInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().DescribeInternetGateways(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list internet gateways", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createInternetGateway(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.CreateInternetGatewayInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().CreateInternetGateway(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create internet gateway", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteInternetGateway(w http.ResponseWriter, r *http.Request) {
	igwID := urlParam(r, "igwId")
	input := &ec2.DeleteInternetGatewayInput{
		InternetGatewayId: aws.String(igwID),
	}
	result, err := h.Svc.Vpc().DeleteInternetGateway(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete internet gateway", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) attachInternetGateway(w http.ResponseWriter, r *http.Request) {
	igwID := urlParam(r, "igwId")
	bodyBytes := readBody(r)
	var body struct {
		VpcId *string `json:"VpcId"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ec2.AttachInternetGatewayInput{
		InternetGatewayId: aws.String(igwID),
		VpcId:             body.VpcId,
	}
	result, err := h.Svc.Vpc().AttachInternetGateway(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to attach internet gateway", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) detachInternetGateway(w http.ResponseWriter, r *http.Request) {
	igwID := urlParam(r, "igwId")
	bodyBytes := readBody(r)
	var body struct {
		VpcId *string `json:"VpcId"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ec2.DetachInternetGatewayInput{
		InternetGatewayId: aws.String(igwID),
		VpcId:             body.VpcId,
	}
	result, err := h.Svc.Vpc().DetachInternetGateway(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to detach internet gateway", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// NAT Gateways
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listNatGateways(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeNatGatewaysInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().DescribeNatGateways(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list NAT gateways", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createNatGateway(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.CreateNatGatewayInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().CreateNatGateway(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create NAT gateway", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteNatGateway(w http.ResponseWriter, r *http.Request) {
	natGwID := urlParam(r, "natGwId")
	input := &ec2.DeleteNatGatewayInput{
		NatGatewayId: aws.String(natGwID),
	}
	result, err := h.Svc.Vpc().DeleteNatGateway(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete NAT gateway", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Network ACLs
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listNetworkAcls(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeNetworkAclsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().DescribeNetworkAcls(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list network ACLs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createNetworkAcl(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.CreateNetworkAclInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().CreateNetworkAcl(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create network ACL", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteNetworkAcl(w http.ResponseWriter, r *http.Request) {
	naclID := urlParam(r, "naclId")
	input := &ec2.DeleteNetworkAclInput{
		NetworkAclId: aws.String(naclID),
	}
	result, err := h.Svc.Vpc().DeleteNetworkAcl(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete network ACL", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createNetworkAclEntry(w http.ResponseWriter, r *http.Request) {
	naclID := urlParam(r, "naclId")
	bodyBytes := readBody(r)
	var body ec2.CreateNetworkAclEntryInput
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	body.NetworkAclId = aws.String(naclID)
	result, err := h.Svc.Vpc().CreateNetworkAclEntry(h.ctx, &body)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create network ACL entry", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteNetworkAclEntry(w http.ResponseWriter, r *http.Request) {
	naclID := urlParam(r, "naclId")
	ruleNumber := urlParam(r, "ruleNumber")
	input := &ec2.DeleteNetworkAclEntryInput{
		NetworkAclId: aws.String(naclID),
		RuleNumber:   aws.Int32(parseInt32(ruleNumber)),
		Egress:       aws.Bool(false),
	}
	result, err := h.Svc.Vpc().DeleteNetworkAclEntry(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete network ACL entry", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// VPC Flow Logs
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listFlowLogs(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeFlowLogsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().DescribeFlowLogs(h.ctx, input)
	if err != nil {
		if isUnsupportedError(err) {
			log.Printf("Flow Logs not supported by emulator: %v", err)
			writeJSON(w, http.StatusOK, map[string]interface{}{"FlowLogs": []interface{}{}, "Unsupported": true})
			return
		}
		sendError(w, http.StatusInternalServerError, "Failed to list flow logs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createFlowLogs(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.CreateFlowLogsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().CreateFlowLogs(h.ctx, input)
	if err != nil {
		if isUnsupportedError(err) {
			log.Printf("Flow Logs not supported by emulator: %v", err)
			writeJSON(w, http.StatusOK, map[string]interface{}{"Unsupported": true})
			return
		}
		sendError(w, http.StatusInternalServerError, "Failed to create flow logs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteFlowLogs(w http.ResponseWriter, r *http.Request) {
	flowLogID := urlParam(r, "flowLogId")
	input := &ec2.DeleteFlowLogsInput{
		FlowLogIds: []string{flowLogID},
	}
	result, err := h.Svc.Vpc().DeleteFlowLogs(h.ctx, input)
	if err != nil {
		if isUnsupportedError(err) {
			log.Printf("Flow Logs not supported by emulator: %v", err)
			writeJSON(w, http.StatusOK, map[string]interface{}{"Unsupported": true})
			return
		}
		sendError(w, http.StatusInternalServerError, "Failed to delete flow logs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Elastic IPs
// ---------------------------------------------------------------------------

func (h *ProxyHandler) listElasticIps(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.DescribeAddressesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().DescribeAddresses(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list Elastic IPs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) allocateElasticIp(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ec2.AllocateAddressInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Vpc().AllocateAddress(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to allocate Elastic IP", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) releaseElasticIp(w http.ResponseWriter, r *http.Request) {
	allocationID := urlParam(r, "allocationId")
	input := &ec2.ReleaseAddressInput{
		AllocationId: aws.String(allocationID),
	}
	result, err := h.Svc.Vpc().ReleaseAddress(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to release Elastic IP", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// parseInt32 helper
// ---------------------------------------------------------------------------

func parseInt32(s string) int32 {
	var i int32
	for _, c := range s {
		if c >= '0' && c <= '9' {
			i = i*10 + (int32(c) - '0')
		} else {
			break
		}
	}
	return i
}
