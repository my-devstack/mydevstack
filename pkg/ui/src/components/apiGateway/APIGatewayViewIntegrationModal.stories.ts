import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayViewIntegrationModal from './APIGatewayViewIntegrationModal.vue';

const meta: Meta<typeof APIGatewayViewIntegrationModal> = {
  title: 'Services/APIGateway/ViewIntegrationModal',
  component: APIGatewayViewIntegrationModal,
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
  payloadFormatVersion: '2.0',
  timeoutInMillis: 29000,
  connectionType: 'INTERNET',
  connectionId: '',
  credentialsArn: '',
  description: 'Lambda integration'
};

export const Default: Story = {
  args: { open: true, integration: mockIntegration, loading: false },
  render: (args) => ({ components: { APIGatewayViewIntegrationModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewIntegrationModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, integration: null, loading: true },
  render: (args) => ({ components: { APIGatewayViewIntegrationModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewIntegrationModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, integration: null, loading: false },
  render: (args) => ({ components: { APIGatewayViewIntegrationModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewIntegrationModal v-bind="args" /></div>' })
};