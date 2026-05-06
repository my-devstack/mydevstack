import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SQSMessagesModal from './SQSMessagesModal.vue';

const meta: Meta<typeof SQSMessagesModal> = {
  title: 'Services/SQS/MessagesModal',
  component: SQSMessagesModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockMessages = [
  { MessageId: 'msg-1', Body: '{"order": "123"}', ReceiptHandle: 'handle-1' },
  { MessageId: 'msg-2', Body: '{"order": "456"}', ReceiptHandle: 'handle-2' }
];

export const Open: Story = {
  args: { open: true, queueName: 'my-queue', messages: mockMessages, loading: false },
  render: (args) => ({ components: { SQSMessagesModal }, setup: () => ({ args }), template: '<div class="h-96"><SQSMessagesModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, queueName: 'my-queue', messages: [], loading: true },
  render: (args) => ({ components: { SQSMessagesModal }, setup: () => ({ args }), template: '<div class="h-96"><SQSMessagesModal v-bind="args" /></div>' })
};

export const Empty: Story = {
  args: { open: true, queueName: 'my-queue', messages: [], loading: false },
  render: (args) => ({ components: { SQSMessagesModal }, setup: () => ({ args }), template: '<div class="h-96"><SQSMessagesModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, queueName: 'my-queue', messages: mockMessages, loading: false },
  render: (args) => ({ components: { SQSMessagesModal }, setup: () => ({ args }), template: '<div class="h-96"><SQSMessagesModal v-bind="args" /></div>' })
};