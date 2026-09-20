import type { Meta, StoryObj } from '@storybook/vue3';
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
  args: { open: true, routeKey: 'GET /users', target: 'https://api.example.com', integrations: [], authorizationType: 'NONE', authorizerId: '', loading: false },
  render: (args) => ({ components: { APIGatewayEditRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditRouteModal v-bind="args" /></div>' })
};

export const IntegrationTarget: Story = {
  args: { open: true, routeKey: 'GET /users', target: 'integrations/int-1', integrations: ['int-1', 'int-2'], authorizationType: 'NONE', authorizerId: '', loading: false },
  render: (args) => ({ components: { APIGatewayEditRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditRouteModal v-bind="args" /></div>' })
};

export const WithAuthorizer: Story = {
  args: { open: true, routeKey: 'POST /users', target: 'integrations/int-1', integrations: ['int-1'], authorizationType: 'CUSTOM', authorizerId: 'authorizer-1', loading: false },
  render: (args) => ({ components: { APIGatewayEditRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditRouteModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, routeKey: 'GET /users', target: 'https://api.example.com', integrations: [], authorizationType: 'NONE', authorizerId: '', loading: true },
  render: (args) => ({ components: { APIGatewayEditRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditRouteModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, routeKey: 'GET /users', target: 'https://api.example.com', integrations: [], authorizationType: 'NONE', authorizerId: '', loading: false },
  render: (args) => ({ components: { APIGatewayEditRouteModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayEditRouteModal v-bind="args" /></div>' })
};
