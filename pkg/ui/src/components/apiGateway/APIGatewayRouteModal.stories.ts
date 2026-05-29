import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayRouteModal from './APIGatewayRouteModal.vue';

const meta: Meta<typeof APIGatewayRouteModal> = {
  title: 'Services/APIGateway/RouteModal',
  component: APIGatewayRouteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true, integrations: ['int-1', 'int-2'], loading: false, showMockTarget: true },
  render: (args) => ({ components: { APIGatewayRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayRouteModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, integrations: ['int-1'], loading: true, showMockTarget: true },
  render: (args) => ({ components: { APIGatewayRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayRouteModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, integrations: ['int-1'], loading: false, showMockTarget: false },
  render: (args) => ({ components: { APIGatewayRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayRouteModal v-bind="args" /></div>' })
};

export const NoIntegrations: Story = {
  args: { open: true, integrations: [], loading: false, showMockTarget: false },
  render: (args) => ({ components: { APIGatewayRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayRouteModal v-bind="args" /></div>' })
};