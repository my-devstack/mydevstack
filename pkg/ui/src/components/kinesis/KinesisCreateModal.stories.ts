import type { Meta, StoryObj } from '@storybook/vue3';
import KinesisCreateModal from './KinesisCreateModal.vue';
import type { StreamForm } from '@/composables/useKinesis';

const defaultStream: StreamForm = { name: '', shardCount: 1 };

const meta: Meta<typeof KinesisCreateModal> = {
  title: 'Services/Kinesis/CreateModal',
  component: KinesisCreateModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, isLoading: { control: 'boolean' } },
  args: { open: false, isLoading: false, newStream: defaultStream }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: { open: true },
  render: (args) => ({ components: { KinesisCreateModal }, setup: () => ({ args }), template: '<div class="h-64"><KinesisCreateModal v-bind="args" /></div>' })
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => ({ components: { KinesisCreateModal }, setup: () => ({ args }), template: '<div class="h-64"><KinesisCreateModal v-bind="args" /></div>' })
};

export const Loading: Story = {
  args: { open: true, isLoading: true },
  render: (args) => ({ components: { KinesisCreateModal }, setup: () => ({ args }), template: '<div class="h-64"><KinesisCreateModal v-bind="args" /></div>' })
};