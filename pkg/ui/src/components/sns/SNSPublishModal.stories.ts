import type { Meta, StoryObj } from '@storybook/vue3';
import SNSPublishModal from './SNSPublishModal.vue';

const meta: Meta<typeof SNSPublishModal> = {
  title: 'Services/SNS/PublishModal',
  component: SNSPublishModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' } },
  args: { open: false }
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockTopic = { TopicName: 'my-topic' };

export const Open: Story = {
  args: { open: true, topic: mockTopic, form: { subject: '', message: '' } },
  render: (args) => ({ components: { SNSPublishModal }, setup: () => ({ args }), template: '<div class="h-64"><SNSPublishModal v-bind="args" /></div>' })
};

export const WithMessage: Story = {
  args: { open: true, topic: mockTopic, form: { subject: 'Test Subject', message: 'Hello World' } },
  render: (args) => ({ components: { SNSPublishModal }, setup: () => ({ args }), template: '<div class="h-64"><SNSPublishModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false, topic: mockTopic, form: { subject: '', message: '' } },
  render: (args) => ({ components: { SNSPublishModal }, setup: () => ({ args }), template: '<div class="h-64"><SNSPublishModal v-bind="args" /></div>' })
};