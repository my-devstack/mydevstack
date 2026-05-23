import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayRoutesModal from './APIGatewayRoutesModal.vue';

const meta: Meta<typeof APIGatewayRoutesModal> = {
  title: 'Services/APIGateway/RoutesModal',
  component: APIGatewayRoutesModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const routes = [
  { routeKey: 'GET /users', routeId: 'route-1', authorizationType: 'NONE' },
  { routeKey: 'POST /users', routeId: 'route-2', authorizationType: 'AWS_IAM' },
  { routeKey: 'GET /users/{id}', routeId: 'route-3', authorizationType: 'NONE' }
];

export const Open: Story = {
  args: { open: true, apiName: 'my-api', routes, loading: false },
  render: (args) => ({ components: { APIGatewayRoutesModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayRoutesModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, apiName: 'my-api', routes: [], loading: true },
  render: (args) => ({ components: { APIGatewayRoutesModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayRoutesModal v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: { open: true, apiName: 'my-api', routes: [], loading: false },
  render: (args) => ({ components: { APIGatewayRoutesModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayRoutesModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, apiName: 'my-api', routes, loading: false },
  render: (args) => ({ components: { APIGatewayRoutesModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayRoutesModal v-bind="args" /></div>' })
};