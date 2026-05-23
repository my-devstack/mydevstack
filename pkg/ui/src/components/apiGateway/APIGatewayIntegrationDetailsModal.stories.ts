import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayIntegrationDetailsModal from './APIGatewayIntegrationDetailsModal.vue';

const meta: Meta<typeof APIGatewayIntegrationDetailsModal> = {
  title: 'Services/APIGateway/IntegrationDetailsModal',
  component: APIGatewayIntegrationDetailsModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockIntegration = {
  Type: 'HTTP_PROXY',
  Uri: 'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:myFunction/invocations',
  integrationHttpMethod: 'POST'
};

export const Open: Story = {
  args: { open: true, integrationData: mockIntegration },
  render: (args) => ({ components: { APIGatewayIntegrationDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayIntegrationDetailsModal v-bind="args" /></div>' })
};

export const LambdaIntegration: Story = {
  args: { open: true, integrationData: { Type: 'AWS', Uri: 'arn:aws:apigateway:lambda:function:myFunction', integrationHttpMethod: 'POST' } },
  render: (args) => ({ components: { APIGatewayIntegrationDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayIntegrationDetailsModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, integrationData: mockIntegration },
  render: (args) => ({ components: { APIGatewayIntegrationDetailsModal }, setup: () => ({ args }), template: '<div class="h-64"><APIGatewayIntegrationDetailsModal v-bind="args" /></div>' })
};