import type { Meta, StoryObj } from '@storybook/vue3';
import APIGatewayEditStageDetailModal from './APIGatewayEditStageDetailModal.vue';

const meta: Meta<typeof APIGatewayEditStageDetailModal> = {
  title: 'Services/APIGateway/EditStageDetailModal',
  component: APIGatewayEditStageDetailModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockStage = {
  stageName: 'prod',
  description: 'Production stage',
  deploymentId: 'dep-123'
};

export const Default: Story = {
  args: { open: true, stageName: mockStage.stageName, description: mockStage.description, deploymentId: mockStage.deploymentId, loading: false },
  render: (args) => ({ components: { APIGatewayEditStageDetailModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayEditStageDetailModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, stageName: mockStage.stageName, description: mockStage.description, deploymentId: mockStage.deploymentId, loading: true },
  render: (args) => ({ components: { APIGatewayEditStageDetailModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayEditStageDetailModal v-bind="args" /></div>' })
};

export const Error: Story = {
  args: { open: true, stageName: '', description: '', deploymentId: '', loading: false },
  render: (args) => ({ components: { APIGatewayEditStageDetailModal }, setup: () => ({ args }), template: '<div class="h-96"><APIGatewayEditStageDetailModal v-bind="args" /></div>' })
};