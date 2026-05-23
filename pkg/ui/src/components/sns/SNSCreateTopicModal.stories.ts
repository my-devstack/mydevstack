import type { Meta, StoryObj } from '@storybook/vue3';
import SNSCreateTopicModal from './SNSCreateTopicModal.vue';

const meta: Meta<typeof SNSCreateTopicModal> = {
  title: 'Services/SNS/CreateTopicModal',
  component: SNSCreateTopicModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { open: false, loading: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { SNSCreateTopicModal }, setup: () => ({ args }), template: '<div class="h-64"><SNSCreateTopicModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { SNSCreateTopicModal }, setup: () => ({ args }), template: '<div class="h-64"><SNSCreateTopicModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, loading: true },
  render: (args) => ({ components: { SNSCreateTopicModal }, setup: () => ({ args }), template: '<div class="h-64"><SNSCreateTopicModal v-bind="args" /></div>' })
};