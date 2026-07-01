package aws

import (
	"context"
	"errors"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	vpcmocks "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
)

func TestNewVpcAdapter(t *testing.T) {
	adapter := NewVpcAdapter(aws.Config{Region: "us-east-1"}, "http://localhost:4566")
	assert.NotNil(t, adapter)
	assert.IsType(t, &VpcAdapter{}, adapter)
}

// ---------------------------------------------------------------------------
// CreateVpc
// ---------------------------------------------------------------------------

func TestVpcAdapter_CreateVpc(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateVpcInput{CidrBlock: aws.String("10.0.0.0/16")}
	expectedOutput := &ec2.CreateVpcOutput{Vpc: &types.Vpc{VpcId: aws.String("vpc-123")}}

	mockClient.EXPECT().CreateVpc(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateVpc(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_CreateVpc_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateVpcInput{}
	mockClient.EXPECT().CreateVpc(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateVpc(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeVpcs
// ---------------------------------------------------------------------------

func TestVpcAdapter_DescribeVpcs(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeVpcsInput{}
	expectedOutput := &ec2.DescribeVpcsOutput{
		Vpcs: []types.Vpc{{VpcId: aws.String("vpc-123")}},
	}

	mockClient.EXPECT().DescribeVpcs(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeVpcs(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DescribeVpcs_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeVpcsInput{}
	mockClient.EXPECT().DescribeVpcs(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeVpcs(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteVpc
// ---------------------------------------------------------------------------

func TestVpcAdapter_DeleteVpc(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteVpcInput{VpcId: aws.String("vpc-123")}
	expectedOutput := &ec2.DeleteVpcOutput{}

	mockClient.EXPECT().DeleteVpc(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteVpc(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DeleteVpc_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteVpcInput{}
	mockClient.EXPECT().DeleteVpc(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteVpc(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateSubnet
// ---------------------------------------------------------------------------

func TestVpcAdapter_CreateSubnet(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateSubnetInput{
		VpcId:     aws.String("vpc-123"),
		CidrBlock: aws.String("10.0.1.0/24"),
	}
	expectedOutput := &ec2.CreateSubnetOutput{Subnet: &types.Subnet{SubnetId: aws.String("subnet-123")}}

	mockClient.EXPECT().CreateSubnet(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateSubnet(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_CreateSubnet_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateSubnetInput{}
	mockClient.EXPECT().CreateSubnet(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateSubnet(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeSubnets
// ---------------------------------------------------------------------------

func TestVpcAdapter_DescribeSubnets(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeSubnetsInput{}
	expectedOutput := &ec2.DescribeSubnetsOutput{
		Subnets: []types.Subnet{{SubnetId: aws.String("subnet-123")}},
	}

	mockClient.EXPECT().DescribeSubnets(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeSubnets(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DescribeSubnets_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeSubnetsInput{}
	mockClient.EXPECT().DescribeSubnets(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeSubnets(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteSubnet
// ---------------------------------------------------------------------------

func TestVpcAdapter_DeleteSubnet(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteSubnetInput{SubnetId: aws.String("subnet-123")}
	expectedOutput := &ec2.DeleteSubnetOutput{}

	mockClient.EXPECT().DeleteSubnet(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteSubnet(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DeleteSubnet_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteSubnetInput{}
	mockClient.EXPECT().DeleteSubnet(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteSubnet(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateRouteTable
// ---------------------------------------------------------------------------

func TestVpcAdapter_CreateRouteTable(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateRouteTableInput{VpcId: aws.String("vpc-123")}
	expectedOutput := &ec2.CreateRouteTableOutput{RouteTable: &types.RouteTable{RouteTableId: aws.String("rtb-123")}}

	mockClient.EXPECT().CreateRouteTable(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateRouteTable(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_CreateRouteTable_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateRouteTableInput{}
	mockClient.EXPECT().CreateRouteTable(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateRouteTable(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeRouteTables
// ---------------------------------------------------------------------------

func TestVpcAdapter_DescribeRouteTables(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeRouteTablesInput{}
	expectedOutput := &ec2.DescribeRouteTablesOutput{
		RouteTables: []types.RouteTable{{RouteTableId: aws.String("rtb-123")}},
	}

	mockClient.EXPECT().DescribeRouteTables(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeRouteTables(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DescribeRouteTables_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeRouteTablesInput{}
	mockClient.EXPECT().DescribeRouteTables(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeRouteTables(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteRouteTable
// ---------------------------------------------------------------------------

func TestVpcAdapter_DeleteRouteTable(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteRouteTableInput{RouteTableId: aws.String("rtb-123")}
	expectedOutput := &ec2.DeleteRouteTableOutput{}

	mockClient.EXPECT().DeleteRouteTable(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteRouteTable(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DeleteRouteTable_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteRouteTableInput{}
	mockClient.EXPECT().DeleteRouteTable(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteRouteTable(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// AssociateRouteTable
// ---------------------------------------------------------------------------

func TestVpcAdapter_AssociateRouteTable(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.AssociateRouteTableInput{
		RouteTableId: aws.String("rtb-123"),
		SubnetId:     aws.String("subnet-123"),
	}
	expectedOutput := &ec2.AssociateRouteTableOutput{AssociationId: aws.String("rtbassoc-123")}

	mockClient.EXPECT().AssociateRouteTable(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.AssociateRouteTable(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_AssociateRouteTable_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.AssociateRouteTableInput{}
	mockClient.EXPECT().AssociateRouteTable(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.AssociateRouteTable(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DisassociateRouteTable
// ---------------------------------------------------------------------------

func TestVpcAdapter_DisassociateRouteTable(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DisassociateRouteTableInput{AssociationId: aws.String("rtbassoc-123")}
	expectedOutput := &ec2.DisassociateRouteTableOutput{}

	mockClient.EXPECT().DisassociateRouteTable(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DisassociateRouteTable(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DisassociateRouteTable_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DisassociateRouteTableInput{}
	mockClient.EXPECT().DisassociateRouteTable(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DisassociateRouteTable(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateRoute
// ---------------------------------------------------------------------------

func TestVpcAdapter_CreateRoute(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateRouteInput{
		RouteTableId:         aws.String("rtb-123"),
		DestinationCidrBlock: aws.String("0.0.0.0/0"),
		GatewayId:            aws.String("igw-123"),
	}
	expectedOutput := &ec2.CreateRouteOutput{Return: aws.Bool(true)}

	mockClient.EXPECT().CreateRoute(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateRoute(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_CreateRoute_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateRouteInput{}
	mockClient.EXPECT().CreateRoute(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateRoute(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteRoute
// ---------------------------------------------------------------------------

func TestVpcAdapter_DeleteRoute(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteRouteInput{
		RouteTableId:         aws.String("rtb-123"),
		DestinationCidrBlock: aws.String("0.0.0.0/0"),
	}
	expectedOutput := &ec2.DeleteRouteOutput{}

	mockClient.EXPECT().DeleteRoute(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteRoute(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DeleteRoute_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteRouteInput{}
	mockClient.EXPECT().DeleteRoute(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteRoute(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateInternetGateway
// ---------------------------------------------------------------------------

func TestVpcAdapter_CreateInternetGateway(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateInternetGatewayInput{}
	expectedOutput := &ec2.CreateInternetGatewayOutput{InternetGateway: &types.InternetGateway{InternetGatewayId: aws.String("igw-123")}}

	mockClient.EXPECT().CreateInternetGateway(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateInternetGateway(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_CreateInternetGateway_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateInternetGatewayInput{}
	mockClient.EXPECT().CreateInternetGateway(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateInternetGateway(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeInternetGateways
// ---------------------------------------------------------------------------

func TestVpcAdapter_DescribeInternetGateways(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeInternetGatewaysInput{}
	expectedOutput := &ec2.DescribeInternetGatewaysOutput{
		InternetGateways: []types.InternetGateway{{InternetGatewayId: aws.String("igw-123")}},
	}

	mockClient.EXPECT().DescribeInternetGateways(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeInternetGateways(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DescribeInternetGateways_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeInternetGatewaysInput{}
	mockClient.EXPECT().DescribeInternetGateways(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeInternetGateways(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteInternetGateway
// ---------------------------------------------------------------------------

func TestVpcAdapter_DeleteInternetGateway(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteInternetGatewayInput{InternetGatewayId: aws.String("igw-123")}
	expectedOutput := &ec2.DeleteInternetGatewayOutput{}

	mockClient.EXPECT().DeleteInternetGateway(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteInternetGateway(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DeleteInternetGateway_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteInternetGatewayInput{}
	mockClient.EXPECT().DeleteInternetGateway(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteInternetGateway(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// AttachInternetGateway
// ---------------------------------------------------------------------------

func TestVpcAdapter_AttachInternetGateway(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.AttachInternetGatewayInput{
		InternetGatewayId: aws.String("igw-123"),
		VpcId:             aws.String("vpc-123"),
	}
	expectedOutput := &ec2.AttachInternetGatewayOutput{}

	mockClient.EXPECT().AttachInternetGateway(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.AttachInternetGateway(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_AttachInternetGateway_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.AttachInternetGatewayInput{}
	mockClient.EXPECT().AttachInternetGateway(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.AttachInternetGateway(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DetachInternetGateway
// ---------------------------------------------------------------------------

func TestVpcAdapter_DetachInternetGateway(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DetachInternetGatewayInput{
		InternetGatewayId: aws.String("igw-123"),
		VpcId:             aws.String("vpc-123"),
	}
	expectedOutput := &ec2.DetachInternetGatewayOutput{}

	mockClient.EXPECT().DetachInternetGateway(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DetachInternetGateway(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DetachInternetGateway_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DetachInternetGatewayInput{}
	mockClient.EXPECT().DetachInternetGateway(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DetachInternetGateway(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateNatGateway
// ---------------------------------------------------------------------------

func TestVpcAdapter_CreateNatGateway(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateNatGatewayInput{
		SubnetId:     aws.String("subnet-123"),
		AllocationId: aws.String("eipalloc-123"),
	}
	expectedOutput := &ec2.CreateNatGatewayOutput{NatGateway: &types.NatGateway{NatGatewayId: aws.String("nat-123")}}

	mockClient.EXPECT().CreateNatGateway(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateNatGateway(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_CreateNatGateway_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateNatGatewayInput{}
	mockClient.EXPECT().CreateNatGateway(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateNatGateway(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeNatGateways
// ---------------------------------------------------------------------------

func TestVpcAdapter_DescribeNatGateways(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeNatGatewaysInput{}
	expectedOutput := &ec2.DescribeNatGatewaysOutput{
		NatGateways: []types.NatGateway{{NatGatewayId: aws.String("nat-123")}},
	}

	mockClient.EXPECT().DescribeNatGateways(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeNatGateways(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DescribeNatGateways_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeNatGatewaysInput{}
	mockClient.EXPECT().DescribeNatGateways(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeNatGateways(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteNatGateway
// ---------------------------------------------------------------------------

func TestVpcAdapter_DeleteNatGateway(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteNatGatewayInput{NatGatewayId: aws.String("nat-123")}
	expectedOutput := &ec2.DeleteNatGatewayOutput{}

	mockClient.EXPECT().DeleteNatGateway(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteNatGateway(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DeleteNatGateway_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteNatGatewayInput{}
	mockClient.EXPECT().DeleteNatGateway(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteNatGateway(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateNetworkAcl
// ---------------------------------------------------------------------------

func TestVpcAdapter_CreateNetworkAcl(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateNetworkAclInput{VpcId: aws.String("vpc-123")}
	expectedOutput := &ec2.CreateNetworkAclOutput{NetworkAcl: &types.NetworkAcl{NetworkAclId: aws.String("acl-123")}}

	mockClient.EXPECT().CreateNetworkAcl(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateNetworkAcl(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_CreateNetworkAcl_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateNetworkAclInput{}
	mockClient.EXPECT().CreateNetworkAcl(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateNetworkAcl(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeNetworkAcls
// ---------------------------------------------------------------------------

func TestVpcAdapter_DescribeNetworkAcls(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeNetworkAclsInput{}
	expectedOutput := &ec2.DescribeNetworkAclsOutput{
		NetworkAcls: []types.NetworkAcl{{NetworkAclId: aws.String("acl-123")}},
	}

	mockClient.EXPECT().DescribeNetworkAcls(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeNetworkAcls(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DescribeNetworkAcls_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeNetworkAclsInput{}
	mockClient.EXPECT().DescribeNetworkAcls(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeNetworkAcls(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteNetworkAcl
// ---------------------------------------------------------------------------

func TestVpcAdapter_DeleteNetworkAcl(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteNetworkAclInput{NetworkAclId: aws.String("acl-123")}
	expectedOutput := &ec2.DeleteNetworkAclOutput{}

	mockClient.EXPECT().DeleteNetworkAcl(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteNetworkAcl(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DeleteNetworkAcl_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteNetworkAclInput{}
	mockClient.EXPECT().DeleteNetworkAcl(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteNetworkAcl(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateNetworkAclEntry
// ---------------------------------------------------------------------------

func TestVpcAdapter_CreateNetworkAclEntry(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateNetworkAclEntryInput{
		NetworkAclId: aws.String("acl-123"),
		RuleNumber:   aws.Int32(100),
		Protocol:     aws.String("-1"),
		RuleAction:   types.RuleActionAllow,
		CidrBlock:    aws.String("0.0.0.0/0"),
		Egress:       aws.Bool(false),
	}
	expectedOutput := &ec2.CreateNetworkAclEntryOutput{}

	mockClient.EXPECT().CreateNetworkAclEntry(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateNetworkAclEntry(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_CreateNetworkAclEntry_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateNetworkAclEntryInput{}
	mockClient.EXPECT().CreateNetworkAclEntry(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateNetworkAclEntry(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteNetworkAclEntry
// ---------------------------------------------------------------------------

func TestVpcAdapter_DeleteNetworkAclEntry(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteNetworkAclEntryInput{
		NetworkAclId: aws.String("acl-123"),
		RuleNumber:   aws.Int32(100),
		Egress:       aws.Bool(false),
	}
	expectedOutput := &ec2.DeleteNetworkAclEntryOutput{}

	mockClient.EXPECT().DeleteNetworkAclEntry(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteNetworkAclEntry(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DeleteNetworkAclEntry_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteNetworkAclEntryInput{}
	mockClient.EXPECT().DeleteNetworkAclEntry(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteNetworkAclEntry(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// CreateFlowLogs
// ---------------------------------------------------------------------------

func TestVpcAdapter_CreateFlowLogs(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateFlowLogsInput{
		ResourceIds:     []string{"vpc-123"},
		ResourceType:    types.FlowLogsResourceTypeVpc,
		TrafficType:     types.TrafficTypeAll,
		LogGroupName:    aws.String("my-log-group"),
		DeliverLogsPermissionArn: aws.String("arn:aws:iam::123:role/FlowLogsRole"),
	}
	expectedOutput := &ec2.CreateFlowLogsOutput{FlowLogIds: []string{"fl-123"}}

	mockClient.EXPECT().CreateFlowLogs(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateFlowLogs(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_CreateFlowLogs_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.CreateFlowLogsInput{}
	mockClient.EXPECT().CreateFlowLogs(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.CreateFlowLogs(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeFlowLogs
// ---------------------------------------------------------------------------

func TestVpcAdapter_DescribeFlowLogs(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeFlowLogsInput{}
	expectedOutput := &ec2.DescribeFlowLogsOutput{
		FlowLogs: []types.FlowLog{{FlowLogId: aws.String("fl-123")}},
	}

	mockClient.EXPECT().DescribeFlowLogs(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeFlowLogs(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DescribeFlowLogs_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeFlowLogsInput{}
	mockClient.EXPECT().DescribeFlowLogs(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeFlowLogs(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DeleteFlowLogs
// ---------------------------------------------------------------------------

func TestVpcAdapter_DeleteFlowLogs(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteFlowLogsInput{FlowLogIds: []string{"fl-123"}}
	expectedOutput := &ec2.DeleteFlowLogsOutput{}

	mockClient.EXPECT().DeleteFlowLogs(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteFlowLogs(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DeleteFlowLogs_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DeleteFlowLogsInput{}
	mockClient.EXPECT().DeleteFlowLogs(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DeleteFlowLogs(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// AllocateAddress
// ---------------------------------------------------------------------------

func TestVpcAdapter_AllocateAddress(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.AllocateAddressInput{Domain: types.DomainTypeVpc}
	expectedOutput := &ec2.AllocateAddressOutput{
		AllocationId: aws.String("eipalloc-123"),
		PublicIp:     aws.String("203.0.113.1"),
	}

	mockClient.EXPECT().AllocateAddress(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.AllocateAddress(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_AllocateAddress_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.AllocateAddressInput{}
	mockClient.EXPECT().AllocateAddress(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.AllocateAddress(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// DescribeAddresses
// ---------------------------------------------------------------------------

func TestVpcAdapter_DescribeAddresses(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeAddressesInput{}
	expectedOutput := &ec2.DescribeAddressesOutput{
		Addresses: []types.Address{{AllocationId: aws.String("eipalloc-123")}},
	}

	mockClient.EXPECT().DescribeAddresses(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeAddresses(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_DescribeAddresses_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.DescribeAddressesInput{}
	mockClient.EXPECT().DescribeAddresses(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.DescribeAddresses(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}

// ---------------------------------------------------------------------------
// ReleaseAddress
// ---------------------------------------------------------------------------

func TestVpcAdapter_ReleaseAddress(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.ReleaseAddressInput{AllocationId: aws.String("eipalloc-123")}
	expectedOutput := &ec2.ReleaseAddressOutput{}

	mockClient.EXPECT().ReleaseAddress(ctx, input).Return(expectedOutput, nil)
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.ReleaseAddress(ctx, input)
	assert.NoError(t, err)
	assert.Equal(t, expectedOutput, output)
}

func TestVpcAdapter_ReleaseAddress_Error(t *testing.T) {
	mockClient := vpcmocks.NewVpcClientPort(t)
	ctx := context.Background()
	input := &ec2.ReleaseAddressInput{}
	mockClient.EXPECT().ReleaseAddress(ctx, input).Return(nil, errors.New("some error"))
	adapter := &VpcAdapter{client: mockClient}

	output, err := adapter.ReleaseAddress(ctx, input)
	assert.Error(t, err)
	assert.Nil(t, output)
}
