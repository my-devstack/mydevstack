import type { Meta, StoryObj } from '@storybook/vue3-vite';
import APIGatewayEditRouteModal from './APIGatewayEditRouteModal.vue';

const meta: Meta<typeof APIGatewayEditRouteModal> = {
  title: 'Services/APIGateway/EditRouteModal',
  component: APIGatewayEditRouteModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true, routeKey: 'GET /users', authorizationType: 'NONE', authorizerId: '', loading: false },
  render: (args) => ({ components: { APIGatewayEditRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditRouteModal v-bind="args" /></div>' })
};

export const WithAuthorizer: Story = {
  args: { open: true, routeKey: 'POST /users', authorizationType: 'CUSTOM', authorizerId: 'authorizer-1', loading: false },
  render: (args) => ({ components: { APIGatewayEditRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditRouteModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, routeKey: 'GET /users', authorizationType: 'NONE', authorizerId: '', loading: true },
  render: (args) => ({ components: { APIGatewayEditRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditRouteModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, routeKey: 'GET /users', authorizationType: 'NONE', authorizerId: '', loading: false },
  render: (args) => ({ components: { APIGatewayEditRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditRouteModal v-bind="args" /></div>' })
};