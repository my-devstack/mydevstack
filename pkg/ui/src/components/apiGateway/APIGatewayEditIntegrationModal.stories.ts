import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayEditIntegrationModal from './APIGatewayEditIntegrationModal.vue';

const meta: Meta<typeof APIGatewayEditIntegrationModal> = {
  title: 'Services/APIGateway/EditIntegrationModal',
  component: APIGatewayEditIntegrationModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockIntegration = {
  integrationId: 'int-123',
  integrationType: 'AWS_PROXY',
  integrationUri: 'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:my-fn/invocations',
  integrationMethod: 'POST',
  description: 'My integration'
};

export const Default: Story = {
  args: { open: true, ...mockIntegration, loading: false },
  render: (args) => ({ components: { APIGatewayEditIntegrationModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayEditIntegrationModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, ...mockIntegration, loading: true },
  render: (args) => ({ components: { APIGatewayEditIntegrationModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayEditIntegrationModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, integrationId: 'int-123', loading: false },
  render: (args) => ({ components: { APIGatewayEditIntegrationModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayEditIntegrationModal v-bind="args" /></div>' })
};