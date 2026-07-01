package aws

import (
	"context"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/my-devstack/mydevstack/pkg/proxy/internal/ports"
)

type VpcAdapter struct {
	client ports.VpcClientPort
}

func NewVpcAdapter(awsCfg aws.Config, endpoint string) ports.VpcPort {
	httpClient := &http.Client{Timeout: 30 * time.Second}
	client := ec2.NewFromConfig(awsCfg, func(o *ec2.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.HTTPClient = httpClient
	})
	return &VpcAdapter{client: client}
}

func (a *VpcAdapter) CreateVpc(ctx context.Context, input *ec2.CreateVpcInput) (*ec2.CreateVpcOutput, error) {
	return a.client.CreateVpc(ctx, input)
}

func (a *VpcAdapter) DescribeVpcs(ctx context.Context, input *ec2.DescribeVpcsInput) (*ec2.DescribeVpcsOutput, error) {
	return a.client.DescribeVpcs(ctx, input)
}

func (a *VpcAdapter) DeleteVpc(ctx context.Context, input *ec2.DeleteVpcInput) (*ec2.DeleteVpcOutput, error) {
	return a.client.DeleteVpc(ctx, input)
}

func (a *VpcAdapter) CreateSubnet(ctx context.Context, input *ec2.CreateSubnetInput) (*ec2.CreateSubnetOutput, error) {
	return a.client.CreateSubnet(ctx, input)
}

func (a *VpcAdapter) DescribeSubnets(ctx context.Context, input *ec2.DescribeSubnetsInput) (*ec2.DescribeSubnetsOutput, error) {
	return a.client.DescribeSubnets(ctx, input)
}

func (a *VpcAdapter) DeleteSubnet(ctx context.Context, input *ec2.DeleteSubnetInput) (*ec2.DeleteSubnetOutput, error) {
	return a.client.DeleteSubnet(ctx, input)
}

func (a *VpcAdapter) CreateRouteTable(ctx context.Context, input *ec2.CreateRouteTableInput) (*ec2.CreateRouteTableOutput, error) {
	return a.client.CreateRouteTable(ctx, input)
}

func (a *VpcAdapter) DescribeRouteTables(ctx context.Context, input *ec2.DescribeRouteTablesInput) (*ec2.DescribeRouteTablesOutput, error) {
	return a.client.DescribeRouteTables(ctx, input)
}

func (a *VpcAdapter) DeleteRouteTable(ctx context.Context, input *ec2.DeleteRouteTableInput) (*ec2.DeleteRouteTableOutput, error) {
	return a.client.DeleteRouteTable(ctx, input)
}

func (a *VpcAdapter) AssociateRouteTable(ctx context.Context, input *ec2.AssociateRouteTableInput) (*ec2.AssociateRouteTableOutput, error) {
	return a.client.AssociateRouteTable(ctx, input)
}

func (a *VpcAdapter) DisassociateRouteTable(ctx context.Context, input *ec2.DisassociateRouteTableInput) (*ec2.DisassociateRouteTableOutput, error) {
	return a.client.DisassociateRouteTable(ctx, input)
}

func (a *VpcAdapter) CreateRoute(ctx context.Context, input *ec2.CreateRouteInput) (*ec2.CreateRouteOutput, error) {
	return a.client.CreateRoute(ctx, input)
}

func (a *VpcAdapter) DeleteRoute(ctx context.Context, input *ec2.DeleteRouteInput) (*ec2.DeleteRouteOutput, error) {
	return a.client.DeleteRoute(ctx, input)
}

func (a *VpcAdapter) CreateInternetGateway(ctx context.Context, input *ec2.CreateInternetGatewayInput) (*ec2.CreateInternetGatewayOutput, error) {
	return a.client.CreateInternetGateway(ctx, input)
}

func (a *VpcAdapter) DescribeInternetGateways(ctx context.Context, input *ec2.DescribeInternetGatewaysInput) (*ec2.DescribeInternetGatewaysOutput, error) {
	return a.client.DescribeInternetGateways(ctx, input)
}

