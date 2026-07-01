import type { Meta, StoryObj } from '@storybook/vue3';
import VPCRouteTableDetailModal from './VPCRouteTableDetailModal.vue';

const meta: Meta<typeof VPCRouteTableDetailModal> = {
  title: 'Services/VPC/RouteTableDetailModal',
  component: VPCRouteTableDetailModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    open: true,
    routeTable: {
      RouteTableId: 'rtb-12345678',
      VpcId: 'vpc-12345678',
      Routes: [
        { DestinationCidrBlock: '10.0.0.0/16', GatewayId: 'local', State: 'active' },
        { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-12345678', State: 'active' },
      ],
      Associations: [
        { RouteTableAssociationId: 'rtbassoc-123', SubnetId: 'subnet-12345678', Main: false, AssociationState: { State: 'associated' } },
        { RouteTableAssociationId: 'rtbassoc-456', SubnetId: undefined, Main: true, AssociationState: { State: 'associated' } },
      ],
    },
  },
  render: (args) => ({ components: { VPCRouteTableDetailModal }, setup: () => ({ args }), template: '<div class="h-96"><VPCRouteTableDetailModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { VPCRouteTableDetailModal }, setup: () => ({ args }), template: '<div class="h-96"><VPCRouteTableDetailModal v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: {
    open: true,
    routeTable: {
      RouteTableId: 'rtb-empty',
      VpcId: 'vpc-12345678',
      Routes: [],
      Associations: [],
    },
  },
  render: (args) => ({ components: { VPCRouteTableDetailModal }, setup: () => ({ args }), template: '<div class="h-96"><VPCRouteTableDetailModal v-bind="args" /></div>' })
};
