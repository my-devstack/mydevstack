import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayViewStageDetailModal from './APIGatewayViewStageDetailModal.vue';

const meta: Meta<typeof APIGatewayViewStageDetailModal> = {
  title: 'Services/APIGateway/ViewStageDetailModal',
  component: APIGatewayViewStageDetailModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStage = {
  stageName: 'prod',
  deploymentId: 'dep-123',
  createdDate: '2024-01-15T10:00:00Z',
  description: 'Production stage',
  cacheClusterEnabled: true,
  cacheClusterStatus: 'AVAILABLE',
  tracingEnabled: true,
  variables: { ENV: 'prod' }
};

export const Default: Story = {
  args: { open: true, stage: mockStage, loading: false },
  render: (args) => ({ components: { APIGatewayViewStageDetailModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewStageDetailModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, stage: null, loading: true },
  render: (args) => ({ components: { APIGatewayViewStageDetailModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewStageDetailModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, stage: null, loading: false },
  render: (args) => ({ components: { APIGatewayViewStageDetailModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayViewStageDetailModal v-bind="args" /></div>' })
};