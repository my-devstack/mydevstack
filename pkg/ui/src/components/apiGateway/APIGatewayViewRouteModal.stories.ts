import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayViewRouteModal from './APIGatewayViewRouteModal.vue';

const meta: Meta<typeof APIGatewayViewRouteModal> = {
  title: 'Services/APIGateway/ViewRouteModal',
  component: APIGatewayViewRouteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockRoute = {
  routeKey: 'GET /pets',
  target: 'integrations/int-123',
  authorizationType: 'JWT',
  authorizerId: 'auth-1'
};

export const Default: Story = {
  args: { open: true, route: mockRoute, loading: false },
  render: (args) => ({ components: { APIGatewayViewRouteModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewRouteModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, route: null, loading: true },
  render: (args) => ({ components: { APIGatewayViewRouteModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewRouteModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, route: null, loading: false },
  render: (args) => ({ components: { APIGatewayViewRouteModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewRouteModal v-bind="args" /></div>' })
};