func (a *VpcAdapter) DeleteInternetGateway(ctx context.Context, input *ec2.DeleteInternetGatewayInput) (*ec2.DeleteInternetGatewayOutput, error) {
	return a.client.DeleteInternetGateway(ctx, input)
}

func (a *VpcAdapter) AttachInternetGateway(ctx context.Context, input *ec2.AttachInternetGatewayInput) (*ec2.AttachInternetGatewayOutput, error) {
	return a.client.AttachInternetGateway(ctx, input)
}

func (a *VpcAdapter) DetachInternetGateway(ctx context.Context, input *ec2.DetachInternetGatewayInput) (*ec2.DetachInternetGatewayOutput, error) {
	return a.client.DetachInternetGateway(ctx, input)
}

func (a *VpcAdapter) CreateNatGateway(ctx context.Context, input *ec2.CreateNatGatewayInput) (*ec2.CreateNatGatewayOutput, error) {
	return a.client.CreateNatGateway(ctx, input)
}

func (a *VpcAdapter) DescribeNatGateways(ctx context.Context, input *ec2.DescribeNatGatewaysInput) (*ec2.DescribeNatGatewaysOutput, error) {
	return a.client.DescribeNatGateways(ctx, input)
}

func (a *VpcAdapter) DeleteNatGateway(ctx context.Context, input *ec2.DeleteNatGatewayInput) (*ec2.DeleteNatGatewayOutput, error) {
	return a.client.DeleteNatGateway(ctx, input)
}

func (a *VpcAdapter) CreateNetworkAcl(ctx context.Context, input *ec2.CreateNetworkAclInput) (*ec2.CreateNetworkAclOutput, error) {
	return a.client.CreateNetworkAcl(ctx, input)
}

func (a *VpcAdapter) DescribeNetworkAcls(ctx context.Context, input *ec2.DescribeNetworkAclsInput) (*ec2.DescribeNetworkAclsOutput, error) {
	return a.client.DescribeNetworkAcls(ctx, input)
}

func (a *VpcAdapter) DeleteNetworkAcl(ctx context.Context, input *ec2.DeleteNetworkAclInput) (*ec2.DeleteNetworkAclOutput, error) {
	return a.client.DeleteNetworkAcl(ctx, input)
}

func (a *VpcAdapter) CreateNetworkAclEntry(ctx context.Context, input *ec2.CreateNetworkAclEntryInput) (*ec2.CreateNetworkAclEntryOutput, error) {
	return a.client.CreateNetworkAclEntry(ctx, input)
}

func (a *VpcAdapter) DeleteNetworkAclEntry(ctx context.Context, input *ec2.DeleteNetworkAclEntryInput) (*ec2.DeleteNetworkAclEntryOutput, error) {
	return a.client.DeleteNetworkAclEntry(ctx, input)
}

func (a *VpcAdapter) CreateFlowLogs(ctx context.Context, input *ec2.CreateFlowLogsInput) (*ec2.CreateFlowLogsOutput, error) {
	return a.client.CreateFlowLogs(ctx, input)
}

func (a *VpcAdapter) DescribeFlowLogs(ctx context.Context, input *ec2.DescribeFlowLogsInput) (*ec2.DescribeFlowLogsOutput, error) {
	return a.client.DescribeFlowLogs(ctx, input)
}

func (a *VpcAdapter) DeleteFlowLogs(ctx context.Context, input *ec2.DeleteFlowLogsInput) (*ec2.DeleteFlowLogsOutput, error) {
	return a.client.DeleteFlowLogs(ctx, input)
}

func (a *VpcAdapter) AllocateAddress(ctx context.Context, input *ec2.AllocateAddressInput) (*ec2.AllocateAddressOutput, error) {
	return a.client.AllocateAddress(ctx, input)
}

func (a *VpcAdapter) DescribeAddresses(ctx context.Context, input *ec2.DescribeAddressesInput) (*ec2.DescribeAddressesOutput, error) {
	return a.client.DescribeAddresses(ctx, input)
}

func (a *VpcAdapter) ReleaseAddress(ctx context.Context, input *ec2.ReleaseAddressInput) (*ec2.ReleaseAddressOutput, error) {
	return a.client.ReleaseAddress(ctx, input)
}
