package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"testing"

	"github.com/aws/smithy-go"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// mockUnsupportedError implements smithy.APIError for testing UnsupportedOperation handling.
type mockUnsupportedError struct{}

func (e *mockUnsupportedError) ErrorCode() string          { return "UnsupportedOperation" }
func (e *mockUnsupportedError) ErrorMessage() string       { return "Operation is not supported" }
func (e *mockUnsupportedError) ErrorFault() smithy.ErrorFault { return 0 }
func (e *mockUnsupportedError) Error() string              { return "UnsupportedOperation: Operation is not supported" }

func setupVpcTest(t *testing.T) (*mockports.ProxyService, *mockports.VpcPort, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	mp := mockports.NewVpcPort(t)
	svc.EXPECT().Vpc().Return(mp).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, mp, handler
}

// ---------------------------------------------------------------------------
// VPCs
// ---------------------------------------------------------------------------

func TestVpc_ListVpcs_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeVpcs(mock.Anything, mock.Anything).Return(&ec2.DescribeVpcsOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/vpcs", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_ListVpcs_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeVpcs(mock.Anything, mock.Anything).Return(nil, errors.New("list vpcs error"))

	w := performEC2Request(handler, "GET", "/ec2/vpcs", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list VPCs")
}

func TestVpc_CreateVpc_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateVpc(mock.Anything, mock.Anything).Return(&ec2.CreateVpcOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/vpcs", []byte(`{"CidrBlock":"10.0.0.0/16"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_CreateVpc_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateVpc(mock.Anything, mock.Anything).Return(nil, errors.New("create vpc error"))

	w := performEC2Request(handler, "POST", "/ec2/vpcs", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create VPC")
}

func TestVpc_DeleteVpc_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteVpc(mock.Anything, mock.Anything).Return(&ec2.DeleteVpcOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/vpcs/vpc-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DeleteVpc_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteVpc(mock.Anything, mock.Anything).Return(nil, errors.New("delete vpc error"))

	w := performEC2Request(handler, "DELETE", "/ec2/vpcs/vpc-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete VPC")
}

// ---------------------------------------------------------------------------
// Subnets
// ---------------------------------------------------------------------------

func TestVpc_ListSubnets_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeSubnets(mock.Anything, mock.Anything).Return(&ec2.DescribeSubnetsOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/subnets", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_ListSubnets_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeSubnets(mock.Anything, mock.Anything).Return(nil, errors.New("list subnets error"))

	w := performEC2Request(handler, "GET", "/ec2/subnets", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list subnets")
}

func TestVpc_CreateSubnet_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateSubnet(mock.Anything, mock.Anything).Return(&ec2.CreateSubnetOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/subnets", []byte(`{"VpcId":"vpc-123","CidrBlock":"10.0.1.0/24"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_CreateSubnet_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateSubnet(mock.Anything, mock.Anything).Return(nil, errors.New("create subnet error"))

	w := performEC2Request(handler, "POST", "/ec2/subnets", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create subnet")
}

func TestVpc_DeleteSubnet_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteSubnet(mock.Anything, mock.Anything).Return(&ec2.DeleteSubnetOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/subnets/subnet-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DeleteSubnet_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteSubnet(mock.Anything, mock.Anything).Return(nil, errors.New("delete subnet error"))

	w := performEC2Request(handler, "DELETE", "/ec2/subnets/subnet-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete subnet")
}

// ---------------------------------------------------------------------------
// Route Tables
// ---------------------------------------------------------------------------

func TestVpc_ListRouteTables_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeRouteTables(mock.Anything, mock.Anything).Return(&ec2.DescribeRouteTablesOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/route-tables", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_ListRouteTables_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeRouteTables(mock.Anything, mock.Anything).Return(nil, errors.New("list route tables error"))

	w := performEC2Request(handler, "GET", "/ec2/route-tables", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list route tables")
}

func TestVpc_CreateRouteTable_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateRouteTable(mock.Anything, mock.Anything).Return(&ec2.CreateRouteTableOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/route-tables", []byte(`{"VpcId":"vpc-123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_CreateRouteTable_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateRouteTable(mock.Anything, mock.Anything).Return(nil, errors.New("create route table error"))

	w := performEC2Request(handler, "POST", "/ec2/route-tables", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create route table")
}

func TestVpc_DeleteRouteTable_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteRouteTable(mock.Anything, mock.Anything).Return(&ec2.DeleteRouteTableOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/route-tables/rtb-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DeleteRouteTable_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteRouteTable(mock.Anything, mock.Anything).Return(nil, errors.New("delete route table error"))

	w := performEC2Request(handler, "DELETE", "/ec2/route-tables/rtb-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete route table")
}

func TestVpc_CreateRoute_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateRoute(mock.Anything, mock.Anything).Return(&ec2.CreateRouteOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/route-tables/rtb-123/routes", []byte(`{"DestinationCidrBlock":"0.0.0.0/0","GatewayId":"igw-123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_CreateRoute_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateRoute(mock.Anything, mock.Anything).Return(nil, errors.New("create route error"))

	w := performEC2Request(handler, "POST", "/ec2/route-tables/rtb-123/routes", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create route")
}

func TestVpc_DeleteRoute_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteRoute(mock.Anything, mock.Anything).Return(&ec2.DeleteRouteOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/route-tables/rtb-123/routes/0.0.0.0%2F0", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DeleteRoute_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteRoute(mock.Anything, mock.Anything).Return(nil, errors.New("delete route error"))

	w := performEC2Request(handler, "DELETE", "/ec2/route-tables/rtb-123/routes/0.0.0.0%2F0", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete route")
}

func TestVpc_AssociateRouteTable_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().AssociateRouteTable(mock.Anything, mock.Anything).Return(&ec2.AssociateRouteTableOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/route-tables/rtb-123/associate", []byte(`{"SubnetId":"subnet-123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_AssociateRouteTable_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().AssociateRouteTable(mock.Anything, mock.Anything).Return(nil, errors.New("associate route table error"))

	w := performEC2Request(handler, "POST", "/ec2/route-tables/rtb-123/associate", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to associate route table")
}

func TestVpc_DisassociateRouteTable_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DisassociateRouteTable(mock.Anything, mock.Anything).Return(&ec2.DisassociateRouteTableOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/route-tables/rtb-123/disassociate", []byte(`{"AssociationId":"rtbassoc-123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DisassociateRouteTable_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DisassociateRouteTable(mock.Anything, mock.Anything).Return(nil, errors.New("disassociate route table error"))

	w := performEC2Request(handler, "POST", "/ec2/route-tables/rtb-123/disassociate", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to disassociate route table")
}

// ---------------------------------------------------------------------------
// Internet Gateways
// ---------------------------------------------------------------------------

func TestVpc_ListInternetGateways_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeInternetGateways(mock.Anything, mock.Anything).Return(&ec2.DescribeInternetGatewaysOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/internet-gateways", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_ListInternetGateways_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeInternetGateways(mock.Anything, mock.Anything).Return(nil, errors.New("list igw error"))

	w := performEC2Request(handler, "GET", "/ec2/internet-gateways", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list internet gateways")
}

func TestVpc_CreateInternetGateway_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateInternetGateway(mock.Anything, mock.Anything).Return(&ec2.CreateInternetGatewayOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/internet-gateways", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_CreateInternetGateway_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateInternetGateway(mock.Anything, mock.Anything).Return(nil, errors.New("create igw error"))

	w := performEC2Request(handler, "POST", "/ec2/internet-gateways", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create internet gateway")
}

func TestVpc_DeleteInternetGateway_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteInternetGateway(mock.Anything, mock.Anything).Return(&ec2.DeleteInternetGatewayOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/internet-gateways/igw-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DeleteInternetGateway_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteInternetGateway(mock.Anything, mock.Anything).Return(nil, errors.New("delete igw error"))

	w := performEC2Request(handler, "DELETE", "/ec2/internet-gateways/igw-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete internet gateway")
}

func TestVpc_AttachInternetGateway_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().AttachInternetGateway(mock.Anything, mock.Anything).Return(&ec2.AttachInternetGatewayOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/internet-gateways/igw-123/attach", []byte(`{"VpcId":"vpc-123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_AttachInternetGateway_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().AttachInternetGateway(mock.Anything, mock.Anything).Return(nil, errors.New("attach igw error"))

	w := performEC2Request(handler, "POST", "/ec2/internet-gateways/igw-123/attach", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to attach internet gateway")
}

func TestVpc_DetachInternetGateway_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DetachInternetGateway(mock.Anything, mock.Anything).Return(&ec2.DetachInternetGatewayOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/internet-gateways/igw-123/detach", []byte(`{"VpcId":"vpc-123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DetachInternetGateway_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DetachInternetGateway(mock.Anything, mock.Anything).Return(nil, errors.New("detach igw error"))

	w := performEC2Request(handler, "POST", "/ec2/internet-gateways/igw-123/detach", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to detach internet gateway")
}

// ---------------------------------------------------------------------------
// NAT Gateways
// ---------------------------------------------------------------------------

func TestVpc_ListNatGateways_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeNatGateways(mock.Anything, mock.Anything).Return(&ec2.DescribeNatGatewaysOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/nat-gateways", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_ListNatGateways_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeNatGateways(mock.Anything, mock.Anything).Return(nil, errors.New("list nat gateways error"))

	w := performEC2Request(handler, "GET", "/ec2/nat-gateways", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list NAT gateways")
}

func TestVpc_CreateNatGateway_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateNatGateway(mock.Anything, mock.Anything).Return(&ec2.CreateNatGatewayOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/nat-gateways", []byte(`{"SubnetId":"subnet-123","AllocationId":"eipalloc-123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_CreateNatGateway_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateNatGateway(mock.Anything, mock.Anything).Return(nil, errors.New("create nat gateway error"))

	w := performEC2Request(handler, "POST", "/ec2/nat-gateways", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create NAT gateway")
}

func TestVpc_DeleteNatGateway_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteNatGateway(mock.Anything, mock.Anything).Return(&ec2.DeleteNatGatewayOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/nat-gateways/nat-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DeleteNatGateway_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteNatGateway(mock.Anything, mock.Anything).Return(nil, errors.New("delete nat gateway error"))

	w := performEC2Request(handler, "DELETE", "/ec2/nat-gateways/nat-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete NAT gateway")
}

// ---------------------------------------------------------------------------
// Network ACLs
// ---------------------------------------------------------------------------

func TestVpc_ListNetworkAcls_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeNetworkAcls(mock.Anything, mock.Anything).Return(&ec2.DescribeNetworkAclsOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/network-acls", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_ListNetworkAcls_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeNetworkAcls(mock.Anything, mock.Anything).Return(nil, errors.New("list network acls error"))

	w := performEC2Request(handler, "GET", "/ec2/network-acls", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list network ACLs")
}

func TestVpc_CreateNetworkAcl_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateNetworkAcl(mock.Anything, mock.Anything).Return(&ec2.CreateNetworkAclOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/network-acls", []byte(`{"VpcId":"vpc-123"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_CreateNetworkAcl_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateNetworkAcl(mock.Anything, mock.Anything).Return(nil, errors.New("create network acl error"))

	w := performEC2Request(handler, "POST", "/ec2/network-acls", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create network ACL")
}

func TestVpc_DeleteNetworkAcl_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteNetworkAcl(mock.Anything, mock.Anything).Return(&ec2.DeleteNetworkAclOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/network-acls/acl-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DeleteNetworkAcl_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteNetworkAcl(mock.Anything, mock.Anything).Return(nil, errors.New("delete network acl error"))

	w := performEC2Request(handler, "DELETE", "/ec2/network-acls/acl-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete network ACL")
}

func TestVpc_CreateNetworkAclEntry_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateNetworkAclEntry(mock.Anything, mock.Anything).Return(&ec2.CreateNetworkAclEntryOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/network-acls/acl-123/entries", []byte(`{"RuleNumber":100,"Protocol":"-1","RuleAction":"allow","CidrBlock":"0.0.0.0/0","Egress":false}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_CreateNetworkAclEntry_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateNetworkAclEntry(mock.Anything, mock.Anything).Return(nil, errors.New("create network acl entry error"))

	w := performEC2Request(handler, "POST", "/ec2/network-acls/acl-123/entries", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create network ACL entry")
}

func TestVpc_DeleteNetworkAclEntry_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteNetworkAclEntry(mock.Anything, mock.Anything).Return(&ec2.DeleteNetworkAclEntryOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/network-acls/acl-123/entries/100", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DeleteNetworkAclEntry_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteNetworkAclEntry(mock.Anything, mock.Anything).Return(nil, errors.New("delete network acl entry error"))

	w := performEC2Request(handler, "DELETE", "/ec2/network-acls/acl-123/entries/100", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete network ACL entry")
}

// ---------------------------------------------------------------------------
// VPC Flow Logs
// ---------------------------------------------------------------------------

func TestVpc_ListFlowLogs_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeFlowLogs(mock.Anything, mock.Anything).Return(&ec2.DescribeFlowLogsOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/flow-logs", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_ListFlowLogs_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeFlowLogs(mock.Anything, mock.Anything).Return(nil, &mockUnsupportedError{})

	w := performEC2Request(handler, "GET", "/ec2/flow-logs", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, true, resp["Unsupported"])
}

func TestVpc_CreateFlowLogs_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateFlowLogs(mock.Anything, mock.Anything).Return(&ec2.CreateFlowLogsOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/flow-logs", []byte(`{"ResourceIds":["vpc-123"],"ResourceType":"Vpc","TrafficType":"All","LogGroupName":"my-log-group"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_CreateFlowLogs_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().CreateFlowLogs(mock.Anything, mock.Anything).Return(nil, &mockUnsupportedError{})

	w := performEC2Request(handler, "POST", "/ec2/flow-logs", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, true, resp["Unsupported"])
}

func TestVpc_DeleteFlowLogs_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteFlowLogs(mock.Anything, mock.Anything).Return(&ec2.DeleteFlowLogsOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/flow-logs/fl-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_DeleteFlowLogs_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DeleteFlowLogs(mock.Anything, mock.Anything).Return(nil, &mockUnsupportedError{})

	w := performEC2Request(handler, "DELETE", "/ec2/flow-logs/fl-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Equal(t, true, resp["Unsupported"])
}

// ---------------------------------------------------------------------------
// Elastic IPs
// ---------------------------------------------------------------------------

func TestVpc_ListElasticIps_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeAddresses(mock.Anything, mock.Anything).Return(&ec2.DescribeAddressesOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/elastic-ips", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_ListElasticIps_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().DescribeAddresses(mock.Anything, mock.Anything).Return(nil, errors.New("list elastic ips error"))

	w := performEC2Request(handler, "GET", "/ec2/elastic-ips", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list Elastic IPs")
}

func TestVpc_AllocateElasticIp_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().AllocateAddress(mock.Anything, mock.Anything).Return(&ec2.AllocateAddressOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/elastic-ips", []byte(`{"Domain":"vpc"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_AllocateElasticIp_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().AllocateAddress(mock.Anything, mock.Anything).Return(nil, errors.New("allocate elastic ip error"))

	w := performEC2Request(handler, "POST", "/ec2/elastic-ips", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to allocate Elastic IP")
}

func TestVpc_ReleaseElasticIp_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().ReleaseAddress(mock.Anything, mock.Anything).Return(&ec2.ReleaseAddressOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/elastic-ips/eipalloc-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestVpc_ReleaseElasticIp_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupVpcTest(t)
	mp.EXPECT().ReleaseAddress(mock.Anything, mock.Anything).Return(nil, errors.New("release elastic ip error"))

	w := performEC2Request(handler, "DELETE", "/ec2/elastic-ips/eipalloc-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to release Elastic IP")
}

// ---------------------------------------------------------------------------
// Parse error — invalid JSON body returns 400 for all VPC actions that call parseBody
// ---------------------------------------------------------------------------

func TestVpc_ParseError(t *testing.T) {
	t.Parallel()

	routerActions := []struct {
		name   string
		method string
		path   string
	}{
		{name: "ListVpcs", method: "GET", path: "/ec2/vpcs"},
		{name: "CreateVpc", method: "POST", path: "/ec2/vpcs"},
		{name: "ListSubnets", method: "GET", path: "/ec2/subnets"},
		{name: "CreateSubnet", method: "POST", path: "/ec2/subnets"},
		{name: "ListRouteTables", method: "GET", path: "/ec2/route-tables"},
		{name: "CreateRouteTable", method: "POST", path: "/ec2/route-tables"},
		{name: "CreateRoute", method: "POST", path: "/ec2/route-tables/rtb-123/routes"},
		{name: "AssociateRouteTable", method: "POST", path: "/ec2/route-tables/rtb-123/associate"},
		{name: "DisassociateRouteTable", method: "POST", path: "/ec2/route-tables/rtb-123/disassociate"},
		{name: "ListInternetGateways", method: "GET", path: "/ec2/internet-gateways"},
		{name: "CreateInternetGateway", method: "POST", path: "/ec2/internet-gateways"},
		{name: "AttachInternetGateway", method: "POST", path: "/ec2/internet-gateways/igw-123/attach"},
		{name: "DetachInternetGateway", method: "POST", path: "/ec2/internet-gateways/igw-123/detach"},
		{name: "ListNatGateways", method: "GET", path: "/ec2/nat-gateways"},
		{name: "CreateNatGateway", method: "POST", path: "/ec2/nat-gateways"},
		{name: "ListNetworkAcls", method: "GET", path: "/ec2/network-acls"},
		{name: "CreateNetworkAcl", method: "POST", path: "/ec2/network-acls"},
		{name: "CreateNetworkAclEntry", method: "POST", path: "/ec2/network-acls/acl-123/entries"},
		{name: "ListFlowLogs", method: "GET", path: "/ec2/flow-logs"},
		{name: "CreateFlowLogs", method: "POST", path: "/ec2/flow-logs"},
		{name: "ListElasticIps", method: "GET", path: "/ec2/elastic-ips"},
		{name: "AllocateElasticIp", method: "POST", path: "/ec2/elastic-ips"},
	}

	for _, ra := range routerActions {
		ra := ra
		t.Run(ra.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupVpcTest(t)
			w := performEC2Request(handler, ra.method, ra.path, []byte(`{bad json`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "method=%s path=%s body=%s", ra.method, ra.path, w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}
